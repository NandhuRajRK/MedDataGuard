from __future__ import annotations

import json
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central config with environment-variable support.

    Keeping this in one place makes the backend easy to run locally and in Docker.
    """

    model_config = SettingsConfigDict(env_prefix="BACKEND_", extra="ignore")

    db_path: str = "app.db"
    reports_dir: str = "reports"
    scan_roots: list[str] = Field(default_factory=lambda: ["demo_data"])

    # Safer CORS defaults for anything beyond local dev.
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    cors_allow_credentials: bool = False

    # Optional token-based auth for deployments. If set, endpoints require a token.
    api_token: str | None = None

    @field_validator("scan_roots", "cors_allow_origins", mode="before")
    @classmethod
    def _parse_str_list(cls, v: Any) -> Any:
        """
        Support either:
        - JSON list via env var (recommended), e.g. '["/data","/app/demo_data"]'
        - Comma-separated string, e.g. "/data,/app/demo_data"
        """
        if v is None:
            return v
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            raw = v.strip()
            if not raw:
                return []
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    return parsed
                except Exception:
                    # Fall back to comma split below.
                    pass
            return [part.strip() for part in raw.split(",") if part.strip()]
        return v


settings = Settings()
