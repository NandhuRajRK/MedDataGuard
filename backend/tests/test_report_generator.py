from __future__ import annotations

from core.report_generator import render_markdown_report


def test_report_header_uses_em_dash_not_mojibake() -> None:
    audit = {
        "audit_id": "audit_test",
        "dataset_name": "Demo Dataset",
        "created_at": "2026-05-21T00:00:00+00:00",
        "status": "completed",
        "summary": {},
        "issues": [],
    }
    md = render_markdown_report(audit)
    assert "# MedDataGuard Audit Report — Demo Dataset" in md
    assert "â€”" not in md
