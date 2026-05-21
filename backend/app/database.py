from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any


def _connect(db_path: str) -> sqlite3.Connection:
    # check_same_thread=False keeps it simple for FastAPI dev server threads.
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str) -> None:
    """Create tables if missing."""
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    with _connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audits (
              audit_id TEXT PRIMARY KEY,
              dataset_name TEXT NOT NULL,
              created_at TEXT NOT NULL,
              status TEXT NOT NULL,
              audit_json TEXT NOT NULL
            )
            """
        )
        conn.commit()


def upsert_audit(db_path: str, audit: dict[str, Any]) -> None:
    """Persist the full audit JSON blob."""
    with _connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO audits (audit_id, dataset_name, created_at, status, audit_json)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(audit_id) DO UPDATE SET
              dataset_name=excluded.dataset_name,
              created_at=excluded.created_at,
              status=excluded.status,
              audit_json=excluded.audit_json
            """,
            (
                audit["audit_id"],
                audit["dataset_name"],
                audit["created_at"],
                audit["status"],
                json.dumps(audit),
            ),
        )
        conn.commit()


def list_audits(db_path: str) -> list[dict[str, Any]]:
    with _connect(db_path) as conn:
        rows = conn.execute(
            "SELECT audit_id, dataset_name, created_at, status FROM audits ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]


def get_audit(db_path: str, audit_id: str) -> dict[str, Any] | None:
    with _connect(db_path) as conn:
        row = conn.execute("SELECT audit_json FROM audits WHERE audit_id=?", (audit_id,)).fetchone()
        if not row:
            return None
        return json.loads(row["audit_json"])

