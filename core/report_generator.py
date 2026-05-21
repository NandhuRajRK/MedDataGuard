from __future__ import annotations

from typing import Any


def _severity_rank(sev: str) -> int:
    return {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}.get(sev, 99)


def render_markdown_report(audit: dict[str, Any]) -> str:
    """
    Render a Markdown report from audit JSON.

    This module is intentionally "core" so it can be reused by CLI scripts/tests.
    """
    summary = audit.get("summary", {})
    issues = sorted(audit.get("issues", []), key=lambda x: (_severity_rank(x.get("severity", "")), x.get("category", "")))

    lines: list[str] = []
    # Use an explicit unicode escape to avoid mojibake if a tool mis-detects file encoding.
    lines.append(f"# MedDataGuard Audit Report \u2014 {audit.get('dataset_name','')}")
    lines.append("")
    lines.append(f"Audit ID: `{audit.get('audit_id','')}`")
    lines.append(f"Created: `{audit.get('created_at','')}`")
    lines.append(f"Status: `{audit.get('status','')}`")
    lines.append("")

    lines.append("## Summary")
    lines.append(f"- Images: {summary.get('num_images', 0)}")
    lines.append(f"- Masks: {summary.get('num_masks', 0)}")
    lines.append(f"- Samples: {summary.get('num_samples', 0)}")
    lines.append(f"- Risk score: {summary.get('risk_score', 0.0):.1f}/100")
    lines.append("")

    lines.append("## Issues (top)")
    for i, issue in enumerate(issues[:30]):
        sid = issue.get("sample_id")
        split = issue.get("split")
        where = []
        if sid:
            where.append(f"sample={sid}")
        if split:
            where.append(f"split={split}")
        where_str = f" ({', '.join(where)})" if where else ""
        lines.append(f"{i+1}. **{issue.get('severity','')}** — `{issue.get('category','')}`: {issue.get('message','')}{where_str}")

    if not issues:
        lines.append("- No issues detected (unusual for real datasets).")

    lines.append("")
    lines.append("## Disclaimer")
    lines.append(
        "MedDataGuard is a research and portfolio prototype for medical-CV dataset quality analysis. "
        "It is not a clinical validation system and is not intended for medical decision-making."
    )
    lines.append("")

    return "\n".join(lines)
