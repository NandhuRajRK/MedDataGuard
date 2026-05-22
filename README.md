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
- `benchmark/`: benchmark runner + summary generators
- `demo_data/`: sample data for local runs
- `reports/`: generated outputs

## Benchmark (CholecSeg8k in `archive/`)
Run full benchmark:
```powershell
py -3 benchmark/run_cholec_benchmark.py --archive-root archive --output-dir reports/generated
```

Generate portfolio summary tables:
```powershell
py -3 benchmark/generate_benchmark_summary.py --input-json reports/generated/cholecseg8k_benchmark.json --output-csv reports/generated/benchmark_summary.csv --output-md reports/generated/benchmark_summary.md
```

Current full-run result (local, `archive/`):
- Samples: `8080`
- Issues: `63` (image quality)
- Risk score: `0.07797 / 100`
- Runtime: `640.153s`
- Throughput: `12.622 samples/s`
- Cross-split duplicates: exact `0`, near `0`

## Notes
- Prototype-level heuristics; not a clinical validation system.
- Not intended for medical decision-making.
