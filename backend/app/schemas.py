from __future__ import annotations

from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class MaskFormat(str, Enum):
    single_channel_class_ids = "single_channel_class_ids"
    rgb_palette = "rgb_palette"
    binary = "binary"


class ScanRequest(BaseModel):
    """
    Input payload for /scan.

    Note: In MVP we accept filesystem paths directly; no uploads.
    """

    dataset_name: str = Field(..., min_length=1)
    images_path: str = Field(..., min_length=1)
    masks_path: str = Field(..., min_length=1)

    metadata_csv_path: Optional[str] = None
    train_split_path: Optional[str] = None
    val_split_path: Optional[str] = None
    test_split_path: Optional[str] = None
    class_map_path: Optional[str] = None

    mask_format: MaskFormat
    image_extensions: list[str] = Field(default_factory=lambda: [".png", ".jpg", ".jpeg"])
    mask_extensions: list[str] = Field(default_factory=lambda: [".png", ".jpg", ".jpeg", ".tif", ".tiff"])


class AuditStatus(str, Enum):
    running = "running"
    completed = "completed"
    failed = "failed"


class IssueSeverity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class Issue(BaseModel):
    """
    Standard issue schema used across all checks.

    The frontend can depend on this stable shape.
    """

    issue_id: str
    category: str
    severity: IssueSeverity
    message: str
    sample_id: Optional[str] = None
    split: Optional[Literal["train", "val", "test", "unknown"]] = None
    evidence: dict[str, Any] = Field(default_factory=dict)


class AuditSummary(BaseModel):
    num_images: int
    num_masks: int
    num_samples: int
    split_counts: dict[str, int]
    issue_counts: dict[str, int]
    risk_score: float


class Audit(BaseModel):
    audit_id: str
    dataset_name: str
    created_at: str
    status: AuditStatus
    summary: AuditSummary
    issues: list[Issue]
    samples: list[dict[str, Any]]
    leakage: dict[str, Any] = Field(default_factory=dict)
    drift: dict[str, Any] = Field(default_factory=dict)

