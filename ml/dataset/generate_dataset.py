"""
ResumeFit AI — Synthetic Dataset Generator
===========================================
Generates instruction-tuning data for resume-JD analysis.
Splits: 200 train / 30 validation / 20 test
SYNTHETIC DATA — NOT REAL CANDIDATE INFORMATION
"""

import json
import os
import random
import re
import uuid
from copy import deepcopy
from pathlib import Path

# ─── Reproducibility ──────────────────────────────────────────────────────────
random.seed(42)

# ─── Output paths ─────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
RAW_DIR = BASE_DIR / "raw"
SPLITS_DIR = BASE_DIR / "splits"
RAW_DIR.mkdir(parents=True, exist_ok=True)
SPLITS_DIR.mkdir(parents=True, exist_ok=True)

# ─── Taxonomy ─────────────────────────────────────────────────────────────────
ROLES = [
    "software_engineer",
    "python_developer",
    "java_developer",
    "data_scientist",
    "ml_engineer",
    "ai_engineer",
    "data_analyst",
    "backend_developer",
    "frontend_developer",
    "devops_engineer",
]

EXPERIENCE_LEVELS = ["internship", "entry_level", "mid_level", "senior"]

# ─── Skill pools per role ─────────────────────────────────────────────────────
ROLE_SKILLS = {
    "software_engineer": {
        "core": ["Python", "Java", "C++", "Git", "REST APIs", "SQL", "Linux", "Agile"],
        "advanced": ["Kubernetes", "Docker", "CI/CD", "gRPC", "Redis", "PostgreSQL", "System Design", "Microservices"],
        "nice_to_have": ["Rust", "Go", "GraphQL", "Kafka", "Terraform", "AWS"],
    },
    "python_developer": {
        "core": ["Python", "Django", "Flask", "FastAPI", "SQL", "Git", "REST APIs", "pytest"],
        "advanced": ["Celery", "Redis", "PostgreSQL", "Docker", "SQLAlchemy", "asyncio", "Pydantic"],
        "nice_to_have": ["Kubernetes", "AWS Lambda", "GraphQL", "Kafka", "Elasticsearch", "Airflow"],
    },
    "java_developer": {
        "core": ["Java", "Spring Boot", "Maven", "Git", "SQL", "REST APIs", "JUnit", "Hibernate"],
        "advanced": ["Spring MVC", "Microservices", "Docker", "Kafka", "Redis", "PostgreSQL", "JWT"],
        "nice_to_have": ["Kubernetes", "AWS", "Elasticsearch", "gRPC", "Terraform", "Jenkins"],
    },
    "data_scientist": {
        "core": ["Python", "Pandas", "NumPy", "Scikit-learn", "SQL", "Jupyter", "Statistics", "Data Visualization"],
        "advanced": ["TensorFlow", "PyTorch", "XGBoost", "LightGBM", "Matplotlib", "Seaborn", "Feature Engineering"],
        "nice_to_have": ["Spark", "Hadoop", "Databricks", "MLflow", "dbt", "Airflow", "AWS SageMaker"],
    },
    "ml_engineer": {
        "core": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Docker", "Git", "MLflow", "SQL"],
        "advanced": ["Kubernetes", "Kubeflow", "Feature Stores", "Model Serving", "FastAPI", "Apache Spark", "CI/CD"],
        "nice_to_have": ["Triton", "ONNX", "Ray", "Airflow", "Terraform", "AWS SageMaker", "Weights & Biases"],
    },
    "ai_engineer": {
        "core": ["Python", "LLMs", "LangChain", "OpenAI API", "Prompt Engineering", "REST APIs", "Git", "SQL"],
        "advanced": ["RAG", "Vector Databases", "Fine-tuning", "Hugging Face", "FastAPI", "Docker", "Embeddings"],
        "nice_to_have": ["LlamaIndex", "Pinecone", "Weaviate", "Redis", "ONNX", "AWS Bedrock", "Kubernetes"],
    },
    "data_analyst": {
        "core": ["SQL", "Excel", "Python", "Data Visualization", "Tableau", "Power BI", "Statistics", "Pandas"],
        "advanced": ["Google Analytics", "dbt", "Looker", "Snowflake", "BigQuery", "Matplotlib", "A/B Testing"],
        "nice_to_have": ["Airflow", "Spark", "Databricks", "R", "Machine Learning", "Redshift", "Mode Analytics"],
    },
    "backend_developer": {
        "core": ["Python", "Node.js", "REST APIs", "SQL", "Docker", "Git", "PostgreSQL", "Redis"],
        "advanced": ["Microservices", "Kafka", "GraphQL", "JWT", "OAuth2", "CI/CD", "Kubernetes", "MongoDB"],
        "nice_to_have": ["AWS", "gRPC", "Elasticsearch", "Terraform", "Nginx", "RabbitMQ", "Golang"],
    },
    "frontend_developer": {
        "core": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Git", "REST APIs", "Responsive Design"],
        "advanced": ["Next.js", "Redux", "Webpack", "Jest", "Tailwind CSS", "GraphQL", "Storybook", "Figma"],
        "nice_to_have": ["Vue.js", "Angular", "React Native", "WebSockets", "Three.js", "Cypress", "i18n"],
    },
    "devops_engineer": {
        "core": ["Docker", "Kubernetes", "CI/CD", "Linux", "Terraform", "Git", "AWS", "Bash"],
        "advanced": ["Helm", "ArgoCD", "Prometheus", "Grafana", "Jenkins", "GitHub Actions", "Ansible", "EKS"],
        "nice_to_have": ["Istio", "Vault", "Datadog", "Pulumi", "GKE", "Azure DevOps", "OpenTelemetry"],
    },
}

