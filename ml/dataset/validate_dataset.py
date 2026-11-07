"""
ResumeFit AI — Dataset Validation Script
=========================================
Loads all three splits, checks schema compliance, detects duplicates,
reports statistics, and saves a JSON report.
SYNTHETIC DATA — NOT REAL CANDIDATE INFORMATION
"""

import json
import re
from collections import defaultdict
from pathlib import Path

BASE_DIR = Path(__file__).parent
SPLITS_DIR = BASE_DIR / "splits"
REPORT_PATH = BASE_DIR / "dataset_report.json"

# ─── Required output fields and their types ──────────────────────────────────
REQUIRED_OUTPUT_FIELDS = {
    "overall_match": int,
    "technical_skill_match": int,
    "experience_match": int,
    "keyword_coverage": int,
    "matching_skills": list,
    "missing_skills": list,
    "partial_matches": list,
    "transferable_skills": list,
    "summary_recommendation": str,
    "bullet_improvements": list,
    "skills_to_add_to_resume": list,
    "ats_keywords": list,
    "ats_issues": list,
    "section_analysis": dict,
    "action_plan": list,
    "hallucination_check": str,
    "data_quality_notes": str,
}

REQUIRED_INPUT_FIELDS = {
    "resume_text": str,
    "job_description": str,
    "target_role": str,
}

REQUIRED_TOP_FIELDS = {
    "id": str,
    "role_category": str,
    "experience_level": str,
    "synthetic": bool,
    "input": dict,
    "output": dict,
}

SECTION_ANALYSIS_KEYS = {
    "professional_summary", "technical_skills", "experience", "projects", "education"
}

VALID_PRIORITIES = {"high", "medium", "low"}
VALID_CATEGORIES = {"resume_edit", "skill_development", "strategy"}


# ─── Loaders ─────────────────────────────────────────────────────────────────

def load_jsonl(path: Path) -> list:
    examples = []
    with open(path, "r", encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                examples.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"  [ERROR] JSON parse error in {path.name} line {lineno}: {e}")
    return examples


# ─── Schema checker ───────────────────────────────────────────────────────────

def check_schema(ex: dict, split_name: str, idx: int) -> list:
    errors = []
    prefix = f"[{split_name}#{idx}]"

    # Top-level fields
    for field, expected_type in REQUIRED_TOP_FIELDS.items():
        if field not in ex:
            errors.append(f"{prefix} Missing top-level field: '{field}'")
        elif not isinstance(ex[field], expected_type):
            errors.append(
                f"{prefix} Field '{field}' expected {expected_type.__name__}, "
                f"got {type(ex[field]).__name__}"
            )

    if "synthetic" in ex and ex["synthetic"] is not True:
        errors.append(f"{prefix} 'synthetic' must be True")

    # Input fields
    inp = ex.get("input", {})
    for field, expected_type in REQUIRED_INPUT_FIELDS.items():
        if field not in inp:
            errors.append(f"{prefix} Missing input field: '{field}'")
        elif not isinstance(inp[field], expected_type):
            errors.append(f"{prefix} input['{field}'] wrong type")
        elif not inp[field].strip():
            errors.append(f"{prefix} input['{field}'] is empty string")

    # Resume length check
    resume_text = inp.get("resume_text", "")
    word_count = len(resume_text.split())
    if word_count < 30:
        errors.append(f"{prefix} resume_text too short ({word_count} words, expected ≥150)")

    # Output fields
    out = ex.get("output", {})
    for field, expected_type in REQUIRED_OUTPUT_FIELDS.items():
        if field not in out:
            errors.append(f"{prefix} Missing output field: '{field}'")
        elif not isinstance(out[field], expected_type):
            errors.append(
                f"{prefix} output['{field}'] expected {expected_type.__name__}, "
                f"got {type(out[field]).__name__}"
            )

    # Score range checks
    for score_field in ("overall_match", "technical_skill_match", "experience_match", "keyword_coverage"):
        val = out.get(score_field, -1)
        if isinstance(val, int) and not (0 <= val <= 100):
            errors.append(f"{prefix} output['{score_field}']={val} out of [0,100]")

    # section_analysis keys
    sec = out.get("section_analysis", {})
    if isinstance(sec, dict):
        for key in SECTION_ANALYSIS_KEYS:
            if key not in sec:
                errors.append(f"{prefix} section_analysis missing key '{key}'")

    # action_plan items
    for i, ap in enumerate(out.get("action_plan", [])):
        if not isinstance(ap, dict):
            errors.append(f"{prefix} action_plan[{i}] is not a dict")
            continue
        if ap.get("priority") not in VALID_PRIORITIES:
            errors.append(f"{prefix} action_plan[{i}].priority invalid: {ap.get('priority')}")
        if ap.get("category") not in VALID_CATEGORIES:
            errors.append(f"{prefix} action_plan[{i}].category invalid: {ap.get('category')}")
        if not ap.get("action", "").strip():
            errors.append(f"{prefix} action_plan[{i}].action is empty")

    # bullet_improvements structure
    for i, bi in enumerate(out.get("bullet_improvements", [])):
        if not isinstance(bi, dict):
            errors.append(f"{prefix} bullet_improvements[{i}] is not a dict")
            continue
        for key in ("original", "improved", "reason", "jd_relevance"):
            if key not in bi:
                errors.append(f"{prefix} bullet_improvements[{i}] missing key '{key}'")

    # hallucination_check
    if out.get("hallucination_check") != "PASS":
        errors.append(f"{prefix} hallucination_check != 'PASS'")

    return errors


