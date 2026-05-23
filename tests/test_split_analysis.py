from __future__ import annotations

import pandas as pd

from core.split_analysis import find_cross_split_duplicates, find_metadata_group_leakage


def test_find_cross_split_duplicates_detects_exact_across_splits():
    samples = [
        {"sample_id": "a", "split": "train", "image_sha256": "same", "image_phash": "0000000000000000"},
        {"sample_id": "b", "split": "test", "image_sha256": "same", "image_phash": "ffffffffffffffff"},
        {"sample_id": "c", "split": "train", "image_sha256": "other", "image_phash": "0000000000000000"},
    ]
    report = find_cross_split_duplicates(samples, max_phash_distance=0)
    assert len(report["exact_cross_split_pairs"]) == 1
    pair = report["exact_cross_split_pairs"][0]
    assert {pair["sample_id_a"], pair["sample_id_b"]} == {"a", "b"}


def test_find_metadata_group_leakage_detects_multi_split_group():
    meta = pd.DataFrame(
        [
            {"sample_id": "a", "patient_id": "p1"},
            {"sample_id": "b", "patient_id": "p1"},
            {"sample_id": "c", "patient_id": "p2"},
        ]
    )
    split_map = {"a": "train", "b": "test", "c": "train"}
    report = find_metadata_group_leakage(meta, split_map, group_columns=["patient_id"])
    assert report["checked_columns"] == ["patient_id"]
    assert len(report["leaky_groups"]) == 1
    assert report["leaky_groups"][0]["group_value"] == "p1"
