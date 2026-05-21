from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler


def compute_handcrafted_features(image_bgr: np.ndarray) -> list[float]:
    """
    Extract simple drift features (no heavy models).

    Features:
    - image width/height
    - per-channel mean/std
    - edge density (Canny)
    """
    import cv2

    h, w = image_bgr.shape[:2]
    b, g, r = cv2.split(image_bgr)
    edges = cv2.Canny(image_bgr, 50, 150)
    edge_density = float(np.mean(edges > 0))

    return [
        float(w),
        float(h),
        float(r.mean()),
        float(g.mean()),
        float(b.mean()),
        float(r.std()),
        float(g.std()),
        float(b.std()),
        edge_density,
    ]


def run_drift_pca(samples: list[dict[str, Any]]) -> dict[str, Any]:
    feats: list[list[float]] = []
    rows: list[dict[str, Any]] = []
    for s in samples:
        if s.get("drift_features") is None:
            continue
        feats.append(s["drift_features"])
        rows.append({"sample_id": s["sample_id"], "split": s.get("split", "unknown")})

    if len(feats) < 5:
        return {"points": [], "split_centroids": {}, "notes": ["Not enough samples for PCA drift view."]}

    X = np.asarray(feats, dtype=np.float32)
    Xs = StandardScaler().fit_transform(X)
    pca = PCA(n_components=2, random_state=0)
    Y = pca.fit_transform(Xs)

    points = []
    for i, r in enumerate(rows):
        points.append({**r, "x": float(Y[i, 0]), "y": float(Y[i, 1])})

    split_centroids: dict[str, dict[str, float]] = {}
    for split in sorted({p["split"] for p in points}):
        pts = np.array([[p["x"], p["y"]] for p in points if p["split"] == split], dtype=np.float32)
        if pts.size == 0:
            continue
        split_centroids[split] = {"x": float(pts[:, 0].mean()), "y": float(pts[:, 1].mean())}

    notes: list[str] = []
    if "train" in split_centroids and "test" in split_centroids:
        dx = split_centroids["train"]["x"] - split_centroids["test"]["x"]
        dy = split_centroids["train"]["y"] - split_centroids["test"]["y"]
        dist = float((dx * dx + dy * dy) ** 0.5)
        if dist > 3.0:
            notes.append("Strong train/test separation in PCA space (heuristic). Possible domain shift.")

    return {
        "points": points,
        "explained_variance_ratio": [float(x) for x in pca.explained_variance_ratio_.tolist()],
        "split_centroids": split_centroids,
        "notes": notes,
    }

