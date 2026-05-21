from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


def utc_now_iso() -> str:
    """Return an ISO-8601 UTC timestamp string."""
    return datetime.now(timezone.utc).isoformat()


def ensure_dir(path: str | Path) -> Path:
    """Create a directory if missing and return it as a Path."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def read_text_lines(path: str | Path) -> list[str]:
    """Read a text file into non-empty, stripped lines."""
    lines: list[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if line:
                lines.append(line)
    return lines


def stable_id_from_parts(parts: Iterable[str]) -> str:
    """
    Generate a stable, short-ish id from string parts.

    This is used for audit IDs so repeated scans of the same inputs can be
    compared, while still being unique enough for a portfolio prototype.
    """
    h = hashlib.sha256()
    for part in parts:
        h.update(part.encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()[:12]


def safe_relpath(path: str | Path, base: str | Path) -> str:
    """
    Best-effort relative path for display; falls back to absolute.

    Useful when users scan absolute paths on different machines.
    """
    try:
        return os.path.relpath(str(path), str(base))
    except Exception:
        return str(path)


def resolve_allowed_roots(*, repo_root: Path, roots: list[str]) -> list[Path]:
    """
    Resolve configured scan roots into absolute Paths.

    - Relative roots are resolved against the repository root.
    - Non-existent roots are still accepted (to support pre-mounted volumes),
      but they remain fully-qualified absolute paths after resolution.
    """
    resolved: list[Path] = []
    for r in roots:
        p = Path(r).expanduser()
        if not p.is_absolute():
            p = (repo_root / p).resolve()
        else:
            p = p.resolve()
        resolved.append(p)
    # Deduplicate while preserving order.
    out: list[Path] = []
    seen: set[str] = set()
    for p in resolved:
        key = str(p)
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out


def ensure_path_within_roots(*, path: str, allowed_roots: list[Path]) -> Path:
    """
    Normalize `path` and reject anything outside `allowed_roots`.
    """
    p = Path(path).expanduser()
    try:
        normalized = p.resolve(strict=False)
    except Exception:
        normalized = p.absolute()

    for root in allowed_roots:
        try:
            normalized.relative_to(root)
            return normalized
        except Exception:
            continue

    roots_str = ", ".join(str(r) for r in allowed_roots) if allowed_roots else "(none configured)"
    raise ValueError(f"Path '{path}' is outside allowed scan roots: {roots_str}")