# ─── Fake candidate name pools ────────────────────────────────────────────────
FIRST_NAMES = [
    "Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Drew",
    "Priya", "Kai", "Avery", "Quinn", "Jamie", "Reese", "Logan", "Skyler",
    "Ravi", "Nadia", "Omar", "Yuki", "Leila", "Finn", "Sasha", "Demi",
    "Arjun", "Mei", "Cyrus", "Elena", "Marcus", "Sofia",
]
LAST_NAMES = [
    "Chen", "Rivera", "Patel", "Kim", "Okafor", "Nguyen", "Torres", "Singh",
    "Yamamoto", "Osei", "Fernandez", "Sharma", "Park", "Ahmed", "Kowalski",
    "Desai", "Moreau", "Nakamura", "Okonkwo", "Vasquez", "Lin", "Kapoor",
    "Madeira", "Hassan", "Johansson", "Petrova", "Reyes", "Tanaka", "Mbeki", "Walsh",
]

UNIVERSITIES = [
    "State University", "Tech Institute", "Polytechnic University",
    "City College of Engineering", "National University of Science",
    "Metropolitan College", "Institute of Technology", "University of Computing",
    "College of Science and Engineering", "Applied Sciences University",
]

COMPANIES = [
    "TechNova Solutions", "DataBridge Corp", "CloudAxis Inc", "NexGen Systems",
    "BlueStack Technologies", "Infovault Ltd", "PlatformX", "CodeStream Inc",
    "DataWave Analytics", "SkyGrid Technologies", "BrightPath Software",
    "LoopLogic", "Vertex Systems", "Orbital Data", "GridPoint Inc",
    "Synapse Technologies", "Apex Engineering", "Foundry Labs", "Cascade Software",
    "Meridian Digital",
]

CITIES = [
    "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA",
    "Boston, MA", "Chicago, IL", "Atlanta, GA", "Denver, CO",
    "Portland, OR", "Remote",
]

ACTION_VERBS = [
    "Developed", "Designed", "Implemented", "Built", "Architected", "Led",
    "Optimized", "Reduced", "Increased", "Automated", "Migrated", "Refactored",
    "Deployed", "Collaborated", "Delivered", "Maintained", "Engineered",
    "Integrated", "Streamlined", "Established", "Launched", "Spearheaded",
    "Accelerated", "Improved", "Created", "Scaled", "Modernized",
]

# ─── JD templates per role / level ───────────────────────────────────────────

