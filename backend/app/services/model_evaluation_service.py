"""
Model evaluation service for ResumeFit AI.

Provides:
- save_evaluation(db, model_type, metrics_dict) -> None
- get_latest_evaluation(db, model_type) -> dict | None
- get_comparison(db) -> dict
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Literal, Optional

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.analysis import ModelEvaluationResult

logger = logging.getLogger(__name__)

ModelType = Literal["base", "finetuned"]


def save_evaluation(
    db: Session,
    model_type: ModelType,
    metrics: Dict[str, Any],
) -> None:
    """
    Persist an evaluation snapshot for *model_type*.
    """
    record = ModelEvaluationResult(
        id=str(uuid.uuid4()),
        eval_date=datetime.now(timezone.utc),
        model_type=model_type,
        json_validity=float(metrics.get("json_validity", 0.0)),
        skill_accuracy=float(metrics.get("skill_accuracy", 0.0)),
        instruction_following=float(metrics.get("instruction_following", 0.0)),
        hallucination_rate=float(metrics.get("hallucination_rate", 0.0)),
        sample_count=int(metrics.get("sample_count", 0)),
        full_metrics=metrics,
    )
    db.add(record)
    db.commit()
    logger.info("Saved evaluation for model_type=%s (id=%s)", model_type, record.id)


def get_latest_evaluation(
    db: Session,
    model_type: ModelType,
) -> Optional[Dict[str, Any]]:
    """
    Return the most recent evaluation dict for *model_type*, or ``None``
    if no evaluation has been stored yet.
    """
    stmt = (
        select(ModelEvaluationResult)
        .where(ModelEvaluationResult.model_type == model_type)
        .order_by(desc(ModelEvaluationResult.eval_date))
        .limit(1)
    )
    result = db.execute(stmt)
    row: Optional[ModelEvaluationResult] = result.scalar_one_or_none()
    if row is None:
        return None
    return _row_to_dict(row)


def get_comparison(db: Session) -> Dict[str, Any]:
    """
    Return a side-by-side comparison of the latest evaluation for each
    model type. Keys are ``"base"`` and ``"finetuned"``.
    Missing evaluations are represented by a placeholder dict.
    """
    base = get_latest_evaluation(db, "base")
    finetuned = get_latest_evaluation(db, "finetuned")
    return {
        "base": base or _placeholder("base"),
        "finetuned": finetuned or _placeholder("finetuned"),
    }


def _row_to_dict(row: ModelEvaluationResult) -> Dict[str, Any]:
    return {
        "model_type": row.model_type,
        "eval_date": row.eval_date.isoformat() if row.eval_date else None,
        "json_validity": row.json_validity,
        "skill_accuracy": row.skill_accuracy,
        "instruction_following": row.instruction_following,
        "hallucination_rate": row.hallucination_rate,
        "sample_count": row.sample_count,
        "full_metrics": row.full_metrics,
        "status": "available",
    }


def _placeholder(model_type: str) -> Dict[str, Any]:
    return {
        "model_type": model_type,
        "eval_date": None,
        "json_validity": 0.0,
        "skill_accuracy": 0.0,
        "instruction_following": 0.0,
        "hallucination_rate": 0.0,
        "sample_count": 0,
        "full_metrics": {},
        "status": "evaluation_pending",
    }
