from __future__ import annotations

"""
Demo dataset generator for MedDataGuard.

The goal is NOT realism; it's to create a small segmentation dataset that
intentionally contains common failure modes so the dashboard looks functional
without downloading external data.
"""

import argparse
import random
from pathlib import Path

import cv2
import numpy as np
import pandas as pd


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _write_png(path: Path, bgr: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ok = cv2.imwrite(str(path), bgr)
    if not ok:
        raise RuntimeError(f"Failed to write image: {path}")


def _write_mask_png(path: Path, mask: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    ok = cv2.imwrite(str(path), mask)
    if not ok:
        raise RuntimeError(f"Failed to write mask: {path}")


def _base_image(seed: int, w: int = 256, h: int = 256) -> np.ndarray:
    """
    Generate a synthetic "medical-ish" grayscale-ish image with blobs and noise.
    """
    rng = np.random.default_rng(seed)
    img = rng.normal(loc=110, scale=18, size=(h, w)).astype(np.float32)
    for _ in range(6):
        cx, cy = int(rng.integers(0, w)), int(rng.integers(0, h))
        r = int(rng.integers(18, 55))
        val = float(rng.integers(60, 170))
        yy, xx = np.ogrid[:h, :w]
        mask = (xx - cx) ** 2 + (yy - cy) ** 2 <= r**2
        img[mask] = val
    img = np.clip(img, 0, 255).astype(np.uint8)
    # Convert to BGR so OpenCV's standard read/write path is used everywhere.
    return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)


def _base_mask(seed: int, w: int = 256, h: int = 256, majority_class: int = 1) -> np.ndarray:
    """
    Generate a synthetic single-channel class-id mask.

    Class IDs: 0=background, 1=majority, 2/3=minority blobs.
    """
    rng = np.random.default_rng(seed)
    mask = np.zeros((h, w), dtype=np.uint8)

    # Majority class dominates to simulate class imbalance.
    for _ in range(2):
        cx, cy = int(rng.integers(0, w)), int(rng.integers(0, h))
        r = int(rng.integers(35, 75))
        yy, xx = np.ogrid[:h, :w]
        blob = (xx - cx) ** 2 + (yy - cy) ** 2 <= r**2
        mask[blob] = majority_class

    # Rare classes appear occasionally.
    if seed % 5 == 0:
        cx, cy = int(rng.integers(0, w)), int(rng.integers(0, h))
        r = int(rng.integers(12, 28))
        yy, xx = np.ogrid[:h, :w]
        blob = (xx - cx) ** 2 + (yy - cy) ** 2 <= r**2
        mask[blob] = 2

    if seed % 9 == 0:
        cx, cy = int(rng.integers(0, w)), int(rng.integers(0, h))
        r = int(rng.integers(10, 22))
        yy, xx = np.ogrid[:h, :w]
        blob = (xx - cx) ** 2 + (yy - cy) ** 2 <= r**2
        mask[blob] = 3

    return mask


def create_demo_dataset(out_dir: Path, *, num_samples: int = 30, seed: int = 7) -> dict[str, str]:
    """
    Create a small synthetic dataset with intentional issues.

    Folder layout:
      out_dir/
        images/
        masks/
        splits/{train,val,test}.txt
        metadata.csv
    """
    random.seed(seed)
    _ensure_dir(out_dir)
    images_dir = out_dir / "images"
    masks_dir = out_dir / "masks"
    splits_dir = out_dir / "splits"
    _ensure_dir(images_dir)
    _ensure_dir(masks_dir)
    _ensure_dir(splits_dir)

    sample_ids = [f"sample_{i:03d}" for i in range(num_samples)]

    # Simple split: 20/5/5
    train_ids = sample_ids[: max(0, num_samples - 10)]
    val_ids = sample_ids[max(0, num_samples - 10) : max(0, num_samples - 5)]
    test_ids = sample_ids[max(0, num_samples - 5) :]

    # --- Intentional issues ---
    # 1) Missing mask
    missing_mask_id = sample_ids[1]

    # 2) Corrupt image placeholder (invalid PNG bytes)
    corrupt_image_id = sample_ids[2]

    # 3) Exact duplicate across train/test (same bytes)
    # Put one in train and one in test by design.
    duplicate_train_id = train_ids[0]
    duplicate_test_id = test_ids[0]

    # 4) Near-duplicate across train/test (tiny brightness change)
    near_dup_train_id = train_ids[1]
    near_dup_test_id = test_ids[1]

    # 5) Invalid class ID in mask
    invalid_class_id = sample_ids[3]

    # 6) Empty mask
    empty_mask_id = sample_ids[4]

    # 7) Low-contrast image
    low_contrast_id = sample_ids[5]

    # 8) Blurry image
    blurry_id = sample_ids[6]

    # 9) Source/video leakage in metadata: same video_id appears in train+test
    leaky_video_id = "video_leak_001"

    rows: list[dict[str, object]] = []

    for i, sid in enumerate(sample_ids):
        img_path = images_dir / f"{sid}.png"
        mask_path = masks_dir / f"{sid}.png"

        # Default image/mask
        img = _base_image(seed + i)
        mask = _base_mask(seed + i)

        # Apply intentional image issues
        if sid == low_contrast_id:
            # Low contrast: compress dynamic range around mid-gray.
            img = np.clip(120 + (img.astype(np.int16) - 120) // 8, 0, 255).astype(np.uint8)
        if sid == blurry_id:
            img = cv2.GaussianBlur(img, (11, 11), 2.0)

        # Apply intentional mask issues
        if sid == invalid_class_id:
            mask = mask.copy()
            mask[10:30, 10:30] = 9  # invalid class id for demo
        if sid == empty_mask_id:
            mask = np.zeros_like(mask)

        # Write files (with missing/corrupt exceptions)
        if sid == corrupt_image_id:
            img_path.write_bytes(b"not a real png file")
        else:
            _write_png(img_path, img)

        if sid != missing_mask_id:
            _write_mask_png(mask_path, mask)

        split = "unknown"
        if sid in train_ids:
            split = "train"
        elif sid in val_ids:
            split = "val"
        elif sid in test_ids:
            split = "test"

        # Metadata: video_id simulates leakage groups.
        # Most samples get unique video ids; a subset shares the same (leaky) id.
        video_id = f"video_{i:03d}"
        if sid in {duplicate_train_id, duplicate_test_id, near_dup_train_id, near_dup_test_id}:
            video_id = leaky_video_id

        rows.append({"sample_id": sid, "split": split, "video_id": video_id})

    # Create exact duplicate across splits by copying bytes.
    (images_dir / f"{duplicate_test_id}.png").write_bytes((images_dir / f"{duplicate_train_id}.png").read_bytes())

    # Create near-duplicate across splits via slight brightness shift.
    near_img = cv2.imread(str(images_dir / f"{near_dup_train_id}.png"), cv2.IMREAD_COLOR)
    if near_img is not None:
        near_img = np.clip(near_img.astype(np.int16) + 8, 0, 255).astype(np.uint8)
        _write_png(images_dir / f"{near_dup_test_id}.png", near_img)

    # Write split files (one id per line)
    (splits_dir / "train.txt").write_text("\n".join([f"{sid}.png" for sid in train_ids]) + "\n", encoding="utf-8")
    (splits_dir / "val.txt").write_text("\n".join([f"{sid}.png" for sid in val_ids]) + "\n", encoding="utf-8")
    (splits_dir / "test.txt").write_text("\n".join([f"{sid}.png" for sid in test_ids]) + "\n", encoding="utf-8")

    pd.DataFrame(rows).to_csv(out_dir / "metadata.csv", index=False)

    return {
        "images_path": str(images_dir),
        "masks_path": str(masks_dir),
        "metadata_csv_path": str(out_dir / "metadata.csv"),
        "train_split_path": str(splits_dir / "train.txt"),
        "val_split_path": str(splits_dir / "val.txt"),
        "test_split_path": str(splits_dir / "test.txt"),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, help="Output folder path for demo dataset.")
    parser.add_argument("--num-samples", type=int, default=30)
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    out_dir = Path(args.out)
    paths = create_demo_dataset(out_dir, num_samples=args.num_samples, seed=args.seed)
    print("Demo dataset created:")
    for k, v in paths.items():
        print(f"- {k}: {v}")


if __name__ == "__main__":
    main()

