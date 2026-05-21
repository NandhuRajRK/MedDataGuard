from __future__ import annotations

from typing import Any


def list_samples(audit: dict[str, Any], limit: int = 200) -> list[dict[str, Any]]:
    """
    Return a trimmed sample list for browsing.

    Large datasets can easily have thousands of items; the frontend should request
    more sophisticated pagination later. For MVP we just cap it.
    """
    samples = audit.get("samples", [])
    return samples[: max(0, int(limit))]