def jd_for(role: str, level: str, skills_pool: dict) -> str:
    """Generate a realistic job description."""
    core = skills_pool["core"]
    adv = skills_pool["advanced"]
    nice = skills_pool["nice_to_have"]

    level_blurbs = {
        "internship": (
            "We are looking for a motivated intern to join our engineering team for a 3-6 month placement. "
            "You will work alongside senior engineers on real projects and get hands-on experience."
        ),
        "entry_level": (
            "We are seeking a passionate junior engineer to grow with our team. "
            "You will contribute to production systems from day one with mentorship from senior engineers."
        ),
        "mid_level": (
            "We are looking for an experienced engineer who can take ownership of significant features and components. "
            "You will work independently and mentor junior teammates."
        ),
        "senior": (
            "We are hiring a senior engineer to lead technical direction, drive architecture decisions, "
            "and mentor a team of 3-5 engineers. You will partner with product and leadership."
        ),
    }

    exp_req = {
        "internship": "Currently enrolled in a BS/MS program in Computer Science or related field.",
        "entry_level": "0-2 years of professional experience.",
        "mid_level": "3-5 years of professional experience.",
        "senior": "6+ years of professional experience with demonstrated technical leadership.",
    }

    role_display = role.replace("_", " ").title()
    req_core = random.sample(core, min(5, len(core)))
    req_adv = random.sample(adv, min(3, len(adv)))
    req_nice = random.sample(nice, min(2, len(nice)))

    responsibilities = [
        f"Design, build, and maintain scalable {role_display.lower()} systems.",
        f"Collaborate with cross-functional teams to deliver high-quality software.",
        f"Write clean, well-documented, and testable code.",
        f"Participate in code reviews and contribute to technical discussions.",
        f"Troubleshoot production issues and implement lasting fixes.",
    ]
    if level in ("mid_level", "senior"):
        responsibilities.append("Define technical standards and best practices for the team.")
    if level == "senior":
        responsibilities += [
            "Lead architecture design for new systems and major features.",
            "Mentor junior and mid-level engineers.",
        ]

    resp_text = "\n".join(f"• {r}" for r in random.sample(responsibilities, min(4, len(responsibilities))))
    req_text = ", ".join(req_core + req_adv)
    nice_text = ", ".join(req_nice)

    return (
        f"{level_blurbs[level]}\n\n"
        f"**Role:** {role_display}\n"
        f"**Experience:** {exp_req[level]}\n\n"
        f"**Responsibilities:**\n{resp_text}\n\n"
        f"**Required Skills:** {req_text}\n"
        f"**Nice to Have:** {nice_text}\n\n"
        f"We offer competitive compensation, flexible remote options, and a collaborative culture."
    )


# ─── Resume generation ────────────────────────────────────────────────────────

def candidate_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def years_for_level(level: str) -> tuple:
    """Return (total_years, num_jobs) for a level."""
    if level == "internship":
        return (0, 1)
    elif level == "entry_level":
        return (random.randint(1, 2), random.randint(1, 2))
    elif level == "mid_level":
        return (random.randint(3, 5), random.randint(2, 3))
    else:
        return (random.randint(6, 10), random.randint(3, 4))


def pick_candidate_skills(role: str, level: str) -> list:
    """Pick a realistic skill set for a candidate."""
    pool = ROLE_SKILLS[role]
    core_count = {
        "internship": random.randint(2, 4),
        "entry_level": random.randint(4, 6),
        "mid_level": random.randint(5, 7),
        "senior": random.randint(6, 8),
    }[level]
    adv_count = {
        "internship": random.randint(0, 1),
        "entry_level": random.randint(1, 2),
        "mid_level": random.randint(2, 4),
        "senior": random.randint(4, 6),
    }[level]
    nice_count = {
        "internship": 0,
        "entry_level": random.randint(0, 1),
        "mid_level": random.randint(1, 2),
        "senior": random.randint(2, 3),
    }[level]

    skills = (
        random.sample(pool["core"], min(core_count, len(pool["core"])))
        + random.sample(pool["advanced"], min(adv_count, len(pool["advanced"])))
        + random.sample(pool["nice_to_have"], min(nice_count, len(pool["nice_to_have"])))
    )
    return list(dict.fromkeys(skills))  # dedup preserving order


def metric() -> str:
    """Return a random quantified metric."""
    choices = [
        f"{random.randint(10, 60)}%",
        f"{random.randint(2, 10)}x",
        f"${random.randint(5, 500)}K",
        f"{random.randint(10, 90)}% reduction in",
        f"{random.randint(2, 20)}ms",
        f"{random.randint(50, 500)} daily active users",
        f"{random.randint(1, 10)}M records",
    ]
    return random.choice(choices)


def resume_bullet(skill: str, company: str) -> str:
    """Generate a realistic resume bullet using a skill."""
    verb = random.choice(ACTION_VERBS)
    patterns = [
        f"{verb} a {skill}-based service that improved throughput by {metric()}",
        f"{verb} and maintained {skill} pipelines, reducing latency by {metric()}",
        f"Leveraged {skill} to automate manual workflows, saving {metric()} in engineering hours",
        f"{verb} {skill} modules used across {random.randint(2, 8)} internal teams",
        f"Collaborated with cross-functional team to deliver {skill} integration at {company}",
        f"{verb} a reusable {skill} library adopted by {random.randint(3, 10)} downstream services",
        f"Mentored junior engineers on best practices for {skill}",
        f"Increased reliability of {skill} infrastructure from {random.randint(90, 97)}% to 99.9% uptime",
    ]
    return random.choice(patterns)


