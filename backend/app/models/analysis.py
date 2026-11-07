"""
SQLAlchemy ORM models for ResumeFit AI.

Tables
------
- ``analyses``          — stores each resume analysis result
- ``model_evaluation_results`` — stores model evaluation snapshots
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.database.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────── Analysis ───────────────────────────────────── #

class Analysis(Base):
    """
    Stores the result of a single resume ↔ job-description analysis.

    Security note: raw resume text is **never** stored.  Only a SHA-256
    hash of the text is kept for deduplication purposes.
    """

    __tablename__ = "analyses"

    # Primary key — UUID stored as string for SQLite compatibility
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # ── Identifying metadata ──
    resume_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # SHA-256 of the resume text — NOT the full text
    resume_text_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # First 200 chars of the JD for quick preview without storing raw text
    jd_text_preview: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    target_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ── Analysis output ──
    # Full JSON result blob (AnalysisResult schema)
    analysis_result: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)

    # Quick-access scalar (0–100)
    overall_match: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Which model/engine produced the result
    model_used: Mapped[str] = mapped_column(String(100), nullable=False, default="rule-based")

    # Wall-clock milliseconds from request to response
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return (
            f"<Analysis id={self.id!r} role={self.target_role!r} "
            f"match={self.overall_match:.1f}%>"
        )


# ─────────────────────────── ModelEvaluationResult ──────────────────────── #

class ModelEvaluationResult(Base):
    """
    Stores a snapshot of model evaluation metrics.

    Both ``base`` and ``finetuned`` model types are recorded so the
    frontend can display a side-by-side comparison.
    """

    __tablename__ = "model_evaluation_results"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    eval_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # "base" or "finetuned"
    model_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    # ── Core metrics (0.0–1.0 unless otherwise noted) ──
    json_validity: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    skill_accuracy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    instruction_following: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    hallucination_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Number of evaluation samples used
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Raw / extended metrics blob
    full_metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)

    def __repr__(self) -> str:
        return (
            f"<ModelEvaluationResult type={self.model_type!r} "
            f"json_validity={self.json_validity:.2f} "
            f"skill_accuracy={self.skill_accuracy:.2f}>"
        )
