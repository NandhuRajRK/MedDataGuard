from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any


def _count_by_key(items: list[dict[str, Any]], key: str) -> dict[str, int]:
    out: dict[str, int] = {}
    for item in items:
        value = str(item.get(key, "unknown"))
        out[value] = out.get(value, 0) + 1
    return out


def _to_rows(audit: dict[str, Any]) -> tuple[list[str], list[list[str]]]:
    summary = audit.get("summary", {})
    issues = audit.get("issues", [])
    issue_by_category = _count_by_key(issues, "category")
    issue_by_severity = _count_by_key(issues, "severity")
    duplicate_report = audit.get("duplicate_report", {})

    header = [
        "dataset_name",
        "created_at",
        "num_samples",
        "num_images",
        "num_masks",
        "issue_count",
        "risk_score",
        "runtime_seconds",
        "throughput_samples_per_sec",
        "exact_cross_split_duplicates",
        "near_cross_split_duplicates",
        "issues_by_category",
        "issues_by_severity",
    ]
    row = [
        str(audit.get("dataset_name", "")),
        str(audit.get("created_at", "")),
        str(summary.get("num_samples", 0)),
        str(summary.get("num_images", 0)),
        str(summary.get("num_masks", 0)),
        str(summary.get("issue_count", 0)),
        str(summary.get("risk_score", 0.0)),
        str(summary.get("runtime_seconds", 0.0)),
        str(summary.get("throughput_samples_per_sec", 0.0)),
        str(len(duplicate_report.get("exact_cross_split_pairs", []))),
        str(len(duplicate_report.get("near_duplicate_cross_split_pairs", []))),
        json.dumps(issue_by_category, sort_keys=True),
        json.dumps(issue_by_severity, sort_keys=True),
    ]
    return header, [row]


def _write_csv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)


def _write_markdown(path: Path, header: list[str], rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    lines.append("# Benchmark Summary")
    lines.append("")
    lines.append("| " + " | ".join(header) + " |")
    lines.append("| " + " | ".join(["---"] * len(header)) + " |")
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate CSV/Markdown benchmark summary from audit JSON.")
    parser.add_argument("--input-json", default="reports/generated/cholecseg8k_benchmark.json")
    parser.add_argument("--output-csv", default="reports/generated/benchmark_summary.csv")
    parser.add_argument("--output-md", default="reports/generated/benchmark_summary.md")
    args = parser.parse_args()

    input_json = Path(args.input_json)
    if not input_json.exists():
        raise FileNotFoundError(f"Input audit JSON not found: {input_json}")

    audit = json.loads(input_json.read_text(encoding="utf-8"))
    header, rows = _to_rows(audit)
    _write_csv(Path(args.output_csv), header, rows)
    _write_markdown(Path(args.output_md), header, rows)

    print(f"Wrote CSV summary: {args.output_csv}")
    print(f"Wrote Markdown summary: {args.output_md}")


if __name__ == "__main__":
    main()