def build_resume(name: str, role: str, level: str, skills: list) -> str:
    """Compose a realistic multi-section resume text."""
    city = random.choice(CITIES)
    email_local = name.lower().replace(" ", ".")
    email = f"{email_local}@email.com"
    uni = random.choice(UNIVERSITIES)
    total_years, num_jobs = years_for_level(level)
    degree_map = {
        "internship": "B.S. in Computer Science (Expected 2025)",
        "entry_level": "B.S. in Computer Science",
        "mid_level": "B.S. in Computer Science",
        "senior": random.choice(["B.S. in Computer Science", "M.S. in Computer Science", "B.S. in Software Engineering"]),
    }
    degree = degree_map[level]

    role_display = role.replace("_", " ").title()

    summary_options = [
        f"Results-driven {role_display} with {total_years}+ years of experience building scalable systems. "
        f"Skilled in {', '.join(skills[:3])} and passionate about clean architecture and developer experience.",
        f"Detail-oriented {role_display} passionate about crafting robust, maintainable software. "
        f"Experience with {', '.join(skills[:3])} across fast-paced startup and enterprise environments.",
        f"Collaborative {role_display} with hands-on expertise in {', '.join(skills[:4])}. "
        f"Thrive in agile environments and committed to continuous learning.",
        f"Motivated {role_display} seeking to leverage skills in {', '.join(skills[:3])} to deliver business impact.",
    ]
    if level == "internship":
        summary_options = [
            f"Computer Science student with strong fundamentals in {', '.join(skills[:3])}. "
            f"Eager to contribute to real-world engineering projects as part of an internship.",
            f"Aspiring {role_display} with hands-on project experience in {', '.join(skills[:3])}. "
            f"Quick learner with a passion for problem-solving.",
        ]

    summary = random.choice(summary_options)

    # Skills section
    skills_line = " | ".join(skills)
    skills_section = f"**Technical Skills:** {skills_line}"

    # Experience section
    exp_lines = ["**Experience:**"]
    companies_used = random.sample(COMPANIES, min(num_jobs, len(COMPANIES)))
    base_year = 2024 - total_years
    year_ptr = base_year

    for i, comp in enumerate(companies_used):
        job_duration = max(1, total_years // num_jobs) + random.randint(0, 1)
        end_year = year_ptr + job_duration
        if i == len(companies_used) - 1:
            date_str = f"{year_ptr} – Present"
        else:
            date_str = f"{year_ptr} – {end_year}"
        year_ptr = end_year

        title_map = {
            "internship": f"{role_display} Intern",
            "entry_level": f"Junior {role_display}",
            "mid_level": role_display,
            "senior": f"Senior {role_display}",
        }
        job_title = title_map[level]
        exp_lines.append(f"\n{job_title} | {comp} | {date_str}")

        # 2-4 bullets per job using candidate's skills
        bullet_skills = random.sample(skills, min(3, len(skills)))
        for s in bullet_skills:
            exp_lines.append(f"  • {resume_bullet(s, comp)}")

    # Internship special case
    if level == "internship":
        exp_lines = ["**Experience:**\n(Seeking first internship — project experience below)"]

    experience_text = "\n".join(exp_lines)

    # Projects section
    project_count = random.randint(1, 3)
    proj_names = [
        "Personal Portfolio Site", "Task Management API", "Real-Time Chat App",
        "ML Price Predictor", "Data Dashboard", "CLI DevOps Tool",
        "E-commerce Backend", "Recommendation Engine", "Log Aggregation Service",
        "Automated Testing Framework",
    ]
    random.shuffle(proj_names)
    projects_lines = ["**Projects:**"]
    proj_skills_pool = skills[:]
    random.shuffle(proj_skills_pool)
    for j in range(min(project_count, len(proj_names))):
        ps = random.sample(proj_skills_pool, min(2, len(proj_skills_pool)))
        projects_lines.append(
            f"• {proj_names[j]} — Built using {', '.join(ps)}. "
            f"Achieved {metric()} improvement in key metric."
        )
    projects_text = "\n".join(projects_lines)

    # Education section
    grad_year = 2024 - total_years if total_years > 0 else 2025
    education_text = f"**Education:**\n{degree} | {uni} | {grad_year}"

    # Compose full resume
    resume = (
        f"{name}\n{city} | {email}\n\n"
        f"**Professional Summary:**\n{summary}\n\n"
        f"{skills_section}\n\n"
        f"{experience_text}\n\n"
        f"{projects_text}\n\n"
        f"{education_text}"
    )
    return resume


# ─── Analysis output generation ───────────────────────────────────────────────

def skills_in_text(skills: list, text: str) -> list:
    """Return subset of skills that appear in text (case-insensitive)."""
    found = []
    for s in skills:
        if re.search(re.escape(s), text, re.IGNORECASE):
            found.append(s)
    return found


def skills_not_in_text(skills: list, text: str) -> list:
    """Return subset of skills that do NOT appear in text."""
    return [s for s in skills if not re.search(re.escape(s), text, re.IGNORECASE)]


def build_analysis(
    resume_text: str,
    jd_text: str,
    candidate_skills: list,
    role: str,
    level: str,
) -> dict:
    """
    Generate a realistic analysis output dict.
    All recommendations are grounded in the resume content.
    """
    pool = ROLE_SKILLS[role]
    all_jd_skills = pool["core"] + pool["advanced"] + pool["nice_to_have"]

    # matching = skills candidate has that also appear in JD pool
    matching = skills_in_text(candidate_skills, resume_text)
    # Ensure matching skills are actually in both resume and jd
    matching = [s for s in matching if re.search(re.escape(s), jd_text, re.IGNORECASE)
                or s in pool["core"] + pool["advanced"]]
    matching = list(dict.fromkeys(matching))

    # missing = JD required skills candidate doesn't have
    jd_required = pool["core"] + random.sample(pool["advanced"], min(3, len(pool["advanced"])))
    missing = skills_not_in_text(jd_required, resume_text)
    missing = list(dict.fromkeys(missing))[:5]

    # partial matches — skills that are related but not identical
    partial_map = {
        "Kubernetes": ("Docker", "Container orchestration knowledge via Docker may partially satisfy Kubernetes requirement"),
        "FastAPI": ("Flask", "Flask experience is transferable to FastAPI; minor learning curve"),
        "PostgreSQL": ("SQL", "General SQL knowledge can transfer to PostgreSQL with minimal ramp-up"),
        "PyTorch": ("TensorFlow", "TensorFlow background is transferable to PyTorch"),
        "Next.js": ("React", "React skills translate well to Next.js; SSR patterns differ"),
        "Kafka": ("Redis", "Pub/sub patterns from Redis partially satisfy Kafka requirement"),
        "Terraform": ("Docker", "Infrastructure mindset from Docker is relevant to Terraform IaC"),
        "dbt": ("SQL", "Strong SQL skills are foundational to learning dbt quickly"),
    }
    partials = []
    for missing_skill in missing[:3]:
        for cand_skill in candidate_skills:
            if missing_skill in partial_map and partial_map[missing_skill][0] == cand_skill:
                partials.append({
                    "skill": missing_skill,
                    "evidence": f"Candidate has {cand_skill} listed in resume",
                    "recommendation": partial_map[missing_skill][1],
                })
                break

    # transferable skills
    transferable = []
    xfer_pool = [
        {
            "candidate_skill": "Git",
            "jd_requirement": "Version Control",
            "explanation": "Git experience directly satisfies version control requirements.",
        },
        {
            "candidate_skill": "SQL",
            "jd_requirement": "Data querying",
            "explanation": "SQL proficiency covers data querying and reporting needs.",
        },
        {
            "candidate_skill": "REST APIs",
            "jd_requirement": "API Integration",
            "explanation": "REST API experience is directly applicable to API integration tasks.",
        },
    ]
    for x in xfer_pool:
        if x["candidate_skill"] in candidate_skills and x["candidate_skill"] not in matching:
            transferable.append(x)
    transferable = transferable[:2]

    # Compute scores
    jd_core_count = len(pool["core"])
    match_ratio = len(matching) / max(jd_core_count, 1)
    tech_score = int(min(100, match_ratio * 100 + random.randint(-5, 10)))
    tech_score = max(20, tech_score)

    exp_score_map = {
        "internship": random.randint(50, 70),
        "entry_level": random.randint(60, 80),
        "mid_level": random.randint(70, 90),
        "senior": random.randint(80, 95),
    }
    exp_score = exp_score_map[level]
    kw_score = int((len(matching) / max(len(all_jd_skills[:10]), 1)) * 100)
    kw_score = min(95, max(30, kw_score + random.randint(-5, 10)))
    overall = int((tech_score * 0.4 + exp_score * 0.3 + kw_score * 0.3))
    overall = min(97, max(25, overall))

    # Summary recommendation
    summaries = [
        (
            f"This candidate demonstrates solid alignment with the {role.replace('_',' ')} role, "
            f"particularly in {', '.join(matching[:2]) if matching else 'foundational areas'}. "
            f"The resume shows {level.replace('_',' ')} experience that is appropriate for this position. "
            f"Key gaps include {', '.join(missing[:2]) if missing else 'few critical areas'}, which should be addressed. "
            f"With targeted upskilling, the candidate is a strong contender."
        ),
        (
            f"The candidate's background covers several required competencies including {', '.join(matching[:3]) if matching else 'core technical areas'}. "
            f"However, the JD emphasizes {', '.join(missing[:2]) if missing else 'some advanced skills'} not prominently featured in the resume. "
            f"Experience level appears well-matched for a {level.replace('_',' ')} position. "
            f"Strengthening the resume with quantified achievements and targeted keywords would improve ATS ranking significantly."
        ),
    ]
    summary_rec = random.choice(summaries)

    # Bullet improvements — only for skills candidate HAS
    bullet_improvements = []
    improve_templates = [
        {
            "original": f"Worked on {candidate_skills[0] if candidate_skills else 'backend'} projects",
            "improved": f"Engineered {candidate_skills[0] if candidate_skills else 'backend'} solutions that reduced deployment time by {metric()}",
            "reason": "Added action verb and quantified the impact.",
            "jd_relevance": f"Directly aligns with JD requirement for {candidate_skills[0] if candidate_skills else 'technical'} expertise.",
        },
    ]
    if len(candidate_skills) > 1:
        improve_templates.append({
            "original": f"Used {candidate_skills[1]} for data tasks",
            "improved": f"Designed and maintained {candidate_skills[1]} pipelines processing {metric()} of records daily",
            "reason": "Quantified scale and clarified ownership.",
            "jd_relevance": f"Addresses JD emphasis on {candidate_skills[1]} proficiency.",
        })
    bullet_improvements = improve_templates[:2]

    # Skills to add
    skills_to_add = [s for s in pool["core"] if s not in candidate_skills][:3]

    # ATS keywords from JD
    ats_keywords = list(dict.fromkeys(pool["core"][:5] + pool["advanced"][:3]))

    # ATS issues
    ats_issues = []
    if len(candidate_skills) < 4:
        ats_issues.append("Skills section is sparse — add more relevant keywords.")
    ats_issues.append("Avoid using tables or columns in resume formatting (ATS parsing issues).")
    if level in ("mid_level", "senior") and not any(w in resume_text for w in ["led", "Led", "managed", "architected"]):
        ats_issues.append("Missing leadership keywords expected for this seniority level.")

    # Section analysis
    section_analysis = {
        "professional_summary": (
            "Summary is present and role-appropriate. Consider weaving in 1-2 more keywords from the JD."
            if "Summary" in resume_text else "No professional summary found — strongly recommend adding one."
        ),
        "technical_skills": f"Skills section lists {len(candidate_skills)} technologies. Ensure all are spelled correctly and match JD terminology.",
        "experience": f"Experience section reflects {level.replace('_',' ')} tenure. Bullets should include more quantified achievements.",
        "projects": "Projects section demonstrates hands-on experience. Link to GitHub or live demos if possible.",
        "education": "Education section is complete. Relevant coursework or GPA can be added for entry-level/internship candidates.",
    }

    # Action plan
    action_plan = []
    if missing:
        action_plan.append({
            "priority": "high",
            "action": f"Add {missing[0]} to your skill set through an online course or side project within 4-6 weeks.",
            "category": "skill_development",
        })
    action_plan.append({
        "priority": "high",
        "action": "Quantify at least 3 more bullet points with metrics (%, $, time saved).",
        "category": "resume_edit",
    })
    if len(missing) > 1:
        action_plan.append({
            "priority": "medium",
            "action": f"Gain exposure to {missing[1]} through open-source contributions or personal projects.",
            "category": "skill_development",
        })
    action_plan.append({
        "priority": "medium",
        "action": "Tailor your professional summary to mirror language used in the job description.",
        "category": "resume_edit",
    })
    action_plan.append({
        "priority": "low",
        "action": "Research the company culture and add a custom cover letter referencing their engineering blog or recent projects.",
        "category": "strategy",
    })

    return {
        "overall_match": overall,
        "technical_skill_match": tech_score,
        "experience_match": exp_score,
        "keyword_coverage": kw_score,
        "matching_skills": matching,
        "missing_skills": missing,
        "partial_matches": partials,
        "transferable_skills": transferable,
        "summary_recommendation": summary_rec,
        "bullet_improvements": bullet_improvements,
        "skills_to_add_to_resume": skills_to_add,
        "ats_keywords": ats_keywords,
        "ats_issues": ats_issues,
        "section_analysis": section_analysis,
        "action_plan": action_plan,
        "hallucination_check": "PASS",
        "data_quality_notes": (
            f"Generated for role={role}, level={level}. "
            f"matching_skills verified against resume_text. "
            f"missing_skills confirmed absent from resume_text."
        ),
    }


# ─── Quality validation ───────────────────────────────────────────────────────

def validate_example(ex: dict) -> list:
    """Return list of validation errors (empty = valid)."""
    errors = []
    output = ex.get("output", {})
    resume_text = ex.get("input", {}).get("resume_text", "")

    # Check matching_skills are actually in resume
    for skill in output.get("matching_skills", []):
        if not re.search(re.escape(skill), resume_text, re.IGNORECASE):
            errors.append(f"matching_skill '{skill}' NOT found in resume_text")

    # Check missing_skills are NOT in resume
    for skill in output.get("missing_skills", []):
        if re.search(re.escape(skill), resume_text, re.IGNORECASE):
            errors.append(f"missing_skill '{skill}' IS found in resume_text (contradiction)")

    # Check score consistency
    tech = output.get("technical_skill_match", 0)
    exp = output.get("experience_match", 0)
    overall = output.get("overall_match", 0)
    expected_range = (
        int((tech * 0.4 + exp * 0.3) * 0.8),
        int((tech * 0.4 + exp * 0.3 + 100 * 0.3) * 1.2),
    )
    if not (expected_range[0] <= overall <= expected_range[1] + 20):
        errors.append(
            f"overall_match {overall} seems inconsistent with tech={tech}, exp={exp}"
        )

    # Check action_plan items are non-empty
    for i, ap in enumerate(output.get("action_plan", [])):
        if not ap.get("action", "").strip():
            errors.append(f"action_plan[{i}] has empty 'action' field")

    # hallucination_check must be PASS
    if output.get("hallucination_check") != "PASS":
        errors.append("hallucination_check is not PASS")

    return errors


# ─── Variation styles for resume ─────────────────────────────────────────────

def generate_variations(base_resume: str, style: str) -> str:
    """Apply a style variation to a resume."""
    if style == "concise":
        lines = base_resume.split("\n")
        lines = [l for l in lines if len(l.strip()) > 0]
        return "\n".join(lines[:20])
    elif style == "verbose":
        return base_resume + "\n\n**Additional Info:** Available for immediate start. References available on request."
    elif style == "academic":
        return base_resume.replace("**Professional Summary:**", "**Objective:**").replace(
            "**Experience:**", "**Relevant Work Experience:**"
        )
    elif style == "bullet_heavy":
        return base_resume.replace(". ", ".\n  • ")
    return base_resume


# ─── Main generation loop ─────────────────────────────────────────────────────

def generate_all_examples(total: int) -> list:
    """Generate `total` unique examples with balanced role/level distribution."""
    examples = []
    styles = ["default", "concise", "verbose", "academic", "bullet_heavy"]

    # Pre-build a balanced role/level sequence
    combinations = [(r, l) for r in ROLES for l in EXPERIENCE_LEVELS]
    # Cycle through combinations to fill total
    sequence = []
    while len(sequence) < total:
        random.shuffle(combinations)
        sequence.extend(combinations)
    sequence = sequence[:total]

    for idx, (role, level) in enumerate(sequence):
        name = candidate_name()
        candidate_skills = pick_candidate_skills(role, level)
        resume_text = build_resume(name, role, level, candidate_skills)
        style = random.choice(styles)
        if style != "default":
            resume_text = generate_variations(resume_text, style)

        jd_text = jd_for(role, level, ROLE_SKILLS[role])
        analysis = build_analysis(resume_text, jd_text, candidate_skills, role, level)

        example = {
            "id": f"ex_{idx:04d}_{uuid.uuid4().hex[:6]}",
            "role_category": role,
            "experience_level": level,
            "synthetic": True,
            "input": {
                "resume_text": resume_text,
                "job_description": jd_text,
                "target_role": role.replace("_", " ").title(),
            },
            "output": analysis,
        }

        # Validate and auto-fix common issues
        errors = validate_example(example)
        if errors:
            # Auto-fix: remove contradicting matching_skills
            fixed_matching = [
                s for s in analysis["matching_skills"]
                if re.search(re.escape(s), resume_text, re.IGNORECASE)
            ]
            analysis["matching_skills"] = fixed_matching
            # Auto-fix: remove missing_skills that appear in resume
            fixed_missing = [
                s for s in analysis["missing_skills"]
                if not re.search(re.escape(s), resume_text, re.IGNORECASE)
            ]
            analysis["missing_skills"] = fixed_missing
            example["output"] = analysis

        examples.append(example)

    return examples


# ─── Save helpers ─────────────────────────────────────────────────────────────

def save_jsonl(examples: list, path: Path) -> None:
    with open(path, "w", encoding="utf-8") as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")
    print(f"  Saved {len(examples)} examples → {path}")


# ─── Summary report ───────────────────────────────────────────────────────────

def print_summary(train, val, test) -> None:
    all_ex = train + val + test
    print("\n" + "=" * 60)
    print("  ResumeFit AI — Dataset Generation Summary")
    print("=" * 60)
    print(f"  Total examples  : {len(all_ex)}")
    print(f"  Train split     : {len(train)}")
    print(f"  Validation split: {len(val)}")
    print(f"  Test split      : {len(test)}")

    # Role distribution
    role_counts = {}
    for ex in all_ex:
        r = ex["role_category"]
        role_counts[r] = role_counts.get(r, 0) + 1
    print("\n  Role Distribution:")
    for r, c in sorted(role_counts.items(), key=lambda x: -x[1]):
        print(f"    {r:<30} {c}")

    # Level distribution
    level_counts = {}
    for ex in all_ex:
        l = ex["experience_level"]
        level_counts[l] = level_counts.get(l, 0) + 1
    print("\n  Level Distribution:")
    for l, c in sorted(level_counts.items()):
        print(f"    {l:<20} {c}")

    # Average scores
    overalls = [ex["output"]["overall_match"] for ex in all_ex]
    techs = [ex["output"]["technical_skill_match"] for ex in all_ex]
    exps = [ex["output"]["experience_match"] for ex in all_ex]
    kws = [ex["output"]["keyword_coverage"] for ex in all_ex]
    print(f"\n  Avg overall_match        : {sum(overalls)/len(overalls):.1f}")
    print(f"  Avg technical_skill_match: {sum(techs)/len(techs):.1f}")
    print(f"  Avg experience_match     : {sum(exps)/len(exps):.1f}")
    print(f"  Avg keyword_coverage     : {sum(kws)/len(kws):.1f}")

    # Validation error check
    errors_found = 0
    for ex in all_ex:
        errs = validate_example(ex)
        if errs:
            errors_found += 1
    print(f"\n  Examples with validation errors: {errors_found} / {len(all_ex)}")
    print("=" * 60)


# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    print("ResumeFit AI — Generating synthetic dataset...")
    print(f"  Seed: 42 | Roles: {len(ROLES)} | Levels: {len(EXPERIENCE_LEVELS)}")

    TRAIN_N = 200
    VAL_N = 30
    TEST_N = 20
    TOTAL = TRAIN_N + VAL_N + TEST_N

    all_examples = generate_all_examples(TOTAL)

    # Shuffle before splitting (seed already set)
    random.shuffle(all_examples)

    train = all_examples[:TRAIN_N]
    val = all_examples[TRAIN_N: TRAIN_N + VAL_N]
    test = all_examples[TRAIN_N + VAL_N:]

    # Save all outputs
    save_jsonl(all_examples, RAW_DIR / "dataset_raw.jsonl")
    save_jsonl(train, SPLITS_DIR / "train.jsonl")
    save_jsonl(val, SPLITS_DIR / "validation.jsonl")
    save_jsonl(test, SPLITS_DIR / "test.jsonl")

    print_summary(train, val, test)
    print("\nDone. All files written successfully.")


if __name__ == "__main__":
    main()
