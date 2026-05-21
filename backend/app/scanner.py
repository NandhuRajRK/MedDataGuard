from __future__ import annotations

import json
from typing import Any

import cv2
import numpy as np

from core.dataset_loader import (  # type: ignore
    build_sample_records,
    load_metadata,
    load_splits,
)

from .drift import compute_handcrafted_features, run_drift_pca
from .image_quality import compute_image_quality_metrics, is_blurry, is_low_contrast
from .leakage import find_cross_split_duplicates, find_metadata_group_leakage, phash_image, sha256_file
from .mask_quality import compute_mask_quality_metrics, find_invalid_class_ids
from .schemas import MaskFormat
from .utils import stable_id_from_parts, utc_now_iso


def _make_issue_id(category: str, sample_id: str | None, message: str) -> str:
    # Stable-ish issue ids allow deterministic tests and easier diffs.
    parts = [category, sample_id or "", message]
    return stable_id_from_parts(parts)


def _add_issue(
    issues: list[dict[str, Any]],
    *,
    category: str,
    severity: str,
    message: str,
    sample_id: str | None = None,
    split: str | None = None,
    evidence: dict[str, Any] | None = None,
) -> None:
    issues.append(
        {
            "issue_id": _make_issue_id(category, sample_id, message),
            "category": category,
            "severity": severity,
            "message": message,
            "sample_id": sample_id,
            "split": split,
            "evidence": evidence or {},
        }
    )


def _risk_score_from_issues(issues: list[dict[str, Any]]) -> float:
    """
    Simple, explainable risk score.

    This is intentionally heuristic and designed for a portfolio MVP.
    """
    weights = {"critical": 12.0, "high": 6.0, "medium": 3.0, "low": 1.0, "info": 0.25}
    score = 0.0
    for iss in issues:
        score += weights.get(iss.get("severity", "info"), 0.25)
    # Cap to 100 so it looks dashboard-friendly.
    return float(min(100.0, score))


def _parse_class_map(class_map_path: str | None) -> set[int]:
    """
    Parse class IDs from json/csv/txt.

    Supported examples:
    - JSON dict: {"0":"bg","1":"organ"}
    - JSON list: [0,1,2]
    - CSV with `class_id` column
    - TXT one integer per line
    """
    if not class_map_path:
        return {0, 1, 2, 3}
    try:
        with open(class_map_path, "r", encoding="utf-8") as f:
            raw = f.read()
        if class_map_path.lower().endswith(".json"):
            data = json.loads(raw)
            if isinstance(data, dict):
                return {int(k) for k in data.keys()}
            if isinstance(data, list):
                return {int(x) for x in data}
        if class_map_path.lower().endswith(".csv"):
            import pandas as pd

            df = pd.read_csv(class_map_path)
            if "class_id" in df.columns:
                return {int(x) for x in df["class_id"].dropna().tolist()}
        # txt fallback
        out: set[int] = set()
        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue
            out.add(int(line))
        if out:
            return out
    except Exception:
        # Fall back to default class map for robustness.
        pass
    return {0, 1, 2, 3}


def _binary_mask_issues(mask: np.ndarray, sample_id: str, split: str, issues: list[dict[str, Any]]) -> None:
    # Convert to one channel for reliable class checks.
    m = mask[:, :, 0] if mask.ndim == 3 else mask
    unique = set(int(x) for x in np.unique(m).tolist())
    invalid = sorted([x for x in unique if x not in {0, 1, 255}])
    if invalid:
        _add_issue(
            issues,
            category="mask_quality",
            severity="high",
            message="Binary mask contains values outside {0,1,255}.",
            sample_id=sample_id,
            split=split,
            evidence={"invalid_values": invalid},
        )
    if np.all(m == 0):
        _add_issue(
            issues,
            category="mask_quality",
            severity="medium",
            message="Empty binary mask (all background).",
            sample_id=sample_id,
            split=split,
            evidence={},
        )


