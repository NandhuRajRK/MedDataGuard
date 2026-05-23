from __future__ import annotations

from core.dataset_loader import build_sample_records, load_splits


def test_load_splits_normalizes_to_stems(tmp_path):
    train = tmp_path / "train.txt"
    val = tmp_path / "val.txt"
    test = tmp_path / "test.txt"
    train.write_text("a.png\nb\n", encoding="utf-8")
    val.write_text("c.jpg\n", encoding="utf-8")
    test.write_text("d\n", encoding="utf-8")

    splits = load_splits(str(train), str(val), str(test))
    assert splits["train"] == {"a", "b"}
    assert splits["val"] == {"c"}
    assert splits["test"] == {"d"}


def test_build_sample_records_pairs_files_and_sets_split(tmp_path):
    images = tmp_path / "images"
    masks = tmp_path / "masks"
    images.mkdir()
    masks.mkdir()

    (images / "s1.png").write_bytes(b"img")
    (masks / "s1.png").write_bytes(b"mask")
    (images / "s2.jpg").write_bytes(b"img")

    splits = {"train": {"s1"}, "val": set(), "test": set()}
    records, image_files, mask_files = build_sample_records(
        str(images),
        str(masks),
        image_extensions=[".png", ".jpg"],
        mask_extensions=[".png"],
        splits=splits,
    )

    assert len(image_files) == 2
    assert len(mask_files) == 1
    by_id = {r.sample_id: r for r in records}
    assert by_id["s1"].image_path is not None
    assert by_id["s1"].mask_path is not None
    assert by_id["s1"].split == "train"
    assert by_id["s2"].image_path is not None
    assert by_id["s2"].mask_path is None
    assert by_id["s2"].split == "unknown"