# ─── Semantic checks ─────────────────────────────────────────────────────────

def check_semantic(ex: dict, split_name: str, idx: int) -> list:
    warnings = []
    prefix = f"[{split_name}#{idx}]"
    resume_text = ex.get("input", {}).get("resume_text", "")
    out = ex.get("output", {})

    # matching_skills should be in resume
    for skill in out.get("matching_skills", []):
        if not re.search(re.escape(skill), resume_text, re.IGNORECASE):
            warnings.append(
                f"{prefix} SEMANTIC: matching_skill '{skill}' not found in resume_text"
            )

    # missing_skills should NOT be in resume
    for skill in out.get("missing_skills", []):
        if re.search(re.escape(skill), resume_text, re.IGNORECASE):
            warnings.append(
                f"{prefix} SEMANTIC: missing_skill '{skill}' IS in resume_text (contradiction)"
            )

    return warnings


# ─── Duplicate detection ─────────────────────────────────────────────────────

def detect_duplicates(all_examples: list) -> list:
    """Flag examples with highly similar resume_text (first 200 chars match)."""
    seen = {}
    dupes = []
    for ex in all_examples:
        key = ex.get("input", {}).get("resume_text", "")[:200].strip().lower()
        key = re.sub(r"\s+", " ", key)
        ex_id = ex.get("id", "?")
        if key in seen:
            dupes.append((ex_id, seen[key]))
        else:
            seen[key] = ex_id
    return dupes


# ─── Statistics ───────────────────────────────────────────────────────────────

