from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd


@dataclass(frozen=True)
class DatasetPaths:
    dataset_name: str
    images_path: str
    masks_path: str
    metadata_csv_path: str | None = None
    train_split_path: str | None = None
    val_split_path: str | None = None
    test_split_path: str | None = None


@dataclass(frozen=True)
class SampleRecord:
    """
    Minimal representation of a dataset sample.

    Keeping this small makes it easy to extend later (e.g., frame index, patient id).
    """

    sample_id: str
    image_path: str | None
    mask_path: str | None
    split: str


def read_text_lines(path: str | Path) -> list[str]:
    """Read a text file into non-empty, stripped lines."""
    lines: list[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if line:
                lines.append(line)
    return lines


def list_files(folder: str, extensions: list[str]) -> list[Path]:
    """Recursively list files under `folder` matching extensions."""
    exts = {e.lower() for e in extensions}
    p = Path(folder)
    if not p.exists():
        return []
    return sorted([f for f in p.rglob("*") if f.is_file() and f.suffix.lower() in exts])


def _stem_key(path: Path) -> str:
    # Pair images and masks by filename stem.
    return path.stem


def load_splits(train_path: str | None, val_path: str | None, test_path: str | None) -> dict[str, set[str]]:
    """
    Load split files containing one filename (or stem) per line.

    Normalizes entries to stems, so lines can be either `img_01.png` or `img_01`.
    """
    out: dict[str, set[str]] = {"train": set(), "val": set(), "test": set()}
    for split, path in [("train", train_path), ("val", val_path), ("test", test_path)]:
        if not path:
            continue
        p = Path(path)
        if not p.exists():
            continue
        for line in read_text_lines(p):
            out[split].add(Path(line).stem)
    return out


def infer_split(stem: str, splits: dict[str, set[str]]) -> str:
    for split, stems in splits.items():
        if stem in stems:
            return split
    return "unknown"


def load_metadata(metadata_csv_path: str | None) -> pd.DataFrame | None:
    """Load metadata CSV; returns None if missing/unreadable."""
    if not metadata_csv_path:
        return None
    p = Path(metadata_csv_path)
    if not p.exists():
        return None
    try:
        return pd.read_csv(p)
    except Exception:
        return None


def build_sample_records(
    images_path: str,
    masks_path: str,
    *,
    image_extensions: list[str],
    mask_extensions: list[str],
    splits: dict[str, set[str]] | None = None,
) -> tuple[list[SampleRecord], list[Path], list[Path]]:
    """
    Build a paired sample list from image/mask folders.

    Pairing rule: image and mask share the same filename stem.
    """
    splits = splits or {"train": set(), "val": set(), "test": set()}

    image_files = list_files(images_path, image_extensions)
    mask_files = list_files(masks_path, mask_extensions)

    images_by_stem = {_stem_key(p): p for p in image_files}
    masks_by_stem = {_stem_key(p): p for p in mask_files}
    all_stems = sorted(set(images_by_stem.keys()) | set(masks_by_stem.keys()))

    records: list[SampleRecord] = []
    for stem in all_stems:
        split = infer_split(stem, splits)
        records.append(
            SampleRecord(
                sample_id=stem,
                image_path=str(images_by_stem.get(stem)) if stem in images_by_stem else None,
                mask_path=str(masks_by_stem.get(stem)) if stem in masks_by_stem else None,
                split=split,
            )
        )

    return records, image_files, mask_files

