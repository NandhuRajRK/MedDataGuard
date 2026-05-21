from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd

from .perceptual_hash import phash_distance


@dataclass(frozen=True)
class DuplicatePair:
    sample_id_a: str
    sample_id_b: str
    split_a: str
    split_b: str
    kind: str  # "exact" or "phash"
    distance: int | None = None


def find_cross_split_duplicates(samples: list[dict[str, Any]], max_phash_distance: int = 4) -> dict[str, Any]:
    """
    Identify exact and near-duplicate images across splits.
    """
    by_sha: dict[str, list[dict[str, Any]]] = {}
    for s in samples:
        sha = s.get("image_sha256")
        if sha:
            by_sha.setdefault(sha, []).append(s)

    exact_pairs: list[DuplicatePair] = []
    for sha, group in by_sha.items():
        if len(group) < 2:
            continue
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                a, b = group[i], group[j]
                if a.get("split") == b.get("split"):
                    continue
                exact_pairs.append(
                    DuplicatePair(
                        sample_id_a=a["sample_id"],
                        sample_id_b=b["sample_id"],
                        split_a=a.get("split", "unknown"),
                        split_b=b.get("split", "unknown"),
                        kind="exact",
                    )
                )

    # Near-duplicate detection (pHash) can explode to O(n^2) if done naively.
    # Use a lightweight LSH-style bucketing: split the 64-bit hash (16 hex chars)
    # into bands and only compare samples that share at least one band.
    phash_pairs: list[DuplicatePair] = []
    buckets: dict[str, list[dict[str, Any]]] = {}
    phash_len = 16
    band_size = 4  # 4 hex chars = 16 bits
    max_comparisons = 2_000_000
    comparisons = 0
    max_pairs = 20_000

    def _bands(ph: str) -> list[str]:
        ph = ph.strip().lower()
        if len(ph) != phash_len:
            # Unexpected format; fall back to a single bucket to avoid dropping signal.
            return [f"b0:{ph}"]
        out: list[str] = []
        for i in range(0, phash_len, band_size):
            out.append(f"b{i//band_size}:{ph[i:i+band_size]}")
        return out

    for s in samples:
        ph = s.get("image_phash")
        if not ph:
            continue
        for key in _bands(ph):
            buckets.setdefault(key, []).append(s)

    seen: set[tuple[str, str]] = set()
    for group in buckets.values():
        if len(group) < 2:
            continue
        # Compare within bucket, but only across splits.
        for i in range(len(group)):
            a = group[i]
            split_a = a.get("split", "unknown")
            pha = a.get("image_phash")
            if not pha:
                continue
            for j in range(i + 1, len(group)):
                b = group[j]
                split_b = b.get("split", "unknown")
                if split_a == split_b:
                    continue
                phb = b.get("image_phash")
                if not phb:
                    continue
                ida = a.get("sample_id")
                idb = b.get("sample_id")
                if not ida or not idb:
                    continue
                pair_key = (ida, idb) if ida < idb else (idb, ida)
                if pair_key in seen:
                    continue
                seen.add(pair_key)

                comparisons += 1
                if comparisons > max_comparisons or len(phash_pairs) >= max_pairs:
                    break

                dist = phash_distance(pha, phb)
                if dist <= max_phash_distance:
                    phash_pairs.append(
                        DuplicatePair(
                            sample_id_a=ida,
                            sample_id_b=idb,
                            split_a=split_a,
                            split_b=split_b,
                            kind="phash",
                            distance=dist,
                        )
                    )
            if comparisons > max_comparisons or len(phash_pairs) >= max_pairs:
                break
        if comparisons > max_comparisons or len(phash_pairs) >= max_pairs:
            break

    return {
        "exact_cross_split_pairs": [p.__dict__ for p in exact_pairs],
        "near_duplicate_cross_split_pairs": [p.__dict__ for p in phash_pairs],
    }


def find_metadata_group_leakage(
    metadata: pd.DataFrame | None,
    sample_id_to_split: dict[str, str],
    group_columns: list[str] = ["video_id", "source_id", "patient_id"],
) -> dict[str, Any]:
    """
    Detect group leakage: same group appearing in multiple splits.
    """
    if metadata is None or metadata.empty:
        return {"leaky_groups": [], "checked_columns": []}

    if "sample_id" not in metadata.columns:
        return {"leaky_groups": [], "checked_columns": []}

    leaky_groups: list[dict[str, Any]] = []
    checked: list[str] = []
    for col in group_columns:
        if col not in metadata.columns:
            continue
        checked.append(col)
        groups = metadata.groupby(col)["sample_id"].apply(list)
        for group_value, sample_ids in groups.items():
            splits = {sample_id_to_split.get(sid, "unknown") for sid in sample_ids}
            splits.discard("unknown")
            if len(splits) >= 2:
                leaky_groups.append(
                    {
                        "column": col,
                        "group_value": str(group_value),
                        "splits": sorted(splits),
                        "sample_ids": sample_ids[:50],
                    }
                )
    return {"leaky_groups": leaky_groups, "checked_columns": checked}
