# MedDataGuard

MedDataGuard is a local-first dataset QA and leakage/drift auditor for medical image segmentation datasets.

This repository is intentionally code-first for portfolio/research use: core logic and controls are exposed via Python and config, without a required frontend/backend split.

## What it checks
- File integrity issues (missing/corrupt images, mask/image mismatches)
- Image quality risks (blur, low contrast, resolution outliers)
- Mask quality risks (empty masks, invalid class IDs)
- Leakage (exact and near-duplicate overlap across splits)
- Drift and outliers (split-level feature shifts and PCA outliers)

## Quick start
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .\core
```

## Repo structure
- `core/`: scanner and report generation logic
- `demo_data/`: sample data for local runs
- `reports/`: generated outputs

## Notes
- Prototype-level heuristics; not a clinical validation system.
- Not intended for medical decision-making.
