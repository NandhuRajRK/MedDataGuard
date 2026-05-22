from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

REPO_ROOT = Path(__file__).resolve().parents[2]

from .config import settings
from .database import get_audit, init_db, list_audits, upsert_audit
from .reports import render_markdown_report, write_audit_artifacts
from .sample_store import list_samples
from .scanner import run_scan
from .schemas import ScanRequest
from .utils import ensure_path_within_roots, resolve_allowed_roots


app = FastAPI(title="MedDataGuard", version="0.1.0")

def _require_api_token(
    authorization: str | None = Header(default=None),
    x_api_token: str | None = Header(default=None, alias="X-API-Token"),
) -> None:
    """
    Optional token auth. If `BACKEND_API_TOKEN` is unset, this is a no-op.
    """
    if not settings.api_token:
        return

    token: str | None = None
    if authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1].strip()
    if not token and x_api_token:
        token = x_api_token.strip()

    if not token or token != settings.api_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


# Local-first: allow frontend dev server to call API from the browser.
allow_credentials = bool(settings.cors_allow_credentials)
if "*" in settings.cors_allow_origins and allow_credentials:
    # Browsers reject this combination; default to the safer behavior.
    allow_credentials = False
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db(settings.db_path)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/config")
def config(_: None = Depends(_require_api_token)) -> dict:
    """
    Minimal runtime config for the frontend (safe to expose to authenticated clients).
    """
    return {
        "scan_roots": settings.scan_roots,
        "cors_allow_origins": settings.cors_allow_origins,
        "auth_enabled": bool(settings.api_token),
    }


@app.post("/scan")
def scan(req: ScanRequest, _: None = Depends(_require_api_token)) -> dict:
    """
    Run a dataset scan and persist the resulting audit.

    For MVP we run synchronously (simple + reliable). A background job queue can
    be added later without changing the Audit schema.
    """
    allowed_roots = resolve_allowed_roots(repo_root=REPO_ROOT, roots=settings.scan_roots)
    try:
        images_path = str(ensure_path_within_roots(path=req.images_path, allowed_roots=allowed_roots))
        masks_path = str(ensure_path_within_roots(path=req.masks_path, allowed_roots=allowed_roots))
        metadata_csv_path = (
            str(ensure_path_within_roots(path=req.metadata_csv_path, allowed_roots=allowed_roots))
            if req.metadata_csv_path
            else None
        )
        train_split_path = (
            str(ensure_path_within_roots(path=req.train_split_path, allowed_roots=allowed_roots))
            if req.train_split_path
            else None
        )
        val_split_path = (
            str(ensure_path_within_roots(path=req.val_split_path, allowed_roots=allowed_roots))
            if req.val_split_path
            else None
        )
        test_split_path = (
            str(ensure_path_within_roots(path=req.test_split_path, allowed_roots=allowed_roots))
            if req.test_split_path
            else None
        )
        class_map_path = (
            str(ensure_path_within_roots(path=req.class_map_path, allowed_roots=allowed_roots))
            if req.class_map_path
            else None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    audit = run_scan(
        dataset_name=req.dataset_name,
        images_path=images_path,
        masks_path=masks_path,
        metadata_csv_path=metadata_csv_path,
        train_split_path=train_split_path,
        val_split_path=val_split_path,
        test_split_path=test_split_path,
        class_map_path=class_map_path,
        mask_format=req.mask_format,
        image_extensions=req.image_extensions,
        mask_extensions=req.mask_extensions,
    )
    upsert_audit(settings.db_path, audit)
    write_audit_artifacts(audit, settings.reports_dir)
    return {"audit_id": audit["audit_id"], "status": audit["status"], "summary": audit["summary"]}


@app.get("/audits")
def audits(_: None = Depends(_require_api_token)) -> list[dict]:
    return list_audits(settings.db_path)


@app.get("/audits/{audit_id}")
def audit(audit_id: str, _: None = Depends(_require_api_token)) -> dict:
    a = get_audit(settings.db_path, audit_id)
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    return a


@app.get("/audits/{audit_id}/issues")
def audit_issues(audit_id: str, _: None = Depends(_require_api_token)) -> list[dict]:
    a = get_audit(settings.db_path, audit_id)
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    return a.get("issues", [])


@app.get("/audits/{audit_id}/samples")
def audit_samples(audit_id: str, limit: int = 200, _: None = Depends(_require_api_token)) -> list[dict]:
    a = get_audit(settings.db_path, audit_id)
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    return list_samples(a, limit=limit)


@app.get("/audits/{audit_id}/report")
def audit_report(audit_id: str, _: None = Depends(_require_api_token)) -> dict:
    a = get_audit(settings.db_path, audit_id)
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    return {"audit_id": audit_id, "markdown": render_markdown_report(a)}


@app.get("/audits/{audit_id}/leakage")
def audit_leakage(audit_id: str, _: None = Depends(_require_api_token)) -> dict:
    a = get_audit(settings.db_path, audit_id)
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    return a.get("leakage", {})


@app.get("/audits/{audit_id}/drift")
def audit_drift(audit_id: str, _: None = Depends(_require_api_token)) -> dict:
    a = get_audit(settings.db_path, audit_id)
    if not a:
        raise HTTPException(status_code=404, detail="Audit not found")
    return a.get("drift", {})