def _rgb_palette_mask_issues(mask: np.ndarray, sample_id: str, split: str, issues: list[dict[str, Any]]) -> None:
    if mask.ndim != 3 or mask.shape[2] < 3:
        _add_issue(
            issues,
            category="mask_quality",
            severity="high",
            message="RGB palette mask expected 3 channels.",
            sample_id=sample_id,
            split=split,
            evidence={"mask_shape": list(mask.shape)},
        )
        return
    rgb = mask[:, :, :3]
    pixels = rgb.reshape(-1, 3)
    unique_colors = np.unique(pixels, axis=0)
    # Heuristic guardrail: too many colors often means non-discrete mask encoding.
    if unique_colors.shape[0] > 64:
        _add_issue(
            issues,
            category="mask_quality",
            severity="medium",
            message="RGB mask has too many unique colors; possible interpolation/compression artifact.",
            sample_id=sample_id,
            split=split,
            evidence={"unique_colors": int(unique_colors.shape[0])},
        )
    if np.all(rgb == 0):
        _add_issue(
            issues,
            category="mask_quality",
            severity="medium",
            message="Empty RGB mask (all black).",
            sample_id=sample_id,
            split=split,
            evidence={},
        )


def run_scan(
    *,
    dataset_name: str,
    images_path: str,
    masks_path: str,
    metadata_csv_path: str | None,
    train_split_path: str | None,
    val_split_path: str | None,
    test_split_path: str | None,
    class_map_path: str | None,
    mask_format: MaskFormat,
    image_extensions: list[str],
    mask_extensions: list[str],
) -> dict[str, Any]:
    """
    Main scan entrypoint.

    Returns a JSON-serializable dict matching the PRD's Audit object shape.
    """
    created_at = utc_now_iso()
    audit_id = "audit_" + stable_id_from_parts([dataset_name, images_path, masks_path, created_at])

    issues: list[dict[str, Any]] = []
    samples: list[dict[str, Any]] = []

    splits = load_splits(train_split_path, val_split_path, test_split_path)
    metadata = load_metadata(metadata_csv_path)

    sample_records, image_files, mask_files = build_sample_records(
        images_path,
        masks_path,
        image_extensions=image_extensions,
        mask_extensions=mask_extensions,
        splits=splits,
    )

    valid_class_ids = _parse_class_map(class_map_path)

    for rec in sample_records:
        img_path = rec.image_path
        msk_path = rec.mask_path
        split = rec.split
        sample_id = rec.sample_id

        sample: dict[str, Any] = {
            "sample_id": sample_id,
            "image_path": img_path,
            "mask_path": msk_path,
            "split": split,
        }

        # File presence checks
        if img_path is None:
            _add_issue(
                issues,
                category="file_validation",
                severity="critical",
                message="Missing image file for sample stem.",
                sample_id=sample_id,
                split=split,
                evidence={"sample_id": sample_id},
            )
            samples.append(sample)
            continue
        if msk_path is None:
            _add_issue(
                issues,
                category="file_validation",
                severity="high",
                message="Missing mask file for image.",
                sample_id=sample_id,
                split=split,
                evidence={"image_path": str(img_path)},
            )

        # Image load / integrity
        image_bgr = cv2.imread(str(img_path), cv2.IMREAD_COLOR)
        if image_bgr is None:
            _add_issue(
                issues,
                category="file_validation",
                severity="critical",
                message="Failed to decode image (corrupt or unsupported).",
                sample_id=sample_id,
                split=split,
                evidence={"image_path": str(img_path)},
            )
            samples.append(sample)
            continue

        # Compute image hashes for leakage checks (best-effort).
        try:
            sample["image_sha256"] = sha256_file(img_path)
        except Exception:
            sample["image_sha256"] = None
        try:
            sample["image_phash"] = phash_image(img_path)
        except Exception:
            sample["image_phash"] = None

        # Image quality
        iq = compute_image_quality_metrics(image_bgr)
        sample["image_quality"] = iq.__dict__

        if is_low_contrast(iq.std_luma):
            _add_issue(
                issues,
                category="image_quality",
                severity="medium",
                message="Low-contrast image (low grayscale variance).",
                sample_id=sample_id,
                split=split,
                evidence={"std_luma": iq.std_luma},
            )
        if is_blurry(iq.blur_score):
            _add_issue(
                issues,
                category="image_quality",
                severity="medium",
                message="Blurry image (low Laplacian variance).",
                sample_id=sample_id,
                split=split,
                evidence={"blur_score": iq.blur_score},
            )

        # Drift features (for PCA plot)
        sample["drift_features"] = compute_handcrafted_features(image_bgr)

        # Mask checks (if present)
        if msk_path is not None:
            mask = cv2.imread(str(msk_path), cv2.IMREAD_UNCHANGED)
            if mask is None:
                _add_issue(
                    issues,
                    category="mask_quality",
                    severity="high",
                    message="Failed to decode mask (corrupt or unsupported).",
                    sample_id=sample_id,
                    split=split,
                    evidence={"mask_path": str(msk_path)},
                )
            else:
                if mask_format == MaskFormat.single_channel_class_ids:
                    mq = compute_mask_quality_metrics(mask)
                    sample["mask_quality"] = mq.__dict__
                    if mq.empty:
                        _add_issue(
                            issues,
                            category="mask_quality",
                            severity="medium",
                            message="Empty mask (all zeros).",
                            sample_id=sample_id,
                            split=split,
                            evidence={},
                        )
                    invalid = find_invalid_class_ids(mq.unique_class_ids, valid_class_ids)
                    if invalid:
                        _add_issue(
                            issues,
                            category="mask_quality",
                            severity="high",
                            message="Mask contains invalid class IDs.",
                            sample_id=sample_id,
                            split=split,
                            evidence={"invalid_class_ids": invalid, "valid_class_ids": sorted(valid_class_ids)},
                        )
                elif mask_format == MaskFormat.binary:
                    _binary_mask_issues(mask, sample_id, split, issues)
                elif mask_format == MaskFormat.rgb_palette:
                    _rgb_palette_mask_issues(mask, sample_id, split, issues)

                # Shape mismatch: compare mask and image spatial dims (most common bug).
                ih, iw = image_bgr.shape[:2]
                mh, mw = mask.shape[:2]
                if (ih, iw) != (mh, mw):
                    _add_issue(
                        issues,
                        category="mask_quality",
                        severity="high",
                        message="Mask/image shape mismatch.",
                        sample_id=sample_id,
                        split=split,
                        evidence={"image_hw": [ih, iw], "mask_hw": [mh, mw]},
                    )

        samples.append(sample)

    # Leakage checks depend on per-sample hashes + split labels.
    leakage: dict[str, Any] = find_cross_split_duplicates(samples)
    sample_id_to_split = {s["sample_id"]: s.get("split", "unknown") for s in samples}
    leakage["metadata_group_leakage"] = find_metadata_group_leakage(metadata, sample_id_to_split)

    # Convert leakage signals into issues (so they show up in summary tables).
    for pair in leakage.get("exact_cross_split_pairs", []):
        _add_issue(
            issues,
            category="leakage",
            severity="critical",
            message="Exact duplicate across splits detected.",
            sample_id=pair.get("sample_id_a"),
            split=pair.get("split_a"),
            evidence=pair,
        )
    for pair in leakage.get("near_duplicate_cross_split_pairs", []):
        _add_issue(
            issues,
            category="leakage",
            severity="high",
            message="Near-duplicate across splits detected (pHash).",
            sample_id=pair.get("sample_id_a"),
            split=pair.get("split_a"),
            evidence=pair,
        )
    for g in leakage.get("metadata_group_leakage", {}).get("leaky_groups", []):
        _add_issue(
            issues,
            category="leakage",
            severity="high",
            message="Metadata group appears in multiple splits (group leakage).",
            sample_id=None,
            split=None,
            evidence=g,
        )

    drift = run_drift_pca(samples)

    # Summary
    split_counts: dict[str, int] = {"train": 0, "val": 0, "test": 0, "unknown": 0}
    for s in samples:
        split_counts[s.get("split", "unknown")] = split_counts.get(s.get("split", "unknown"), 0) + 1

    issue_counts: dict[str, int] = {}
    for iss in issues:
        sev = iss.get("severity", "info")
        issue_counts[sev] = issue_counts.get(sev, 0) + 1

    audit = {
        "audit_id": audit_id,
        "dataset_name": dataset_name,
        "created_at": created_at,
        "status": "completed",
        "summary": {
            "num_images": len(image_files),
            "num_masks": len(mask_files),
            "num_samples": len(samples),
            "split_counts": split_counts,
            "issue_counts": issue_counts,
            "risk_score": _risk_score_from_issues(issues),
        },
        "issues": issues,
        "samples": samples,
        "leakage": leakage,
        "drift": drift,
    }

    # Keep audit JSON safe for DB storage.
    json.dumps(audit)
    return audit
