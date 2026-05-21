from __future__ import annotations

from pathlib import Path

from backend.app.create_demo_dataset import create_demo_dataset
from backend.app.scanner import run_scan
from backend.app.schemas import MaskFormat


def test_demo_scan_smoke(tmp_path: Path) -> None:
    demo_dir = tmp_path / "demo"
    paths = create_demo_dataset(demo_dir, num_samples=30, seed=7)

    audit = run_scan(
        dataset_name="Demo",
        images_path=paths["images_path"],
        masks_path=paths["masks_path"],
        metadata_csv_path=paths["metadata_csv_path"],
        train_split_path=paths["train_split_path"],
        val_split_path=paths["val_split_path"],
        test_split_path=paths["test_split_path"],
        class_map_path=None,
        mask_format=MaskFormat.single_channel_class_ids,
        image_extensions=[".png"],
        mask_extensions=[".png"],
    )

    assert audit["status"] == "completed"
    assert audit["summary"]["num_samples"] >= 25
    assert audit["summary"]["risk_score"] > 0

    categories = {i["category"] for i in audit["issues"]}
    assert "file_validation" in categories
    assert "image_quality" in categories
    assert "mask_quality" in categories
    assert "leakage" in categories
