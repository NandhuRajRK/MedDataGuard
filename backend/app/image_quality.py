from __future__ import annotations

"""
Backend wrapper around core image metrics.

We keep backend imports stable while putting reusable logic in `core/`.
"""

from core.image_metrics import (  # type: ignore
    ImageQualityMetrics,
    compute_image_quality_metrics,
    is_blurry,
    is_low_contrast,
)

