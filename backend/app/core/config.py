"""
Application configuration for ResumeFit AI.
Loads settings from environment variables and .env file using pydantic-settings.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration object for ResumeFit AI."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------ #
    # Application metadata
    # ------------------------------------------------------------------ #
    APP_NAME: str = "ResumeFit AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # ------------------------------------------------------------------ #
    # Database
    # ------------------------------------------------------------------ #
    DATABASE_URL: str = "sqlite:///./resumefit.db"

    # ------------------------------------------------------------------ #
    # File upload limits
    # ------------------------------------------------------------------ #
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]
    UPLOAD_DIR: str = "uploads"

    # ------------------------------------------------------------------ #
    # CORS
    # ------------------------------------------------------------------ #
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ]

    # ------------------------------------------------------------------ #
    # ML / Model configuration
    # ------------------------------------------------------------------ #
    MODEL_PATH: Optional[str] = None
    ADAPTER_PATH: Optional[str] = None
    USE_FINE_TUNED_MODEL: bool = False
    MODEL_MAX_NEW_TOKENS: int = 2048
    MODEL_TEMPERATURE: float = 0.1

    # ------------------------------------------------------------------ #
    # Security / Misc
    # ------------------------------------------------------------------ #
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-secret"
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"

    # ------------------------------------------------------------------ #
    # Computed helpers
    # ------------------------------------------------------------------ #
    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def upload_dir_abs(self) -> str:
        """Absolute path of the upload directory (relative to CWD)."""
        return os.path.abspath(self.UPLOAD_DIR)

    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def _parse_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()


# Convenience export
settings = get_settings()
