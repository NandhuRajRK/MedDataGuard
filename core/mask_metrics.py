from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class MaskQualityMetrics:
    width: int
    height: int
    unique_class_ids: list[int]
    empty: bool


def compute_mask_quality_metrics(mask: np.ndarray) -> MaskQualityMetrics:
    height, width = mask.shape[:2]
    if mask.ndim == 3:
        mask_1ch = mask[:, :, 0]
    else:
        mask_1ch = mask

    unique = np.unique(mask_1ch.astype(np.int64))
    unique_class_ids = [int(x) for x in unique.tolist()]
    empty = bool(np.all(mask_1ch == 0))
    return MaskQualityMetrics(width=width, height=height, unique_class_ids=unique_class_ids, empty=empty)


def find_invalid_class_ids(unique_class_ids: list[int], valid_class_ids: set[int]) -> list[int]:
    return [cid for cid in unique_class_ids if cid not in valid_class_ids]

