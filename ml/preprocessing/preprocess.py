"""
ResumeFit AI — ML Preprocessing Pipeline
==========================================
Loads JSONL splits, formats into chat-template prompts for Qwen2.5,
tokenises (char-based estimate), filters, deduplicates, and writes
processed datasets + a statistics report.

Usage:
    python ml/preprocessing/preprocess.py
"""

import hashlib
import json
import logging
import os
import sys
from pathlib import Path
from statistics import mean, median
from typing import Any

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("preprocess")

# ─── Paths ───────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent.parent   # project root
SPLITS_DIR = ROOT / "ml" / "dataset" / "splits"
PROCESSED_DIR = ROOT / "ml" / "dataset" / "processed"
REPORT_PATH = ROOT / "ml" / "dataset" / "dataset_report.json"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# ─── Constants ───────────────────────────────────────────────────────────────
CHARS_PER_TOKEN = 3.5          # character-based token estimation
MAX_TOKENS = 4096              # filter threshold

SYSTEM_PROMPT = (
    "You are ResumeFit AI, an expert resume coach and career strategist. "
    "You analyse resumes against job descriptions and provide detailed, "
    "actionable recommendations. Your output is always a valid JSON object "
    "that follows the specified schema exactly — never add prose outside the JSON."
)

# ─── Formatting ──────────────────────────────────────────────────────────────

def format_prompt(example: dict) -> str:
    """Format a single dataset example into Qwen2.5 chat-template text."""
    inp = example["input"]
    resume_text = inp.get("resume_text", "").strip()
    job_description = inp.get("job_description", "").strip()
    target_role = inp.get("target_role", "").strip()
    output_json = json.dumps(example["output"], ensure_ascii=False, indent=2)

    user_msg = (
        "Analyze this resume against the job description and provide detailed recommendations.\n\n"
        f"## RESUME:\n{resume_text}\n\n"
        f"## JOB DESCRIPTION:\n{job_description}\n\n"
        f"## TARGET ROLE:\n{target_role}\n\n"
        "Respond with a valid JSON object following the specified schema exactly."
    )

    prompt = (
        f"<|im_start|>system\n{SYSTEM_PROMPT}<|im_end|>\n"
        f"<|im_start|>user\n{user_msg}<|im_end|>\n"
        f"<|im_start|>assistant\n{output_json}<|im_end|>"
    )
    return prompt


def estimate_tokens(text: str) -> int:
    """Estimate token count using character-based heuristic (~3.5 chars/token)."""
    return int(len(text) / CHARS_PER_TOKEN)


