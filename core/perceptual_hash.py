from __future__ import annotations

import hashlib
from pathlib import Path

import imagehash
from PIL import Image


def sha256_file(path: str | Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def phash_image(path: str | Path) -> str:
    with Image.open(path) as img:
        img = img.convert("RGB")
        return str(imagehash.phash(img))


def phash_distance(ph_a: str, ph_b: str) -> int:
    return int(imagehash.hex_to_hash(ph_a) - imagehash.hex_to_hash(ph_b))

