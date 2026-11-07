"""
Core rule-based resume analysis engine for ResumeFit AI.

This module works entirely WITHOUT an LLM. All recommendations are
grounded in actual resume content and JD requirements.

The ``MLInferenceService`` (ml_inference.py) can override the output
with LLM-generated results when a model is configured.
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional, Set, Tuple

from app.schemas.schemas import (
    ActionItem,
    AnalysisResult,
    BulletImprovement,
    PartialMatch,
    SectionAnalysis,
    TransferableSkill,
)
from app.services.jd_processor import (
    ALL_SKILLS,
    _SKILL_CANONICAL,
    _SKILL_LOWER,
    extract_jd_components,
    _extract_skills_from_text,
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════ #
#  SECTION DETECTION PATTERNS
# ═══════════════════════════════════════════════════════════════════════════ #

_RESUME_SECTION_HEADERS = {
    "summary": re.compile(
        r"(?:professional\s+)?(?:summary|profile|objective|about\s+me)", re.I
    ),
    "skills": re.compile(
        r"(?:technical\s+)?(?:skills?|competencies|expertise|technologies)", re.I
    ),
    "experience": re.compile(
        r"(?:work\s+)?(?:experience|employment|career\s+history|professional\s+experience)", re.I
    ),
    "projects": re.compile(
        r"projects?|portfolio|side\s+projects?|personal\s+projects?", re.I
    ),
    "education": re.compile(
        r"education|academic(?:s)?|degree|university|college|certifications?", re.I
    ),
}

# Patterns for detecting years of experience in resume text
_RESUME_EXP_PATTERNS = [
    r"(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience",
    r"(?:worked?\s+(?:for|at|with)).*?(\d+)\s+years?",
    r"(\d{4})\s*[-–]\s*(?:present|current|now|\d{4})",  # date range
]

# Action verbs that signal strong bullet points
_STRONG_VERBS = {
    "architected", "built", "created", "designed", "developed", "engineered",
    "implemented", "launched", "led", "managed", "optimised", "optimized",
    "reduced", "scaled", "shipped", "automated", "deployed", "improved",
    "increased", "decreased", "saved", "generated", "delivered", "mentored",
    "established", "streamlined", "migrated", "refactored", "integrated",
}

# Weak / vague phrases to flag in bullets
_WEAK_PATTERNS = [
    "responsible for", "worked on", "helped with", "assisted in",
    "participated in", "involved in", "duties include",
]

# ATS-unfriendly formatting signals
_ATS_ISSUE_PATTERNS = {
    "table_detected": re.compile(r"\|\s*\w+\s*\|", re.I),
    "emoji_detected": re.compile(
        r"[\U0001F300-\U0001F9FF\u2600-\u26FF\u2700-\u27BF]"
    ),
    "header_footer_noise": re.compile(r"page \d+ of \d+", re.I),
    "url_heavy": re.compile(r"https?://\S+", re.I),
}


# ═══════════════════════════════════════════════════════════════════════════ #
#  RESUME ANALYZER
# ═══════════════════════════════════════════════════════════════════════════ #

class ResumeAnalyzer:
    """
    Rule-based resume ↔ job-description analyser.

    Usage::

        analyzer = ResumeAnalyzer()
        result = analyzer.analyze(resume_text, jd_text, target_role)
    """

    def __init__(self) -> None:
        logger.info("ResumeAnalyzer initialised (rule-based mode).")

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def analyze(
        self,
        resume_text: str,
        jd_text: str,
        target_role: Optional[str] = None,
    ) -> AnalysisResult:
        """
        Run a full rule-based analysis.

        Parameters
        ----------
        resume_text:
            Plain-text resume content.
        jd_text:
            Plain-text job description.
        target_role:
            Optional role title override.

        Returns
        -------
        AnalysisResult
            Fully populated Pydantic model.
        """
        logger.info("Starting rule-based analysis (role=%r)", target_role)

        # ── 1. Parse JD ──
        jd_components = extract_jd_components(jd_text)
        jd_required = jd_components["required_skills"]
        jd_preferred = jd_components["preferred_skills"]
        jd_keywords = jd_components["keywords"]
        exp_required = jd_components.get("experience_years")
        detected_role = target_role or _detect_role(jd_text)

        # ── 2. Extract resume skills ──
        resume_skills = self._extract_resume_skills(resume_text)

        # ── 3. Compute sub-scores ──
        matched, missing, partial = self._compute_skill_match(
            resume_skills, jd_required, jd_preferred
        )
        skill_score = self._skill_score(len(matched), len(jd_required) + len(jd_preferred))

        exp_resume, exp_score = self._compute_experience_match(resume_text, exp_required)
        keyword_score = self._compute_keyword_coverage(resume_text, jd_keywords)
        overall = self._compute_overall_score(skill_score, exp_score, keyword_score)

        # ── 4. ATS issues ──
        ats_issues = self._check_ats_issues(resume_text, jd_keywords)

        # ── 5. Section analysis ──
        section_analysis = self._analyze_sections(resume_text, jd_components)

        # ── 6. Bullet improvements ──
        bullets = self._generate_bullet_improvements(resume_text, jd_components)

        # ── 7. Transferable skills ──
        transferable = self._find_transferable_skills(resume_skills, missing)

        # ── 8. Action plan ──
        action_items = self._generate_action_plan(missing, partial, ats_issues, exp_score)

        # ── 9. Summary ──
        summary = self._generate_summary_recommendation(
            resume_text, jd_text, overall, matched, missing, exp_score
        )

        result = AnalysisResult(
            overall_match_percentage=round(overall, 1),
            skill_match_score=round(skill_score, 1),
            experience_match_score=round(exp_score, 1),
            keyword_coverage_score=round(keyword_score, 1),
            matched_skills=matched,
            missing_skills=missing[:20],  # cap list size
            partial_matches=partial[:10],
            transferable_skills=transferable[:8],
            section_analysis=section_analysis,
            bullet_improvements=bullets[:4],
            ats_issues=ats_issues[:10],
            action_items=action_items[:10],
            summary_recommendation=summary,
            target_role_detected=detected_role,
            experience_years_required=exp_required,
            experience_years_found=exp_resume,
        )

        logger.info(
            "Analysis complete — overall=%.1f%% skill=%.1f%% exp=%.1f%% kw=%.1f%%",
            overall, skill_score, exp_score, keyword_score,
        )
        return result

    # ------------------------------------------------------------------ #
    # Skill extraction
    # ------------------------------------------------------------------ #

    def _extract_resume_skills(self, text: str) -> List[str]:
        """Return canonical skill names found in resume text."""
        return _extract_skills_from_text(text)

    # ------------------------------------------------------------------ #
    # Skill matching
    # ------------------------------------------------------------------ #

    def _compute_skill_match(
        self,
        resume_skills: List[str],
        jd_required: List[str],
        jd_preferred: List[str],
    ) -> Tuple[List[str], List[str], List[PartialMatch]]:
        """
        Classify JD skills as matched / missing / partial.

        Returns
        -------
        (matched, missing, partial_matches)
        """
        resume_lower: Set[str] = {s.lower() for s in resume_skills}
        all_jd = list(dict.fromkeys(jd_required + jd_preferred))  # deduplicated

        matched: List[str] = []
        missing: List[str] = []
        partial: List[PartialMatch] = []

        # Mapping for partial detection: related skill families
        _FAMILY = {
            "react": ["javascript", "typescript", "frontend"],
            "angular": ["javascript", "typescript", "frontend"],
            "vue": ["javascript", "typescript", "frontend"],
            "pytorch": ["deep learning", "machine learning", "python"],
            "tensorflow": ["deep learning", "machine learning", "python"],
            "aws": ["cloud", "devops"],
            "azure": ["cloud", "devops"],
            "gcp": ["cloud", "devops", "google cloud"],
            "kubernetes": ["docker", "devops", "containers"],
            "postgresql": ["sql", "database"],
            "mysql": ["sql", "database"],
            "mongodb": ["nosql", "database"],
            "django": ["python", "web"],
            "flask": ["python", "web"],
            "fastapi": ["python", "web"],
            "spring boot": ["java", "web"],
        }

        for skill in all_jd:
            skill_lower = skill.lower()
            if skill_lower in resume_lower:
                matched.append(skill)
            else:
                # Check partial coverage via family mapping
                related = _FAMILY.get(skill_lower, [])
                evidence_skills = [s for s in related if s in resume_lower]
                if evidence_skills:
                    evidence_text = f"Resume shows experience with {', '.join(evidence_skills)}"
                    partial.append(
                        PartialMatch(
                            skill=skill,
                            evidence=evidence_text,
                            recommendation=(
                                f"Highlight {skill} experience explicitly or complete "
                                f"a project demonstrating {skill}."
                            ),
                        )
                    )
                else:
                    missing.append(skill)

        return matched, missing, partial

    @staticmethod
    def _skill_score(matched: int, total: int) -> float:
        if total == 0:
            return 75.0  # JD has no extractable skills → neutral
        return min(100.0, (matched / total) * 100)

    # ------------------------------------------------------------------ #
    # Experience matching
    # ------------------------------------------------------------------ #

    def _compute_experience_match(
        self, resume_text: str, required_years: Optional[float]
    ) -> Tuple[Optional[float], float]:
        """
        Return (resume_years_found, score 0-100).
        """
        resume_years = _extract_years_from_resume(resume_text)

        if required_years is None:
            # No explicit requirement → score based on detected experience
            if resume_years and resume_years >= 2:
                return resume_years, 80.0
            return resume_years, 65.0

        if resume_years is None:
            # Cannot determine → moderate penalty
            return None, 55.0

        ratio = resume_years / required_years
        if ratio >= 1.0:
            score = min(100.0, 70 + (ratio - 1) * 15)
        else:
            score = max(10.0, ratio * 70)

        return resume_years, round(score, 1)

    # ------------------------------------------------------------------ #
    # Keyword coverage
    # ------------------------------------------------------------------ #

    def _compute_keyword_coverage(
        self, resume_text: str, keywords: List[str]
    ) -> float:
        """
        Return percentage (0–100) of JD keywords present in resume.
        """
        if not keywords:
            return 70.0  # neutral when no keywords

        resume_lower = resume_text.lower()
        hits = sum(
            1
            for kw in keywords
            if re.search(r"(?<![a-z0-9])" + re.escape(kw.lower()) + r"(?![a-z0-9])", resume_lower)
        )
        return round((hits / len(keywords)) * 100, 1)

    # ------------------------------------------------------------------ #
    # Overall score
    # ------------------------------------------------------------------ #

    @staticmethod
    def _compute_overall_score(
        skill_score: float, exp_score: float, keyword_score: float
    ) -> float:
        """
        Weighted combination:
        - 40% skill match
        - 30% experience match
        - 30% keyword coverage
        """
        return round(
            0.40 * skill_score + 0.30 * exp_score + 0.30 * keyword_score,
            1,
        )

    # ------------------------------------------------------------------ #
    # ATS issues
    # ------------------------------------------------------------------ #

    def _check_ats_issues(self, resume_text: str, jd_keywords: List[str]) -> List[str]:
        """
        Detect potential ATS (Applicant Tracking System) issues.
        """
        issues: List[str] = []

        # 1. Missing standard sections
        sections_found = {
            name: bool(pattern.search(resume_text))
            for name, pattern in _RESUME_SECTION_HEADERS.items()
        }
        for section, found in sections_found.items():
            if not found and section in ("experience", "skills"):
                issues.append(
                    f"No '{section}' section detected. ATS systems rely on "
                    f"standard section headings — add a clear '{section.title()}' header."
                )

        # 2. Formatting issues
        if _ATS_ISSUE_PATTERNS["table_detected"].search(resume_text):
            issues.append(
                "Table formatting detected. Many ATS parsers misread tables — "
                "use plain bullet lists instead."
            )
        if _ATS_ISSUE_PATTERNS["emoji_detected"].search(resume_text):
            issues.append(
                "Emoji characters found in resume. Remove them for better ATS compatibility."
            )
        if _ATS_ISSUE_PATTERNS["header_footer_noise"].search(resume_text):
            issues.append(
                "Page number text detected. Ensure headers/footers don't disrupt ATS parsing."
            )

        # 3. Keyword density
        if jd_keywords:
            resume_lower = resume_text.lower()
            missing_kw = [
                kw for kw in jd_keywords
                if not re.search(
                    r"(?<![a-z0-9])" + re.escape(kw.lower()) + r"(?![a-z0-9])",
                    resume_lower,
                )
            ]
            if len(missing_kw) > len(jd_keywords) * 0.5:
                sample = ", ".join(missing_kw[:5])
                issues.append(
                    f"Over 50% of JD keywords are absent from your resume. "
                    f"Key missing terms: {sample}."
                )

        # 4. Overly long resume check
        word_count = len(resume_text.split())
        if word_count > 1200:
            issues.append(
                f"Resume is {word_count} words — most ATS systems prefer under 800 words "
                f"for entry/mid-level roles. Consider trimming older experience."
            )

        # 5. File-format note (we can't check the original but can advise)
        url_matches = _ATS_ISSUE_PATTERNS["url_heavy"].findall(resume_text)
        if len(url_matches) > 4:
            issues.append(
                "Multiple URLs found. Keep URLs to LinkedIn and GitHub; "
                "excess links can confuse ATS parsers."
            )

        return issues

    # ------------------------------------------------------------------ #
    # Section analysis
    # ------------------------------------------------------------------ #

    def _analyze_sections(self, resume_text: str, jd_components: dict) -> SectionAnalysis:
        """Generate per-section qualitative feedback."""
        sections = _extract_resume_sections(resume_text)

        # Professional summary
        summary_text = sections.get("summary", "")
        if not summary_text:
            summary_feedback = (
                "No professional summary section detected. Adding a 2-3 sentence "
                "tailored summary at the top significantly improves ATS ranking and recruiter engagement."
            )
        elif len(summary_text.split()) < 30:
            summary_feedback = (
                "Your professional summary is very brief. Expand it to 2-4 sentences "
                "that highlight your top skills and career goals aligned with the target role."
            )
        else:
            summary_feedback = (
                "Professional summary is present. Ensure it explicitly mentions "
                f"{', '.join(jd_components['required_skills'][:3])} to align with the JD."
                if jd_components["required_skills"]
                else "Professional summary is present and well-structured."
            )

        # Technical skills
        skills_text = sections.get("skills", "")
        resume_skills = _extract_skills_from_text(resume_text)
        req_found = [s for s in jd_components["required_skills"] if s in resume_skills]
        req_missing = [s for s in jd_components["required_skills"] if s not in resume_skills]
        if not skills_text:
            tech_feedback = (
                "No dedicated skills section found. Add a 'Technical Skills' section "
                "listing your tools and technologies — this is critical for ATS matching."
            )
        elif req_missing:
            tech_feedback = (
                f"Skills section detected. You match {len(req_found)}/{len(jd_components['required_skills'])} "
                f"required skills. Consider adding: {', '.join(req_missing[:5])}."
            )
        else:
            tech_feedback = (
                f"Skills section covers all {len(req_found)} required skills from the JD. Well done."
            )

        # Experience
        exp_text = sections.get("experience", "")
        weak_bullets = _find_weak_bullets(exp_text)
        if not exp_text:
            exp_feedback = (
                "No experience section detected. This is a critical missing section for ATS systems."
            )
        elif weak_bullets:
            exp_feedback = (
                f"Experience section present. {len(weak_bullets)} bullet(s) use weak language "
                f"(e.g., 'responsible for', 'worked on'). Replace with strong action verbs "
                f"(Architected, Built, Reduced, Scaled) and quantify outcomes."
            )
        else:
            exp_feedback = (
                "Experience section is well-structured with action-oriented language."
            )

        # Projects
        proj_text = sections.get("projects", "")
        if not proj_text:
            projects_feedback = (
                "No projects section found. For technical roles, a projects section showcasing "
                "relevant work can compensate for limited professional experience."
            )
        else:
            projects_feedback = (
                "Projects section present. Ensure each project mentions the tech stack explicitly "
                "and quantifies the impact (e.g., users served, performance improvements)."
            )

        # Education
        edu_text = sections.get("education", "")
        edu_reqs = jd_components.get("education_requirements", [])
        if not edu_text:
            edu_feedback = "No education section detected — add your highest qualification."
        elif edu_reqs:
            edu_feedback = (
                f"Education section present. JD mentions: {', '.join(edu_reqs[:3])}. "
                f"Ensure your degree/major aligns with or exceeds these requirements."
            )
        else:
            edu_feedback = "Education section present and formatted correctly."

        return SectionAnalysis(
            professional_summary=summary_feedback,
            technical_skills=tech_feedback,
            experience=exp_feedback,
            projects=projects_feedback,
            education=edu_feedback,
        )

    # ------------------------------------------------------------------ #
    # Bullet improvements
    # ------------------------------------------------------------------ #

    def _generate_bullet_improvements(
        self, resume_text: str, jd_components: dict
    ) -> List[BulletImprovement]:
        """
        Identify weak resume bullets and suggest improved versions.
        """
        bullets = _extract_bullets(resume_text)
        improvements: List[BulletImprovement] = []
        jd_skills = jd_components.get("all_mentioned_skills", [])
        jd_resp = jd_components.get("responsibilities", [])

        for bullet in bullets:
            if not bullet or len(bullet) < 15:
                continue

            bullet_lower = bullet.lower()
            is_weak = any(phrase in bullet_lower for phrase in _WEAK_PATTERNS)
            has_metrics = bool(re.search(r"\d+%?|\$\d+|\d+x|\d+[kKmM]", bullet))

            if is_weak:
                # Suggest replacing vague phrase with action verb + quantification
                improved = _improve_weak_bullet(bullet, jd_skills)
                improvements.append(
                    BulletImprovement(
                        original=bullet,
                        improved=improved,
                        reason=(
                            "Passive/vague phrasing reduces ATS score and recruiter impact. "
                            "Start with a strong action verb."
                        ),
                        jd_relevance=_bullet_jd_relevance(bullet, jd_skills, jd_resp),
                    )
                )
            elif not has_metrics and len(improvements) < 2:
                # Suggest adding quantification
                improved = bullet.rstrip(".") + " — resulting in measurable improvement."
                improvements.append(
                    BulletImprovement(
                        original=bullet,
                        improved=improved,
                        reason=(
                            "Bullet lacks quantified impact. Adding numbers (%, $, time saved) "
                            "makes the achievement concrete and compelling."
                        ),
                        jd_relevance=_bullet_jd_relevance(bullet, jd_skills, jd_resp),
                    )
                )

            if len(improvements) >= 4:
                break

        return improvements

    # ------------------------------------------------------------------ #
    # Transferable skills
    # ------------------------------------------------------------------ #

    def _find_transferable_skills(
        self, resume_skills: List[str], missing_skills: List[str]
    ) -> List[TransferableSkill]:
        """Map resume skills to missing JD requirements where transferable."""
        # Transferability map: missing JD skill → resume skills that partially cover it
        TRANSFER_MAP: Dict[str, List[str]] = {
            "React": ["JavaScript", "TypeScript", "Vue", "Angular"],
            "Angular": ["JavaScript", "TypeScript", "React", "Vue"],
            "Vue": ["JavaScript", "TypeScript", "React"],
            "PyTorch": ["TensorFlow", "Keras", "Python", "Deep Learning"],
            "TensorFlow": ["PyTorch", "Keras", "Python", "Deep Learning"],
            "AWS": ["Azure", "GCP", "Google Cloud", "Docker"],
            "Azure": ["AWS", "GCP", "Google Cloud", "Docker"],
            "Kubernetes": ["Docker", "DevOps"],
            "PostgreSQL": ["MySQL", "SQL", "SQLite"],
            "MongoDB": ["Cassandra", "DynamoDB", "NoSQL"],
            "FastAPI": ["Flask", "Django", "Python"],
            "Django": ["Flask", "FastAPI", "Python"],
            "Spring Boot": ["Java", "Spring"],
        }

        resume_set = set(resume_skills)
        results: List[TransferableSkill] = []

        for missing in missing_skills:
            transfers = TRANSFER_MAP.get(missing, [])
            covered = [t for t in transfers if t in resume_set]
            if covered:
                results.append(
                    TransferableSkill(
                        candidate_skill=covered[0],
                        jd_requirement=missing,
                        explanation=(
                            f"Your experience with {covered[0]} demonstrates {missing}-adjacent "
                            f"skills. With a short ramp-up you could meet this requirement. "
                            f"Consider adding a small {missing} project to your portfolio."
                        ),
                    )
                )

        return results

    # ------------------------------------------------------------------ #
    # Action plan
    # ------------------------------------------------------------------ #

    def _generate_action_plan(
        self,
        missing_skills: List[str],
        partial_matches: List[PartialMatch],
        ats_issues: List[str],
        exp_score: float,
    ) -> List[ActionItem]:
        """Generate a prioritised action plan."""
        actions: List[ActionItem] = []

        # High-priority: missing required skills (top 3)
        for skill in missing_skills[:3]:
            actions.append(
                ActionItem(
                    priority="high",
                    action=(
                        f"Acquire hands-on experience with {skill}. Complete an online "
                        f"course or build a small project demonstrating {skill} and add it "
                        f"to your portfolio/GitHub."
                    ),
                    category="skills",
                )
            )

        # High-priority: ATS issues
        for issue in ats_issues[:2]:
            actions.append(
                ActionItem(
                    priority="high",
                    action=issue,
                    category="formatting",
                )
            )

        # Medium-priority: partial matches
        for pm in partial_matches[:3]:
            actions.append(
                ActionItem(
                    priority="medium",
                    action=pm.recommendation,
                    category="skills",
                )
            )

        # Medium-priority: experience gap
        if exp_score < 60:
            actions.append(
                ActionItem(
                    priority="medium",
                    action=(
                        "Experience level appears below the JD requirement. "
                        "Highlight all relevant projects, freelance work, and internships. "
                        "Consider open-source contributions to supplement commercial experience."
                    ),
                    category="experience",
                )
            )

        # Low-priority: keyword optimisation
        if missing_skills[3:]:
            remaining = ", ".join(missing_skills[3:8])
            actions.append(
                ActionItem(
                    priority="low",
                    action=(
                        f"Naturally incorporate missing JD keywords into your resume where "
                        f"accurate: {remaining}."
                    ),
                    category="keywords",
                )
            )

        return actions

    # ------------------------------------------------------------------ #
    # Summary recommendation
    # ------------------------------------------------------------------ #

    def _generate_summary_recommendation(
        self,
        resume_text: str,
        jd_text: str,
        overall: float,
        matched: List[str],
        missing: List[str],
        exp_score: float,
    ) -> str:
        """Generate a data-driven summary recommendation paragraph."""
        word_count = len(resume_text.split())
        matched_str = ", ".join(matched[:5]) if matched else "none detected"
        missing_str = ", ".join(missing[:5]) if missing else "none"

        if overall >= 80:
            verdict = (
                "Your resume is a strong match for this role. "
                f"You demonstrate {len(matched)} of the required skills ({matched_str}), "
                "and your experience aligns well with the job description."
            )
            advice = (
                "Focus on tailoring your professional summary and bullet points to echo "
                "the specific language of this JD. Minor keyword optimisations should push "
                "your ATS score even higher."
            )
        elif overall >= 60:
            verdict = (
                f"Your resume is a moderate match (overall {overall:.0f}%) for this role. "
                f"You have relevant skills ({matched_str}), but there are gaps to address."
            )
            advice = (
                f"Priority gaps: {missing_str}. "
                "Consider adding a targeted projects section demonstrating the missing skills, "
                "and rewrite weak bullet points with strong action verbs and quantified impact."
            )
        else:
            verdict = (
                f"Your resume currently scores {overall:.0f}% against this job description — "
                "there are significant gaps that need attention before applying."
            )
            advice = (
                f"Key skills to develop: {missing_str}. "
                "Before applying, work on building projects with the required tech stack, "
                "update your resume to reflect these skills, and tailor the summary to "
                "this specific role."
            )

        exp_note = ""
        if exp_score < 50:
            exp_note = (
                " The required experience level is a significant factor — "
                "emphasise all relevant projects and contributions to close this gap."
            )

        return f"{verdict} {advice}{exp_note}"


# ═══════════════════════════════════════════════════════════════════════════ #
#  MODULE-LEVEL HELPERS
# ═══════════════════════════════════════════════════════════════════════════ #

def _detect_role(jd_text: str) -> Optional[str]:
    """Attempt to detect the job title from the first few lines of the JD."""
    first_lines = jd_text.strip().split("\n")[:5]
    for line in first_lines:
        line = line.strip()
        if 3 <= len(line.split()) <= 8 and line[0].isupper():
            return line
    return None


def _extract_years_from_resume(text: str) -> Optional[float]:
    """
    Estimate total years of experience from resume text.

    Strategy:
    1. Look for explicit "X years of experience" statements.
    2. Fall back to summing date ranges (YYYY - YYYY or YYYY - present).
    """
    text_lower = text.lower()

    # Explicit statement
    for pattern in [
        r"(\d+)\+?\s+years?\s+(?:of\s+)?(?:professional\s+)?experience",
        r"(\d+)\s+years?\s+in\s+(?:the\s+)?(?:industry|field|software)",
    ]:
        m = re.search(pattern, text_lower)
        if m:
            return float(m.group(1))

    # Date ranges
    ranges = re.findall(r"(\d{4})\s*[-–]\s*(present|current|now|\d{4})", text_lower)
    if not ranges:
        return None

    import datetime
    current_year = datetime.date.today().year
    total = 0.0
    for start_str, end_str in ranges:
        start = int(start_str)
        end = current_year if end_str in ("present", "current", "now") else int(end_str)
        if 1980 <= start <= current_year and start <= end <= current_year + 1:
            total += end - start

    # Clamp to sensible range (1-40)
    if 1 <= total <= 40:
        return total

    return None


def _extract_resume_sections(text: str) -> Dict[str, str]:
    """Split resume text into named sections."""
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {k: [] for k in _RESUME_SECTION_HEADERS}
    sections["other"] = []
    current = "other"

    for line in lines:
        matched_section = None
        for name, pattern in _RESUME_SECTION_HEADERS.items():
            if pattern.search(line) and len(line.split()) <= 6:
                matched_section = name
                break
        if matched_section:
            current = matched_section
        else:
            sections[current].append(line)

    return {k: "\n".join(v).strip() for k, v in sections.items()}


def _extract_bullets(text: str) -> List[str]:
    """Extract bullet-point lines from resume text."""
    bullet_re = re.compile(
        r"^\s*(?:[•\-\*\u2022\u2023\u25e6]|\d+[.)]\s)\s*(.+)", re.M
    )
    return [m.group(1).strip() for m in bullet_re.finditer(text)]


def _find_weak_bullets(text: str) -> List[str]:
    """Return bullets containing weak/passive language."""
    bullets = _extract_bullets(text)
    return [b for b in bullets if any(p in b.lower() for p in _WEAK_PATTERNS)]


def _improve_weak_bullet(bullet: str, jd_skills: List[str]) -> str:
    """
    Rewrite a weak bullet by substituting a strong action verb
    and removing the weak phrase.
    """
    improved = bullet
    for phrase in _WEAK_PATTERNS:
        if phrase in improved.lower():
            # Pick an appropriate action verb
            verb_map = {
                "responsible for": "Led",
                "worked on": "Developed",
                "helped with": "Contributed to",
                "assisted in": "Collaborated on",
                "participated in": "Contributed to",
                "involved in": "Supported",
                "duties include": "Delivered",
            }
            verb = verb_map.get(phrase, "Developed")
            improved = re.sub(re.escape(phrase), "", improved, flags=re.I).strip()
            # Capitalise and prepend action verb
            if improved:
                improved = f"{verb} {improved[0].lower()}{improved[1:]}"
            break

    # Suggest adding a metric if none present
    if not re.search(r"\d", improved):
        improved = improved.rstrip(".") + ", improving efficiency by X%."

    return improved


def _bullet_jd_relevance(bullet: str, jd_skills: List[str], jd_resp: List[str]) -> str:
    """Explain how a bullet maps to JD requirements."""
    bullet_lower = bullet.lower()
    matching_skills = [s for s in jd_skills if s.lower() in bullet_lower]
    if matching_skills:
        return f"Directly relevant to JD requirement for {', '.join(matching_skills[:2])}."
    # Check responsibilities
    for resp in jd_resp[:5]:
        resp_words = set(resp.lower().split())
        bullet_words = set(bullet_lower.split())
        if len(resp_words & bullet_words) >= 3:
            return f"Aligns with JD responsibility: '{resp[:60]}…'"
    return "Strengthening this bullet will improve keyword density for ATS systems."
