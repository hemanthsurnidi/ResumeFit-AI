"""
Job Description (JD) processing service for ResumeFit AI.

Uses rule-based NLP (regex + curated skill taxonomy) — no external NLP
libraries required beyond the Python standard library.

Entry point: ``extract_jd_components(jd_text: str) -> dict``
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional, Set

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════ #
#  SKILL TAXONOMY  (150 + entries, categorised)
# ═══════════════════════════════════════════════════════════════════════════ #

PROGRAMMING_LANGUAGES: List[str] = [
    "Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go",
    "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB",
    "Perl", "Shell", "Bash", "PowerShell", "Groovy", "Lua", "Haskell",
    "Elixir", "Clojure", "Julia", "Dart", "Assembly",
]

WEB_FRONTEND: List[str] = [
    "React", "Vue", "Angular", "Next.js", "Nuxt.js", "Svelte", "HTML",
    "CSS", "SASS", "SCSS", "Tailwind CSS", "Bootstrap", "Material UI",
    "Redux", "Zustand", "GraphQL", "REST", "RESTful API", "WebSockets",
    "Webpack", "Vite", "Babel", "jQuery", "Three.js", "D3.js",
]

WEB_BACKEND: List[str] = [
    "FastAPI", "Django", "Flask", "Express", "Node.js", "Spring Boot",
    "Spring", "ASP.NET", ".NET", "Laravel", "Rails", "Ruby on Rails",
    "Gin", "Echo", "Fiber", "NestJS", "gRPC", "Microservices",
    "API Gateway", "OAuth", "JWT", "OpenAPI", "Swagger",
]

DATABASES: List[str] = [
    "SQL", "MySQL", "PostgreSQL", "SQLite", "MongoDB", "Redis",
    "Elasticsearch", "Cassandra", "DynamoDB", "Oracle", "MS SQL Server",
    "MariaDB", "Neo4j", "InfluxDB", "Firestore", "Supabase", "Prisma",
    "SQLAlchemy", "Hibernate", "JPA", "NoSQL",
]

CLOUD_DEVOPS: List[str] = [
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes",
    "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI",
    "CircleCI", "ArgoCD", "Helm", "Prometheus", "Grafana", "Datadog",
    "ECS", "EKS", "Lambda", "S3", "EC2", "RDS", "CloudFormation",
    "Pulumi", "Vagrant", "Nginx", "Apache", "Linux", "Unix",
]

ML_AI: List[str] = [
    "Machine Learning", "Deep Learning", "NLP", "Natural Language Processing",
    "Computer Vision", "PyTorch", "TensorFlow", "Keras", "Scikit-learn",
    "Pandas", "NumPy", "Matplotlib", "Seaborn", "Hugging Face",
    "Transformers", "BERT", "GPT", "LLM", "RAG", "LangChain",
    "OpenCV", "YOLO", "XGBoost", "LightGBM", "CatBoost", "MLflow",
    "Kubeflow", "Feature Engineering", "Model Evaluation", "A/B Testing",
    "Reinforcement Learning", "Generative AI",
]

DATA_ENGINEERING: List[str] = [
    "Spark", "Hadoop", "Kafka", "Airflow", "dbt", "Flink", "Hive",
    "BigQuery", "Redshift", "Snowflake", "Data Warehouse", "ETL",
    "ELT", "Data Pipeline", "Data Lake", "Databricks", "Pandas",
    "Data Modeling", "Tableau", "Power BI", "Looker",
]

TOOLS_PRACTICES: List[str] = [
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence",
    "Agile", "Scrum", "Kanban", "CI/CD", "DevOps", "TDD", "BDD",
    "Unit Testing", "Integration Testing", "Selenium", "Pytest",
    "Jest", "Cypress", "Postman", "Linux", "Vim", "VS Code",
    "IntelliJ", "Eclipse", "Figma", "Notion",
]

SOFT_SKILLS: List[str] = [
    "Leadership", "Communication", "Collaboration", "Problem-solving",
    "Critical Thinking", "Project Management", "Mentoring",
    "Team Player", "Cross-functional", "Stakeholder Management",
    "Time Management", "Adaptability", "Initiative",
]

# Flat taxonomy for quick lookup
ALL_SKILLS: List[str] = (
    PROGRAMMING_LANGUAGES + WEB_FRONTEND + WEB_BACKEND + DATABASES +
    CLOUD_DEVOPS + ML_AI + DATA_ENGINEERING + TOOLS_PRACTICES + SOFT_SKILLS
)

# Build lower-case lookup set for fast O(1) membership test
_SKILL_LOWER: Set[str] = {s.lower() for s in ALL_SKILLS}
# Map lower → canonical form
_SKILL_CANONICAL: Dict[str, str] = {s.lower(): s for s in ALL_SKILLS}


# ═══════════════════════════════════════════════════════════════════════════ #
#  SECTION HEADER PATTERNS
# ═══════════════════════════════════════════════════════════════════════════ #

_REQUIRED_SECTION_PATTERNS = [
    r"required\s+(?:skills?|qualifications?|experience)",
    r"must\s+have",
    r"minimum\s+qualifications?",
    r"basic\s+qualifications?",
    r"you\s+(?:must|will)\s+(?:have|bring|possess)",
]

_PREFERRED_SECTION_PATTERNS = [
    r"preferred\s+(?:skills?|qualifications?|experience)",
    r"nice\s+to\s+have",
    r"bonus\s+(?:points?|skills?|qualifications?)",
    r"desired\s+(?:skills?|qualifications?)",
    r"plus\s+if\s+you",
]

_RESPONSIBILITY_SECTION_PATTERNS = [
    r"responsibilities",
    r"what\s+you['\u2019]ll\s+do",
    r"role\s+overview",
    r"key\s+responsibilities",
    r"what\s+you\s+will\s+do",
    r"job\s+duties",
    r"your\s+role",
]

_EDUCATION_PATTERNS = [
    r"bachelor['\u2019]?s?\s+degree",
    r"master['\u2019]?s?\s+degree",
    r"phd|ph\.d\.|doctorate",
    r"b\.?s\.?|b\.?e\.?|b\.?tech",
    r"m\.?s\.?|m\.?e\.?|m\.?tech",
    r"mba",
    r"degree\s+in\s+(?:computer\s+science|engineering|mathematics|statistics|data\s+science)",
    r"computer\s+science|information\s+technology|software\s+engineering",
]


# ═══════════════════════════════════════════════════════════════════════════ #
#  EXPERIENCE YEAR REGEX
# ═══════════════════════════════════════════════════════════════════════════ #

_EXP_YEAR_PATTERNS = [
    # "5+ years", "5-7 years", "5 or more years"
    r"(\d+)\s*\+?\s*(?:to|-|–|or more)?\s*\d*\s*(?:\+\s*)?years?\s+(?:of\s+)?(?:professional\s+)?experience",
    r"(\d+)\s*\+\s*years?",
    r"minimum\s+(?:of\s+)?(\d+)\s+years?",
    r"at\s+least\s+(\d+)\s+years?",
    r"(\d+)\s+years?\s+(?:of\s+)?(?:relevant\s+)?(?:work\s+)?experience",
]


# ═══════════════════════════════════════════════════════════════════════════ #
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════ #

def extract_jd_components(jd_text: str) -> dict:
    """
    Parse a job description into structured components.

    Parameters
    ----------
    jd_text:
        Raw job description text (plain or lightly formatted).

    Returns
    -------
    dict::

        {
            "required_skills": List[str],
            "preferred_skills": List[str],
            "experience_years": Optional[float],
            "education_requirements": List[str],
            "responsibilities": List[str],
            "keywords": List[str],
            "all_mentioned_skills": List[str],
        }
    """
    if not jd_text or not jd_text.strip():
        return _empty_result()

    text = jd_text.strip()

    # ── 1. Split into labelled sections ──
    sections = _split_into_sections(text)

    # ── 2. Extract skills per section ──
    required_skills = _extract_skills_from_text(sections.get("required", ""))
    preferred_skills = _extract_skills_from_text(sections.get("preferred", ""))

    # Skills found anywhere that weren't in required/preferred sections
    all_skills = _extract_skills_from_text(text)
    extra_skills = [s for s in all_skills if s not in required_skills + preferred_skills]

    # If section parsing found nothing, fall back to full-text skills
    if not required_skills and not preferred_skills:
        required_skills = all_skills

    # ── 3. Experience years ──
    experience_years = _extract_experience_years(text)

    # ── 4. Education requirements ──
    education_reqs = _extract_education(text)

    # ── 5. Responsibilities ──
    responsibilities = _extract_responsibilities(sections.get("responsibilities", text))

    # ── 6. Keywords (terms that appear frequently or in important positions) ──
    keywords = _extract_keywords(text, all_skills)

    result = {
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "experience_years": experience_years,
        "education_requirements": education_reqs,
        "responsibilities": responsibilities[:15],  # top 15
        "keywords": keywords,
        "all_mentioned_skills": list(dict.fromkeys(required_skills + preferred_skills + extra_skills)),
    }

    logger.debug(
        "JD components extracted",
        extra={
            "required": len(required_skills),
            "preferred": len(preferred_skills),
            "keywords": len(keywords),
            "exp_years": experience_years,
        },
    )

    return result


# ═══════════════════════════════════════════════════════════════════════════ #
#  INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════════════════════ #

def _empty_result() -> dict:
    return {
        "required_skills": [],
        "preferred_skills": [],
        "experience_years": None,
        "education_requirements": [],
        "responsibilities": [],
        "keywords": [],
        "all_mentioned_skills": [],
    }


def _split_into_sections(text: str) -> Dict[str, str]:
    """
    Heuristically split JD text into named sections.

    Returns a dict with keys: "required", "preferred", "responsibilities", "other".
    """
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {
        "required": [],
        "preferred": [],
        "responsibilities": [],
        "other": [],
    }
    current = "other"

    for line in lines:
        line_lower = line.lower().strip()

        # Section header detection
        if any(re.search(p, line_lower) for p in _REQUIRED_SECTION_PATTERNS):
            current = "required"
            continue
        if any(re.search(p, line_lower) for p in _PREFERRED_SECTION_PATTERNS):
            current = "preferred"
            continue
        if any(re.search(p, line_lower) for p in _RESPONSIBILITY_SECTION_PATTERNS):
            current = "responsibilities"
            continue

        sections[current].append(line)

    return {k: "\n".join(v) for k, v in sections.items()}


def _extract_skills_from_text(text: str) -> List[str]:
    """
    Return canonical skill names found in *text* using the taxonomy.

    Uses word-boundary matching to avoid false positives (e.g. "C" in "CI/CD").
    """
    if not text:
        return []

    found: List[str] = []
    seen: Set[str] = set()
    text_lower = text.lower()

    for skill in ALL_SKILLS:
        skill_lower = skill.lower()
        # Build a pattern that respects word boundaries or punctuation
        escaped = re.escape(skill_lower)
        pattern = r"(?<![a-z0-9])" + escaped + r"(?![a-z0-9])"
        if re.search(pattern, text_lower) and skill_lower not in seen:
            found.append(skill)
            seen.add(skill_lower)

    return found


def _extract_experience_years(text: str) -> Optional[float]:
    """
    Return the minimum years-of-experience mentioned in *text*, or None.
    """
    text_lower = text.lower()
    years_found: List[float] = []

    for pattern in _EXP_YEAR_PATTERNS:
        for match in re.finditer(pattern, text_lower):
            try:
                years_found.append(float(match.group(1)))
            except (IndexError, ValueError):
                pass

    if not years_found:
        return None

    # Return the minimum (most lenient requirement)
    return min(years_found)


def _extract_education(text: str) -> List[str]:
    """Return education requirements matched in *text*."""
    found: List[str] = []
    text_lower = text.lower()

    for pattern in _EDUCATION_PATTERNS:
        matches = re.findall(pattern, text_lower)
        for m in matches:
            canonical = m.strip().title()
            if canonical and canonical not in found:
                found.append(canonical)

    return found


def _extract_responsibilities(text: str) -> List[str]:
    """Extract bullet-point style responsibility lines from *text*."""
    if not text.strip():
        return []

    responsibilities: List[str] = []
    lines = text.split("\n")

    # Bullet indicators: •, -, *, numbers like "1." or "1)"
    bullet_re = re.compile(r"^\s*(?:[•\-\*\u2022\u2023\u25e6]|\d+[.)]\s)\s*(.+)")

    for line in lines:
        m = bullet_re.match(line)
        if m:
            content = m.group(1).strip()
            if len(content) > 10:  # ignore trivially short lines
                responsibilities.append(content)
        else:
            # Non-bulleted but long enough to be a responsibility sentence
            stripped = line.strip()
            if len(stripped) > 40 and stripped[0].isupper():
                responsibilities.append(stripped)

    return responsibilities


def _extract_keywords(text: str, skills: List[str]) -> List[str]:
    """
    Build a keyword list: skill names + high-frequency domain terms.
    """
    keywords: Set[str] = set(skills)

    # Domain-specific buzzwords to also capture
    domain_terms = [
        "scalable", "distributed", "cloud-native", "real-time", "big data",
        "data-driven", "cross-functional", "agile", "startup", "enterprise",
        "production", "high-availability", "fault-tolerant", "observability",
        "monitoring", "security", "compliance", "GDPR", "HIPAA", "SOC 2",
        "mentorship", "architecture", "system design", "code review",
        "open source", "containerization", "orchestration",
    ]

    text_lower = text.lower()
    for term in domain_terms:
        if term.lower() in text_lower:
            keywords.add(term)

    return sorted(keywords)
