from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from core.report_generator import render_markdown_report  # type: ignore

from .utils import ensure_dir


def write_audit_artifacts(audit: dict[str, Any], reports_dir: str) -> dict[str, str]:
    """
    Persist the audit JSON and Markdown report to disk.

    The Markdown rendering logic lives in `core/` so it can be reused by tests/CLI.
    """
    out_dir = ensure_dir(reports_dir) / "generated"
    ensure_dir(out_dir)

    audit_id = audit["audit_id"]
    json_path = out_dir / f"{audit_id}.json"
    md_path = out_dir / f"{audit_id}.md"

    json_path.write_text(json.dumps(audit, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown_report(audit), encoding="utf-8")

    return {"json_path": str(json_path), "markdown_path": str(md_path)}
