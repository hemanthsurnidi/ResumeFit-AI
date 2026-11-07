"""
ResumeFit AI — Backend API Test Suite
======================================
Tests backend endpoints, models, database operations, and schema validations
directly against the SQLite database.
"""

import sys
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.api.endpoints import (
    analyze_resume,
    get_analysis,
    get_health,
    get_model_evaluation,
    get_model_status,
    list_history,
)
from app.database.database import SessionLocal, create_tables
from app.models.analysis import Analysis
from app.schemas.schemas import AnalyzeRequest


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """Ensure database schema is created."""
    create_tables()
    yield


@pytest.fixture
def db():
    """Provide a database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_health_endpoint(db):
    """Test get_health function."""
    health = get_health(db)
    assert health.status in ["ok", "degraded"]
    assert health.version == "1.0.0"
    assert health.database_ok is True
    assert health.uptime_seconds >= 0


def test_model_status_endpoint():
    """Test get_model_status function."""
    status = get_model_status()
    assert hasattr(status, "device")
    assert hasattr(status, "training_status")


def test_model_evaluation_endpoint(db):
    """Test get_model_evaluation function."""
    eval_resp = get_model_evaluation(db)
    assert hasattr(eval_resp, "base")
    assert hasattr(eval_resp, "finetuned")
    assert eval_resp.finetuned.json_validity >= eval_resp.base.json_validity


def test_analyze_resume_endpoint(db):
    """Test analyze_resume with valid request."""
    req = AnalyzeRequest(
        resume_text=(
            "Alex Rivera\nSenior Machine Learning Engineer\n\n"
            "Technical Skills: Python, PyTorch, Docker, Kubernetes, FastAPI\n\n"
            "Professional Experience:\n"
            "- Worked on ML models using PyTorch for natural language processing.\n"
            "- Responsible for deploying Docker containers to Kubernetes clusters.\n"
            "- Built REST APIs using FastAPI for client data consumption."
        ),
        job_description=(
            "Seeking Senior Machine Learning Engineer skilled in Python, PyTorch, "
            "Transformers, Docker, and Cloud infrastructure."
        ),
        target_role="Senior Machine Learning Engineer",
    )
    res = analyze_resume(req, db)
    assert res.id is not None
    assert res.analysis.overall_match_percentage > 0
    assert "Python" in res.analysis.matched_skills
    assert "PyTorch" in res.analysis.matched_skills
    assert len(res.analysis.bullet_improvements) > 0
    assert len(res.analysis.action_items) > 0


def test_get_analysis_by_id(db):
    """Test get_analysis with created record."""
    req = AnalyzeRequest(
        resume_text="Senior Full-Stack Developer with experience in React, TypeScript, FastAPI, and PostgreSQL.",
        job_description="Looking for Senior Full-Stack Developer proficient in React, FastAPI, and PostgreSQL.",
        target_role="Full Stack Developer",
    )
    created = analyze_resume(req, db)
    fetched = get_analysis(created.id, db)
    assert fetched.id == created.id
    assert fetched.analysis.overall_match_percentage == created.analysis.overall_match_percentage


def test_history_endpoint(db):
    """Test list_history function."""
    history = list_history(limit=10, offset=0, db=db)
    assert history.total >= 1
    assert len(history.items) >= 1
    assert history.items[0].id is not None
