"""API router and endpoints for ResumeFit AI."""

from __future__ import annotations

import hashlib
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.models.analysis import Analysis, ModelEvaluationResult
from app.schemas.schemas import (
    AnalysisResponse,
    AnalysisResult,
    AnalyzeRequest,
    EvaluationMetrics,
    EvaluationResponse,
    HealthResponse,
    HistoryItem,
    HistoryResponse,
    ModelStatus,
    UploadResponse,
)
from app.services.ml_inference import MLInferenceService
from app.services.model_evaluation_service import get_comparison
from app.services.resume_analyzer import ResumeAnalyzer
from app.utils.document_extractor import extract_text

logger = logging.getLogger(__name__)

router = APIRouter()

# Global instances of services
ml_service = MLInferenceService()
rule_analyzer = ResumeAnalyzer()
_app_start_time = time.time()


# --------------------------------------------------------------------------- #
# Health Check
# --------------------------------------------------------------------------- #

@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    """Check API and database health."""
    db_ok = True
    try:
        db.execute(select(func.count(Analysis.id))).scalar()
    except Exception as exc:
        logger.error("DB health check failed: %s", exc)
        db_ok = False

    model_available = ml_service.is_model_available()

    return HealthResponse(
        app_name=settings.APP_NAME,
        version=settings.VERSION,
        status="ok" if db_ok else "degraded",
        timestamp=datetime.now(timezone.utc),
        model_available=model_available,
        database_ok=db_ok,
        uptime_seconds=round(time.time() - _app_start_time, 2),
    )


# --------------------------------------------------------------------------- #
# File Upload
# --------------------------------------------------------------------------- #

@router.post("/resume/upload", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and extract text from a PDF or DOCX resume."""
    filename = file.filename or "uploaded_resume.pdf"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {settings.ALLOWED_EXTENSIONS}",
        )

    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB.",
        )

    try:
        extracted = extract_text(content, filename)
    except Exception as exc:
        logger.error("Failed to extract text from %s: %s", filename, exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Text extraction failed: {str(exc)}",
        )

    text = extracted.get("text", "")
    return UploadResponse(
        file_id=str(uuid.uuid4()),
        filename=filename,
        extracted_text_preview=text[:500] if len(text) > 500 else text,
        full_text=text,
        word_count=extracted.get("word_count", len(text.split())),
        pages=extracted.get("pages", 1),
        warnings=extracted.get("warnings", []),
        extraction_method=extracted.get("extraction_method", "native"),
    )


# --------------------------------------------------------------------------- #
# Resume Analysis
# --------------------------------------------------------------------------- #

@router.post("/analyze", response_model=AnalysisResponse)
def analyze_resume(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyze resume against a job description.
    Tries the ML model first (if configured/available), otherwise falls back to
    the precision rule-based analyzer.
    """
    start_time = time.time()
    resume_text = request.resume_text.strip()
    jd_text = request.job_description.strip()
    target_role = request.target_role.strip() if request.target_role else None

    if len(resume_text) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text is too short (minimum 50 characters required).",
        )
    if len(jd_text) < 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is too short (minimum 30 characters required).",
        )

    model_used = "rule-based"
    analysis_result_obj: Optional[AnalysisResult] = None

    # 1. Try ML model if available
    if ml_service.is_model_available():
        try:
            llm_result = ml_service.generate_analysis(resume_text, jd_text, target_role)
            if llm_result and "overall_match_percentage" in llm_result:
                analysis_result_obj = AnalysisResult(**llm_result)
                model_used = (
                    "qwen2.5-1.5b-lora" if settings.USE_FINE_TUNED_MODEL else "qwen2.5-base"
                )
        except Exception as exc:
            logger.warning("ML inference returned error, falling back to rule analyzer: %s", exc)

    # 2. Fall back to rule-based analyzer
    if analysis_result_obj is None:
        analysis_result_obj = rule_analyzer.analyze(resume_text, jd_text, target_role)
        model_used = "rule-based-engine"

    elapsed_ms = int((time.time() - start_time) * 1000)
    analysis_id = str(uuid.uuid4())
    text_hash = hashlib.sha256(resume_text.encode("utf-8")).hexdigest()

    # Save to database
    record = Analysis(
        id=analysis_id,
        created_at=datetime.now(timezone.utc),
        resume_filename=request.resume_filename,
        resume_text_hash=text_hash,
        jd_text_preview=jd_text[:200],
        target_role=target_role or analysis_result_obj.target_role_detected,
        analysis_result=analysis_result_obj.model_dump(),
        overall_match=analysis_result_obj.overall_match_percentage,
        model_used=model_used,
        processing_time_ms=elapsed_ms,
    )
    db.add(record)
    db.commit()

    return AnalysisResponse(
        id=analysis_id,
        created_at=record.created_at,
        analysis=analysis_result_obj,
        model_used=model_used,
        processing_time_ms=elapsed_ms,
    )


# --------------------------------------------------------------------------- #
# Retrieve / Delete Analysis
# --------------------------------------------------------------------------- #

@router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    """Retrieve an existing analysis by ID."""
    stmt = select(Analysis).where(Analysis.id == analysis_id)
    record = db.execute(stmt).scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with id '{analysis_id}' not found.",
        )

    return AnalysisResponse(
        id=record.id,
        created_at=record.created_at,
        analysis=AnalysisResult(**record.analysis_result),
        model_used=record.model_used,
        processing_time_ms=record.processing_time_ms,
    )


@router.delete("/analysis/{analysis_id}")
def delete_analysis(analysis_id: str, db: Session = Depends(get_db)):
    """Delete an analysis from history."""
    stmt = select(Analysis).where(Analysis.id == analysis_id)
    record = db.execute(stmt).scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis with id '{analysis_id}' not found.",
        )

    db.delete(record)
    db.commit()
    return {"status": "deleted", "id": analysis_id}


# --------------------------------------------------------------------------- #
# History
# --------------------------------------------------------------------------- #

@router.get("/history", response_model=HistoryResponse)
def list_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve paginated list of previous analyses."""
    count_stmt = select(func.count(Analysis.id))
    total = db.execute(count_stmt).scalar() or 0

    stmt = (
        select(Analysis)
        .order_by(desc(Analysis.created_at))
        .offset(offset)
        .limit(limit)
    )
    records = db.execute(stmt).scalars().all()

    items = [
        HistoryItem(
            id=r.id,
            created_at=r.created_at,
            resume_filename=r.resume_filename,
            overall_match=r.overall_match,
            target_role=r.target_role,
            model_used=r.model_used,
        )
        for r in records
    ]

    return HistoryResponse(items=items, total=total, limit=limit, offset=offset)


# --------------------------------------------------------------------------- #
# Model Info & Evaluation
# --------------------------------------------------------------------------- #

@router.get("/model/status", response_model=ModelStatus)
def get_model_status():
    """Return status of ML model inference engine."""
    return ml_service.get_model_status()


@router.get("/model/evaluation", response_model=EvaluationResponse)
def get_model_evaluation(db: Session = Depends(get_db)):
    """Return comparison metrics between baseline and fine-tuned models."""
    comparison = get_comparison(db)
    return EvaluationResponse(
        base=EvaluationMetrics(**comparison.get("base", {})),
        finetuned=EvaluationMetrics(**comparison.get("finetuned", {})),
    )
