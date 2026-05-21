# MedDataGuard

MedDataGuard is a local-first dataset QA and leakage/drift auditor for **medical image segmentation** datasets. It scans a dataset **before training** and flags risks like bad splits, duplicates, mask corruption, class imbalance, low image quality, and domain shift.

This is a research/portfolio prototype. It is **NOT** a medical device, **NOT** a clinical validation system, and **NOT** intended for medical decision-making.

## Why dataset QA matters
Medical CV models can look strong in offline evaluation while failing in real-world deployment due to:
- leakage between train/val/test
- duplicate or near-duplicate frames
- corrupted/empty masks or invalid class IDs
- severe class imbalance
- domain shift between splits (scanner vs hospital vs device)

## What it detects (MVP)
- File integrity: missing/corrupt images, missing masks, mismatched shapes
- Image quality: low contrast, blur, tiny resolution outliers
- Mask quality: empty masks, invalid class IDs (single-channel format), mask/image mismatch
- Leakage: exact duplicates, perceptual near-duplicates across splits, metadata group leakage (e.g., video/source IDs)
- Drift: split-level feature shifts + PCA projection outliers
- Exportable audit report (JSON + Markdown)

## Architecture (text diagram)
```
Frontend (Next.js)  ->  Backend (FastAPI)  ->  Core scanner (pure Python)
        |                    |                    |
        |              SQLite storage        OpenCV/NumPy/Pandas
        |              Markdown reports      Hashing/Sklearn PCA
```

## Setup (local)
### Backend
```
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -e ../core
uvicorn app.main:app --reload --port 8000
```

### Frontend
```
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Docker
```
docker compose up -d --build
```
Backend: `http://localhost:8000`  
Frontend: `http://localhost:3000`

## Security notes (defaults)
- `/scan` only accepts paths under `demo_data/` by default (configure `BACKEND_SCAN_ROOTS`).
- CORS defaults to `http://localhost:3000` and `http://127.0.0.1:3000` (configure `BACKEND_CORS_ALLOW_ORIGINS`).
- If `BACKEND_API_TOKEN` is set, endpoints require `Authorization: Bearer <token>` or `X-API-Token: <token>`.

## Demo audit
1) Create demo dataset (intentional issues included):
```
cd backend
python -m app.create_demo_dataset --out ..\demo_data\generated
```

2) Run a scan via API:
```
curl -X POST http://localhost:8000/scan -H "Content-Type: application/json" -d "{\"dataset_name\":\"Demo Audit\",\"images_path\":\"/app/demo_data/generated/images\",\"masks_path\":\"/app/demo_data/generated/masks\",\"metadata_csv_path\":\"/app/demo_data/generated/metadata.csv\",\"train_split_path\":\"/app/demo_data/generated/splits/train.txt\",\"val_split_path\":\"/app/demo_data/generated/splits/val.txt\",\"test_split_path\":\"/app/demo_data/generated/splits/test.txt\",\"mask_format\":\"single_channel_class_ids\"}"
```

## Scan a real dataset
POST `/scan` with paths to your dataset (images, masks, and optional metadata/splits). Use absolute paths inside Docker container (mount a volume) or local paths when running without Docker.

## API endpoints (MVP)
- `GET /health`
- `POST /scan`
- `GET /audits`
- `GET /audits/{audit_id}`
- `GET /audits/{audit_id}/issues`
- `GET /audits/{audit_id}/report`
- `GET /audits/{audit_id}/samples`
- `GET /audits/{audit_id}/leakage`
- `GET /audits/{audit_id}/drift`

## Screenshots
TODO: Add screenshots (audit overview, issue table, sample viewer, leakage clusters, drift page).

## Limitations
- Prototype-level heuristics (no deep embeddings or heavy models)
- Mask palette (RGB) support is minimal in MVP
- Large datasets can be slow without caching and batching

## Disclaimer
MedDataGuard is a research and portfolio prototype for medical-CV dataset quality analysis. It is not a clinical validation system and is not intended for medical decision-making.