def compute_stats(examples: list, split_name: str) -> dict:
    if not examples:
        return {}

    role_counts = defaultdict(int)
    level_counts = defaultdict(int)
    overall_scores = []
    tech_scores = []
    exp_scores = []
    kw_scores = []
    matching_counts = []
    missing_counts = []
    resume_word_counts = []
    jd_word_counts = []

    for ex in examples:
        role_counts[ex.get("role_category", "unknown")] += 1
        level_counts[ex.get("experience_level", "unknown")] += 1
        out = ex.get("output", {})
        overall_scores.append(out.get("overall_match", 0))
        tech_scores.append(out.get("technical_skill_match", 0))
        exp_scores.append(out.get("experience_match", 0))
        kw_scores.append(out.get("keyword_coverage", 0))
        matching_counts.append(len(out.get("matching_skills", [])))
        missing_counts.append(len(out.get("missing_skills", [])))
        inp = ex.get("input", {})
        resume_word_counts.append(len(inp.get("resume_text", "").split()))
        jd_word_counts.append(len(inp.get("job_description", "").split()))

    def avg(lst):
        return round(sum(lst) / len(lst), 2) if lst else 0

    # Estimate token length (rough: 1 token ≈ 0.75 words)
    avg_tokens = avg([int((r + j) / 0.75) for r, j in zip(resume_word_counts, jd_word_counts)])

    return {
        "split": split_name,
        "total": len(examples),
        "role_distribution": dict(role_counts),
        "level_distribution": dict(level_counts),
        "avg_overall_match": avg(overall_scores),
        "avg_technical_skill_match": avg(tech_scores),
        "avg_experience_match": avg(exp_scores),
        "avg_keyword_coverage": avg(kw_scores),
        "avg_matching_skills_count": avg(matching_counts),
        "avg_missing_skills_count": avg(missing_counts),
        "avg_resume_word_count": avg(resume_word_counts),
        "avg_jd_word_count": avg(jd_word_counts),
        "avg_estimated_tokens": avg_tokens,
    }


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("ResumeFit AI — Dataset Validation")
    print("=" * 55)

    split_files = {
        "train": SPLITS_DIR / "train.jsonl",
        "validation": SPLITS_DIR / "validation.jsonl",
        "test": SPLITS_DIR / "test.jsonl",
    }

    splits = {}
    for name, path in split_files.items():
        if not path.exists():
            print(f"  [MISSING] {path}")
            splits[name] = []
        else:
            splits[name] = load_jsonl(path)
            print(f"  Loaded {len(splits[name])} examples from {path.name}")

    all_examples = splits["train"] + splits["validation"] + splits["test"]

    # Schema + semantic checks
    all_errors = []
    all_warnings = []
    for split_name, examples in splits.items():
        for idx, ex in enumerate(examples):
            errs = check_schema(ex, split_name, idx)
            warns = check_semantic(ex, split_name, idx)
            all_errors.extend(errs)
            all_warnings.extend(warns)

    print(f"\n  Schema errors  : {len(all_errors)}")
    print(f"  Semantic warns : {len(all_warnings)}")
    if all_errors:
        print("\n  ERRORS:")
        for e in all_errors[:20]:
            print(f"    {e}")
        if len(all_errors) > 20:
            print(f"    ... and {len(all_errors)-20} more")
    if all_warnings:
        print("\n  SEMANTIC WARNINGS:")
        for w in all_warnings[:20]:
            print(f"    {w}")
        if len(all_warnings) > 20:
            print(f"    ... and {len(all_warnings)-20} more")

    # Duplicate detection
    dupes = detect_duplicates(all_examples)
    print(f"\n  Duplicate pairs detected: {len(dupes)}")
    for d in dupes[:5]:
        print(f"    {d[0]} ≈ {d[1]}")

    # Statistics
    report = {
        "validation_summary": {
            "total_examples": len(all_examples),
            "schema_errors": len(all_errors),
            "semantic_warnings": len(all_warnings),
            "duplicate_pairs": len(dupes),
            "error_details": all_errors[:50],
            "warning_details": all_warnings[:50],
            "duplicate_details": [list(d) for d in dupes[:20]],
        },
        "splits": {},
    }

    for split_name, examples in splits.items():
        stats = compute_stats(examples, split_name)
        report["splits"][split_name] = stats

        print(f"\n  ── {split_name.upper()} SPLIT ──")
        print(f"    Total          : {stats.get('total', 0)}")
        print(f"    Avg overall    : {stats.get('avg_overall_match', 0)}")
        print(f"    Avg tech match : {stats.get('avg_technical_skill_match', 0)}")
        print(f"    Avg exp match  : {stats.get('avg_experience_match', 0)}")
        print(f"    Avg kw cov     : {stats.get('avg_keyword_coverage', 0)}")
        print(f"    Avg resume wds : {stats.get('avg_resume_word_count', 0)}")
        print(f"    Avg JD words   : {stats.get('avg_jd_word_count', 0)}")
        print(f"    Avg tokens est : {stats.get('avg_estimated_tokens', 0)}")
        print(f"    Role dist      : {stats.get('role_distribution', {})}")
        print(f"    Level dist     : {stats.get('level_distribution', {})}")

    # Save report
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n  Report saved → {REPORT_PATH}")

    # Final verdict
    if len(all_errors) == 0 and len(all_warnings) == 0:
        print("\n  ✓ VALIDATION PASSED — dataset is clean and schema-compliant.")
    elif len(all_errors) == 0:
        print(f"\n  ⚠ VALIDATION PASSED WITH {len(all_warnings)} SEMANTIC WARNINGS.")
    else:
        print(f"\n  ✗ VALIDATION FAILED — {len(all_errors)} schema errors found.")

    print("=" * 55)


if __name__ == "__main__":
    main()
