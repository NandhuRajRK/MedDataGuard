from __future__ import annotations

import numpy as np

from core.mask_metrics import compute_mask_quality_metrics, find_invalid_class_ids


def test_compute_mask_quality_metrics_detects_empty_and_classes():
    mask = np.array([[0, 1], [2, 2]], dtype=np.uint8)
    metrics = compute_mask_quality_metrics(mask)
    assert metrics.width == 2
    assert metrics.height == 2
    assert metrics.empty is False
    assert metrics.unique_class_ids == [0, 1, 2]


def test_find_invalid_class_ids():
    invalid = find_invalid_class_ids([0, 1, 2, 9], {0, 1, 2})
    assert invalid == [9]