def input_hash(example: dict) -> str:
    """SHA-256 hash of the input fields (for deduplication)."""
    key = json.dumps(example["input"], sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(key.encode()).hexdigest()


# ─── Statistics helpers ───────────────────────────────────────────────────────

def percentile(data: list[float], pct: float) -> float:
    """Return the p-th percentile of a sorted list."""
    if not data:
        return 0.0
    sorted_data = sorted(data)
    idx = (pct / 100) * (len(sorted_data) - 1)
    lo, hi = int(idx), min(int(idx) + 1, len(sorted_data) - 1)
    return sorted_data[lo] + (sorted_data[hi] - sorted_data[lo]) * (idx - lo)


def token_stats(lengths: list[int]) -> dict:
    if not lengths:
        return {}
    return {
        "min": min(lengths),
        "max": max(lengths),
        "mean": round(mean(lengths), 1),
        "p50": round(percentile(lengths, 50), 1),
        "p75": round(percentile(lengths, 75), 1),
        "p90": round(percentile(lengths, 90), 1),
    }


def distribution(examples: list[dict], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for ex in examples:
        val = ex.get(key, "unknown")
        counts[val] = counts.get(val, 0) + 1
    return dict(sorted(counts.items(), key=lambda kv: -kv[1]))


# ─── Load ─────────────────────────────────────────────────────────────────────

def load_jsonl(path: Path) -> list[dict]:
    examples = []
    if not path.exists():
        log.warning("File not found: %s — skipping.", path)
        return examples
    with path.open("r", encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                examples.append(json.loads(line))
            except json.JSONDecodeError as exc:
                log.warning("JSON parse error at %s line %d: %s", path.name, lineno, exc)
    return examples


# ─── Process a single split ───────────────────────────────────────────────────

def process_split(
    name: str,
    examples: list[dict],
    seen_hashes: set[str],
) -> tuple[list[dict], dict]:
    """
    Format, tokenise, filter, and deduplicate a split.

    Returns (processed_records, split_stats).
    """
    total_before = len(examples)
    filtered_long = 0
    filtered_dup = 0
    records = []
    token_lengths = []

    for ex in examples:
        prompt = format_prompt(ex)
        est_tokens = estimate_tokens(prompt)

        # ── Length filter ──
        if est_tokens > MAX_TOKENS:
            filtered_long += 1
            log.debug("Filtered (too long, ~%d tokens): %s", est_tokens, ex.get("id"))
            continue

        # ── Deduplication ──
        h = input_hash(ex)
        if h in seen_hashes:
            filtered_dup += 1
            log.debug("Filtered (duplicate): %s", ex.get("id"))
            continue
        seen_hashes.add(h)

        token_lengths.append(est_tokens)
        records.append({
            "text": prompt,
            "metadata": {
                "id": ex.get("id"),
                "split": name,
                "role_category": ex.get("role_category"),
                "experience_level": ex.get("experience_level"),
                "estimated_tokens": est_tokens,
                "overall_match": ex.get("output", {}).get("overall_match"),
                "hallucination_check": ex.get("output", {}).get("hallucination_check"),
            },
        })

    total_after = len(records)
    log.info(
        "[%s] before=%d  filtered_long=%d  filtered_dup=%d  kept=%d",
        name, total_before, filtered_long, filtered_dup, total_after,
    )

    stats = {
        "total_before": total_before,
        "filtered_long_tokens": filtered_long,
        "filtered_duplicates": filtered_dup,
        "total_after": total_after,
        "token_stats": token_stats(token_lengths),
        "role_distribution": distribution(examples, "role_category"),
        "experience_distribution": distribution(examples, "experience_level"),
    }
    return records, stats


# ─── Save processed JSONL ─────────────────────────────────────────────────────

def save_jsonl(records: list[dict], path: Path) -> None:
    with path.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    log.info("Saved %d records → %s", len(records), path)


# ─── Human-readable summary ───────────────────────────────────────────────────

def print_summary(report: dict) -> None:
    sep = "=" * 65
    print(f"\n{sep}")
    print("  ResumeFit AI — Preprocessing Report")
    print(sep)

    overall = report["overall"]
    print(f"  Total examples processed : {overall['total_before']}")
    print(f"  Filtered (long)          : {overall['total_filtered_long']}")
    print(f"  Filtered (duplicates)    : {overall['total_filtered_dup']}")
    print(f"  Kept (all splits)        : {overall['total_after']}")
    print()

    for split_name, s in report["splits"].items():
        ts = s["token_stats"]
        print(f"  [{split_name.upper()}]  before={s['total_before']}  kept={s['total_after']}")
        if ts:
            print(
                f"    tokens — min:{ts['min']}  max:{ts['max']}  "
                f"mean:{ts['mean']}  p50:{ts['p50']}  p75:{ts['p75']}  p90:{ts['p90']}"
            )

    print()
    # Role distribution (train split as representative)
    train_roles = report["splits"].get("train", {}).get("role_distribution", {})
    if train_roles:
        print("  Role distribution (train):")
        for role, cnt in train_roles.items():
            print(f"    {role:<30} {cnt}")

    print()
    exp_dist = report["splits"].get("train", {}).get("experience_distribution", {})
    if exp_dist:
        print("  Experience distribution (train):")
        for lvl, cnt in exp_dist.items():
            print(f"    {lvl:<30} {cnt}")

    print(f"\n  Dataset report saved → {REPORT_PATH}")
    print(sep + "\n")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    log.info("ResumeFit AI — Preprocessing Pipeline starting …")
    log.info("MAX_TOKENS=%d  CHARS_PER_TOKEN=%.1f", MAX_TOKENS, CHARS_PER_TOKEN)

    splits = {
        "train": SPLITS_DIR / "train.jsonl",
        "validation": SPLITS_DIR / "validation.jsonl",
        "test": SPLITS_DIR / "test.jsonl",
    }
    output_files = {
        "train": PROCESSED_DIR / "train_formatted.jsonl",
        "validation": PROCESSED_DIR / "validation_formatted.jsonl",
        "test": PROCESSED_DIR / "test_formatted.jsonl",
    }

    # Shared hash set across all splits to avoid cross-split duplicates
    seen_hashes: set[str] = set()

    report: dict[str, Any] = {"splits": {}}
    total_before = total_after = total_long = total_dup = 0

    for split_name, in_path in splits.items():
        log.info("Processing split: %s  (%s)", split_name, in_path)
        examples = load_jsonl(in_path)
        records, stats = process_split(split_name, examples, seen_hashes)
        save_jsonl(records, output_files[split_name])
        report["splits"][split_name] = stats

        total_before += stats["total_before"]
        total_after += stats["total_after"]
        total_long += stats["filtered_long_tokens"]
        total_dup += stats["filtered_duplicates"]

    report["overall"] = {
        "total_before": total_before,
        "total_filtered_long": total_long,
        "total_filtered_dup": total_dup,
        "total_after": total_after,
        "max_tokens_threshold": MAX_TOKENS,
        "chars_per_token": CHARS_PER_TOKEN,
    }

    # ── Write report ──
    with REPORT_PATH.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    log.info("Dataset report written → %s", REPORT_PATH)

    print_summary(report)


if __name__ == "__main__":
    main()
