from __future__ import annotations

import argparse
import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from core.drift_features import compute_handcrafted_features, run_drift_pca
from core.image_metrics import compute_image_quality_metrics, is_blurry, is_low_contrast
from core.mask_metrics import compute_mask_quality_metrics
from core.perceptual_hash import phash_image, sha256_file
from core.report_generator import render_markdown_report
from core.split_analysis import find_cross_split_duplicates


def _collect_pairs(archive_root: Path) -> list[dict[str, Any]]:
    pairs: list[dict[str, Any]] = []
    for image_path in archive_root.rglob("*_endo.png"):
        if image_path.name.endswith(("_endo_mask.png", "_endo_color_mask.png", "_endo_watershed_mask.png")):
            continue
        mask_path = image_path.with_name(image_path.name.replace("_endo.png", "_endo_mask.png"))
        sample_id = str(image_path.relative_to(archive_root)).replace("\\", "/").removesuffix("_endo.png")
        video_id = image_path.parts[-3] if len(image_path.parts) >= 3 else "unknown"
        pairs.append(
            {
                "sample_id": sample_id,
                "video_id": video_id,
                "image_path": image_path,
                "mask_path": mask_path if mask_path.exists() else None,
                "split": "unknown",
            }
        )
    return sorted(pairs, key=lambda x: x["sample_id"])


def _assign_splits(samples: list[dict[str, Any]]) -> None:
    videos = sorted({s["video_id"] for s in samples})
    n = len(videos)
    train_cut = max(1, int(0.7 * n))
    val_cut = max(train_cut + 1, int(0.85 * n))
    train_v = set(videos[:train_cut])
    val_v = set(videos[train_cut:val_cut])
    for s in samples:
        if s["video_id"] in train_v:
            s["split"] = "train"
        elif s["video_id"] in val_v:
            s["split"] = "val"
        else:
            s["split"] = "test"


def run_benchmark(archive_root: Path, output_dir: Path, max_samples: int | None) -> dict[str, Any]:
    t0 = time.perf_counter()
    samples = _collect_pairs(archive_root)
    if max_samples is not None:
        samples = samples[:max_samples]
    _assign_splits(samples)

    issues: list[dict[str, Any]] = []
    processed = 0
    for s in samples:
        image_path = s["image_path"]
        mask_path = s["mask_path"]

        if mask_path is None:
            issues.append(
                {
                    "severity": "high",
                    "category": "file_integrity",
                    "message": "Missing mask file for image.",
                    "sample_id": s["sample_id"],
                    "split": s["split"],
                }
            )
            continue

        img = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
        mask = cv2.imread(str(mask_path), cv2.IMREAD_UNCHANGED)
        if img is None:
            issues.append(
                {
                    "severity": "critical",
                    "category": "file_integrity",
                    "message": "Image unreadable/corrupt.",
                    "sample_id": s["sample_id"],
                    "split": s["split"],
                }
            )
            continue
        if mask is None:
            issues.append(
                {
                    "severity": "critical",
                    "category": "file_integrity",
                    "message": "Mask unreadable/corrupt.",
                    "sample_id": s["sample_id"],
                    "split": s["split"],
                }
            )
            continue

        iq = compute_image_quality_metrics(img)
        mq = compute_mask_quality_metrics(mask)

        if (iq.width, iq.height) != (mq.width, mq.height):
            issues.append(
                {
                    "severity": "high",
                    "category": "mask_quality",
                    "message": "Image and mask dimension mismatch.",
                    "sample_id": s["sample_id"],
                    "split": s["split"],
                }
            )
        if is_low_contrast(iq.std_luma):
            issues.append(
                {
                    "severity": "medium",
                    "category": "image_quality",
                    "message": f"Low contrast (std_luma={iq.std_luma:.2f}).",
                    "sample_id": s["sample_id"],
                    "split": s["split"],
                }
            )
        if is_blurry(iq.blur_score):
            issues.append(
                {
                    "severity": "medium",
                    "category": "image_quality",
                    "message": f"Blurry image (lap_var={iq.blur_score:.2f}).",
                    "sample_id": s["sample_id"],
                    "split": s["split"],
                }
            )
        if mq.empty:
            issues.append(
                {
                    "severity": "high",
                    "category": "mask_quality",
                    "message": "Empty mask.",
                    "sample_id": s["sample_id"],
                    "split": s["split"],
                }
            )

        s["image_sha256"] = sha256_file(image_path)
        s["image_phash"] = phash_image(image_path)
        s["drift_features"] = compute_handcrafted_features(img)
        processed += 1

    duplicate_report = find_cross_split_duplicates(samples)
    drift_report = run_drift_pca(samples)

    for p in duplicate_report["exact_cross_split_pairs"]:
        issues.append(
            {
                "severity": "high",
                "category": "leakage",
                "message": "Exact cross-split duplicate detected.",
                "sample_id": p["sample_id_a"],
                "split": p["split_a"],
            }
        )
    for p in duplicate_report["near_duplicate_cross_split_pairs"]:
        issues.append(
            {
                "severity": "medium",
                "category": "leakage",
                "message": f"Near-duplicate cross-split pair (pHash distance={p['distance']}).",
                "sample_id": p["sample_id_a"],
                "split": p["split_a"],
            }
        )

    severity_weights = {"critical": 5, "high": 3, "medium": 1, "low": 0.5, "info": 0.2}
    weighted = sum(severity_weights.get(i["severity"], 1.0) for i in issues)
    denom = max(1, processed)
    risk_score = float(np.clip((weighted / denom) * 10.0, 0.0, 100.0))

    elapsed = time.perf_counter() - t0
    audit = {
        "audit_id": str(uuid.uuid4()),
        "dataset_name": "CholecSeg8k (archive)",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "completed",
        "summary": {
            "num_images": processed,
            "num_masks": processed,
            "num_samples": len(samples),
            "risk_score": risk_score,
            "runtime_seconds": round(elapsed, 3),
            "throughput_samples_per_sec": round((processed / elapsed) if elapsed > 0 else 0.0, 3),
            "issue_count": len(issues),
        },
        "issues": issues,
        "duplicate_report": duplicate_report,
        "drift_report": drift_report,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "cholecseg8k_benchmark.json"
    md_path = output_dir / "cholecseg8k_benchmark.md"
    json_path.write_text(json.dumps(audit, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown_report(audit), encoding="utf-8")
    return {"audit": audit, "json_path": str(json_path), "md_path": str(md_path)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Run MedDataGuard benchmark on CholecSeg8k-style archive dataset.")
    parser.add_argument("--archive-root", default="archive", help="Path to dataset root folder.")
    parser.add_argument("--output-dir", default="reports/generated", help="Output directory for benchmark reports.")
    parser.add_argument("--max-samples", type=int, default=None, help="Optional cap for faster test runs.")
    args = parser.parse_args()

    result = run_benchmark(Path(args.archive_root), Path(args.output_dir), args.max_samples)
    summary = result["audit"]["summary"]
    print(f"Benchmark completed: {summary['num_samples']} samples, {summary['issue_count']} issues")
    print(f"Runtime: {summary['runtime_seconds']}s, Throughput: {summary['throughput_samples_per_sec']} samples/s")
    print(f"JSON: {result['json_path']}")
    print(f"Markdown: {result['md_path']}")


if __name__ == "__main__":
    main()
