"""
Pydantic v2 schemas for ResumeFit AI.

All public API request/response shapes are defined here.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


# ═══════════════════════════════════════════════════════════════════════════ #
#  REQUEST SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════ #

class AnalyzeRequest(BaseModel):
    """Body for POST /api/analyze."""

    resume_text: str = Field(..., min_length=50, description="Full resume text (plain).")
    job_description: str = Field(..., min_length=30, description="Full job description text.")
    target_role: Optional[str] = Field(
        None, max_length=200, description="Target job title / role (optional)."
    )
    resume_filename: Optional[str] = Field(None, max_length=255)

    @field_validator("resume_text", "job_description", mode="before")
    @classmethod
    def _strip_text(cls, v: str) -> str:
        return v.strip()


# ═══════════════════════════════════════════════════════════════════════════ #
#  NESTED ANALYSIS SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════ #

class PartialMatch(BaseModel):
    """A skill that partially matches the JD requirement."""

    skill: str
    evidence: str = Field(description="Excerpt from the resume that demonstrates partial coverage.")
    recommendation: str = Field(description="How to fully meet the requirement.")


class BulletImprovement(BaseModel):
    """Suggested improvement for a resume bullet point."""

    original: str
    improved: str
    reason: str
    jd_relevance: str = Field(description="Why this matters for the specific JD.")


class ActionItem(BaseModel):
    """A prioritised action the candidate should take."""

    priority: Literal["high", "medium", "low"]
    action: str
    category: str = Field(
        description="Category such as 'skills', 'experience', 'formatting', 'keywords'."
    )


class SectionAnalysis(BaseModel):
    """Qualitative feedback per resume section."""

    professional_summary: str = ""
    technical_skills: str = ""
    experience: str = ""
    projects: str = ""
    education: str = ""


class TransferableSkill(BaseModel):
    """A resume skill that maps to a JD requirement even if not literally named."""

    candidate_skill: str
    jd_requirement: str
    explanation: str


# ═══════════════════════════════════════════════════════════════════════════ #
#  CORE ANALYSIS RESULT  (matches dataset training schema)
# ═══════════════════════════════════════════════════════════════════════════ #

class AnalysisResult(BaseModel):
    """
    Full structured output of a resume ↔ JD analysis.

    This schema mirrors the fine-tuning dataset format so that model
    outputs can be validated directly against it.
    """

    # ── Scores (0–100) ──
    overall_match_percentage: float = Field(..., ge=0, le=100)
    skill_match_score: float = Field(..., ge=0, le=100)
    experience_match_score: float = Field(..., ge=0, le=100)
    keyword_coverage_score: float = Field(..., ge=0, le=100)

    # ── Skill breakdown ──
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    partial_matches: List[PartialMatch] = Field(default_factory=list)
    transferable_skills: List[TransferableSkill] = Field(default_factory=list)

    # ── Qualitative feedback ──
    section_analysis: SectionAnalysis = Field(default_factory=SectionAnalysis)
    bullet_improvements: List[BulletImprovement] = Field(default_factory=list)
    ats_issues: List[str] = Field(default_factory=list)

    # ── Action plan ──
    action_items: List[ActionItem] = Field(default_factory=list)

    # ── Summary ──
    summary_recommendation: str = ""

    # ── Meta ──
    target_role_detected: Optional[str] = None
    experience_years_required: Optional[float] = None
    experience_years_found: Optional[float] = None


# ═══════════════════════════════════════════════════════════════════════════ #
#  RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════ #

class AnalysisResponse(BaseModel):
    """Full response returned by POST /api/analyze and GET /api/analysis/{id}."""

    id: str
    created_at: datetime
    analysis: AnalysisResult
    model_used: str
    processing_time_ms: int


class HistoryItem(BaseModel):
    """Lightweight summary row for GET /api/history — no raw text."""

    id: str
    created_at: datetime
    resume_filename: Optional[str]
    overall_match: float
    target_role: Optional[str]
    model_used: str


class HistoryResponse(BaseModel):
    """Paginated history list."""

    items: List[HistoryItem]
    total: int
    limit: int
    offset: int


# ═══════════════════════════════════════════════════════════════════════════ #
#  UPLOAD RESPONSE
# ═══════════════════════════════════════════════════════════════════════════ #

class UploadResponse(BaseModel):
    """Returned after POST /api/resume/upload."""

    file_id: str
    filename: str
    extracted_text_preview: str = Field(description="First 500 chars of extracted text.")
    full_text: str = Field(description="Complete extracted text for client-side use.")
    word_count: int
    pages: int
    warnings: List[str] = Field(default_factory=list)
    extraction_method: str


# ═══════════════════════════════════════════════════════════════════════════ #
#  MODEL / HEALTH SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════ #

class ModelStatus(BaseModel):
    """State of the ML inference engine."""

    model_name: str
    fine_tuned: bool
    adapter_loaded: bool
    training_status: Literal[
        "not_configured", "loading", "ready", "error", "unavailable"
    ]
    device: str
    quantization: Optional[str] = None
    model_path: Optional[str] = None
    adapter_path: Optional[str] = None


class EvaluationMetrics(BaseModel):
    """Evaluation snapshot for a single model variant."""

    model_type: Literal["base", "finetuned"]
    eval_date: Optional[datetime] = None
    json_validity: float = 0.0
    skill_accuracy: float = 0.0
    instruction_following: float = 0.0
    hallucination_rate: float = 0.0
    sample_count: int = 0
    full_metrics: Dict[str, Any] = Field(default_factory=dict)
    status: str = "evaluation_pending"


class EvaluationResponse(BaseModel):
    """Side-by-side evaluation for base vs fine-tuned model."""

    base: EvaluationMetrics
    finetuned: EvaluationMetrics


class HealthResponse(BaseModel):
    """GET /api/health response."""

    app_name: str
    version: str
    status: Literal["ok", "degraded", "error"]
    timestamp: datetime
    model_available: bool
    database_ok: bool
    uptime_seconds: Optional[float] = None
