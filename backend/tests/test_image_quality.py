from __future__ import annotations

import numpy as np

from backend.app.image_quality import compute_image_quality_metrics, is_blurry, is_low_contrast


def test_image_quality_metrics_basic() -> None:
    img = np.full((64, 64, 3), 120, dtype=np.uint8)
    m = compute_image_quality_metrics(img)
    assert m.width == 64
    assert m.height == 64
    assert is_low_contrast(m.std_luma)


def test_blur_heuristic_trigger() -> None:
    # A constant image has extremely low Laplacian variance -> blurry.
    img = np.full((64, 64, 3), 120, dtype=np.uint8)
    m = compute_image_quality_metrics(img)
    assert is_blurry(m.blur_score)

