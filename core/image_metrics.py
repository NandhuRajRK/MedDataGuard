from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass(frozen=True)
class ImageQualityMetrics:
    width: int
    height: int
    mean_luma: float
    std_luma: float
    blur_score: float


def compute_image_quality_metrics(image_bgr: np.ndarray) -> ImageQualityMetrics:
    """
    Lightweight, explainable image-quality metrics.

    - mean/std luma: proxy for brightness + contrast
    - blur_score: variance of Laplacian (lower => blurrier)
    """
    height, width = image_bgr.shape[:2]
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    mean_luma = float(np.mean(gray))
    std_luma = float(np.std(gray))

    lap = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = float(lap.var())

    return ImageQualityMetrics(
        width=width,
        height=height,
        mean_luma=mean_luma,
        std_luma=std_luma,
        blur_score=blur_score,
    )


def is_low_contrast(std_luma: float, threshold: float = 12.0) -> bool:
    return std_luma < threshold


def is_blurry(blur_score: float, threshold: float = 60.0) -> bool:
    return blur_score < threshold

