from __future__ import annotations

import sys
from pathlib import Path


def pytest_configure() -> None:
    """
    Ensure repo root is on sys.path so tests can import `core` and `backend.app`.

    This keeps the project structure clean without needing editable installs for MVP.
    """
    repo_root = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(repo_root))

