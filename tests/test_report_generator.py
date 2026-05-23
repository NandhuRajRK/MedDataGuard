from __future__ import annotations

from core.report_generator import render_markdown_report


def test_render_markdown_report_includes_summary_and_issues():
    audit = {
        "dataset_name": "Demo",
        "audit_id": "a1",
        "created_at": "2026-05-23T00:00:00Z",
        "status": "completed",
        "summary": {"num_images": 2, "num_masks": 2, "num_samples": 2, "risk_score": 12.3},
        "issues": [{"severity": "high", "category": "mask_quality", "message": "Example", "sample_id": "s1"}],
    }
    md = render_markdown_report(audit)
    assert "MedDataGuard Audit Report" in md
    assert "Risk score: 12.3/100" in md
    assert "mask_quality" in md
    assert "Example" in md
