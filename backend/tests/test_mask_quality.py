from __future__ import annotations

import numpy as np

from backend.app.mask_quality import compute_mask_quality_metrics, find_invalid_class_ids


def test_mask_quality_empty_and_invalid_ids() -> None:
    mask = np.zeros((32, 32), dtype=np.uint8)
    m = compute_mask_quality_metrics(mask)
    assert m.empty is True

    mask2 = mask.copy()
    mask2[0, 0] = 9
    m2 = compute_mask_quality_metrics(mask2)
    invalid = find_invalid_class_ids(m2.unique_class_ids, {0, 1, 2, 3})
    assert 9 in invalid

