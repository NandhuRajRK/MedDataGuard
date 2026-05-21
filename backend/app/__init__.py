from __future__ import annotations

"""
Backend package bootstrap.

This project keeps reusable scanner logic in top-level `core/`. When running the
backend locally from `backend/` (e.g., `uvicorn app.main:app`), the repo root is
not automatically on `sys.path`. We add it here so `core.*` imports work in both:
  - local dev (Windows/macOS/Linux)
  - Docker (where PYTHONPATH is already set)
"""

import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parents[2]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

