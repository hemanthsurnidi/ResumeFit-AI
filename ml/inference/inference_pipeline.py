"""
ResumeFit AI — Production Inference Pipeline
=============================================
Loads Qwen2.5-1.5B-Instruct (optionally with a LoRA adapter) and
runs structured resume analysis.

Usage (Python API):
    from ml.inference.inference_pipeline import ResumeFitInference

    pipe = ResumeFitInference(adapter_path="models/adapters/resumefit-qwen2.5-lora")
    result = pipe.generate(resume_text="...", job_description="...", target_role="...")
    print(result)

Usage (CLI):
    python ml/inference/inference_pipeline.py \\
        --resume path/to/resume.txt \\
        --jd path/to/jd.txt \\
        --role "Software Engineer" \\
        --adapter models/adapters/resumefit-qwen2.5-lora
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from pathlib import Path
from typing import Optional

log = logging.getLogger("inference")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)

# ─── Schema skeleton (fallback) ───────────────────────────────────────────────
EMPTY_SKELETON: dict = {
    "overall_match": 0,
    "technical_skill_match": 0,
    "experience_match": 0,
    "keyword_coverage": 0,
    "matching_skills": [],
    "missing_skills": [],
    "partial_matches": [],
    "transferable_skills": [],
    "summary_recommendation": "Unable to generate analysis.",
    "bullet_improvements": [],
    "skills_to_add_to_resume": [],
    "ats_keywords": [],
    "ats_issues": [],
    "section_analysis": {
        "professional_summary": "",
        "technical_skills": "",
        "experience": "",
        "projects": "",
        "education": "",
    },
    "action_plan": [],
    "hallucination_check": "UNKNOWN",
    "data_quality_notes": "Parsing failed — empty skeleton returned.",
}

SYSTEM_PROMPT = (
    "You are ResumeFit AI, an expert resume coach and career strategist. "
    "You analyse resumes against job descriptions and provide detailed, "
    "actionable recommendations. Your output is always a valid JSON object "
    "that follows the specified schema exactly — never add prose outside the JSON."
)


# ─── Inference class ──────────────────────────────────────────────────────────

class ResumeFitInference:
    """
    Production inference pipeline for ResumeFit AI.

    Parameters
    ----------
    base_model : str
        HuggingFace model ID or local path of the base model.
    adapter_path : str | Path | None
        Path to LoRA adapter directory. Pass None to run the base model only.
    max_new_tokens : int
        Maximum number of new tokens to generate.
    use_4bit : bool
        Load the base model in 4-bit quantization (requires bitsandbytes + GPU).
    device : str
        Device override ("auto", "cuda", "cpu"). Defaults to "auto".
    """

    def __init__(
        self,
        base_model: str = "Qwen/Qwen2.5-1.5B-Instruct",
        adapter_path: Optional[str | Path] = None,
        max_new_tokens: int = 1024,
        use_4bit: bool = True,
        device: str = "auto",
    ) -> None:
        self.base_model    = base_model
        self.adapter_path  = Path(adapter_path) if adapter_path else None
        self.max_new_tokens = max_new_tokens
        self.use_4bit      = use_4bit
        self.device        = device

        self.tokenizer = None
        self.model     = None
        self._loaded   = False

    # ── Lazy load ─────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Load tokenizer and model. Called lazily on first generate()."""
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
        except ImportError as exc:
            raise ImportError(
                "transformers and torch are required. "
                "Install with: pip install transformers torch"
            ) from exc

        log.info("Loading tokenizer: %s", self.base_model)
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.base_model,
            trust_remote_code=True,
        )
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        self.tokenizer.padding_side = "right"

        # Quantization config
        quant_config = None
        if self.use_4bit and torch.cuda.is_available():
            try:
                from transformers import BitsAndBytesConfig
                quant_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                )
                log.info("4-bit quantization enabled (nf4).")
            except Exception as e:
                log.warning("4-bit quantization unavailable: %s — falling back to float16.", e)

        log.info("Loading base model: %s", self.base_model)
        t0 = time.time()
        self.model = AutoModelForCausalLM.from_pretrained(
            self.base_model,
            quantization_config=quant_config,
            torch_dtype=torch.float16 if quant_config is None else None,
            device_map=self.device,
            trust_remote_code=True,
        )
        log.info("Base model loaded in %.1fs (%.1fM params)", time.time() - t0, self.model.num_parameters() / 1e6)

        # Attach LoRA adapter
        if self.adapter_path and self.adapter_path.exists():
            try:
                from peft import PeftModel
                log.info("Loading LoRA adapter: %s", self.adapter_path)
                self.model = PeftModel.from_pretrained(self.model, str(self.adapter_path))
                self.model = self.model.merge_and_unload()
                log.info("LoRA adapter merged and unloaded.")
            except ImportError:
                log.warning("peft not installed — running base model without adapter.")
            except Exception as exc:
                log.error("Failed to load adapter: %s — running base model.", exc)
        elif self.adapter_path:
            log.warning("Adapter path not found: %s — running base model.", self.adapter_path)

        self.model.eval()
        self._loaded = True

    # ── Prompt formatting ─────────────────────────────────────────────────────

    def _build_prompt(
        self,
        resume_text: str,
        job_description: str,
        target_role: str,
    ) -> str:
        user_msg = (
            "Analyze this resume against the job description and provide detailed recommendations.\n\n"
            f"## RESUME:\n{resume_text.strip()}\n\n"
            f"## JOB DESCRIPTION:\n{job_description.strip()}\n\n"
            f"## TARGET ROLE:\n{target_role.strip()}\n\n"
            "Respond with a valid JSON object following the specified schema exactly."
        )
        messages = [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_msg},
        ]
        # Use Qwen2.5 chat template if available
        try:
            prompt = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
        except Exception:
            # Manual fallback
            prompt = (
                f"<|im_start|>system\n{SYSTEM_PROMPT}<|im_end|>\n"
                f"<|im_start|>user\n{user_msg}<|im_end|>\n"
                "<|im_start|>assistant\n"
            )
        return prompt

    # ── JSON extraction with error recovery ───────────────────────────────────

    def _extract_json(self, text: str) -> dict:
        """
        Attempt to parse JSON from model output.
        Strategy:
          1. Direct json.loads()
          2. Extract largest {...} block via regex
          3. Return empty skeleton on failure
        """
        # Strip common preamble
        text = text.strip()
        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to find a JSON object via regex (greedy, outermost braces)
        matches = re.findall(r"\{[\s\S]*\}", text)
        if matches:
            # Try longest match first
            for candidate in sorted(matches, key=len, reverse=True):
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    continue

        log.warning("JSON extraction failed — returning empty skeleton.")
        return EMPTY_SKELETON.copy()

    # ── Generation ────────────────────────────────────────────────────────────

    def generate(
        self,
        resume_text: str,
        job_description: str,
        target_role: str,
        greedy: bool = True,
    ) -> dict:
        """
        Run inference for one resume/JD pair.

        Parameters
        ----------
        resume_text : str
            Full resume content (plain text or Markdown).
        job_description : str
            Full job description text.
        target_role : str
            Target job title (e.g., "Software Engineer").
        greedy : bool
            True = greedy decoding; False = beam search (num_beams=4).

        Returns
        -------
        dict
            Parsed ResumeFit output schema.
        """
        if not self._loaded:
            self.load()

        import torch

        prompt = self._build_prompt(resume_text, job_description, target_role)

        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=3072,
        ).to(self.model.device)

        generate_kwargs = dict(
            **inputs,
            max_new_tokens=self.max_new_tokens,
            pad_token_id=self.tokenizer.eos_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )
        if greedy:
            generate_kwargs["do_sample"] = False
        else:
            generate_kwargs["num_beams"] = 4
            generate_kwargs["do_sample"] = False

        t0 = time.time()
        with torch.no_grad():
            output_ids = self.model.generate(**generate_kwargs)
        elapsed = time.time() - t0

        # Decode only newly generated tokens
        new_ids = output_ids[0][inputs["input_ids"].shape[1]:]
        raw_output = self.tokenizer.decode(new_ids, skip_special_tokens=True)

        log.info(
            "Generated %d new tokens in %.2fs (%.1f tok/s)",
            len(new_ids),
            elapsed,
            len(new_ids) / max(elapsed, 1e-6),
        )

        return self._extract_json(raw_output)

    # ── Batch generation ──────────────────────────────────────────────────────

    def generate_batch(
        self,
        examples: list[dict],
        greedy: bool = True,
    ) -> list[dict]:
        """
        Run inference on a list of dicts with keys:
          - resume_text
          - job_description
          - target_role

        Returns list of output dicts.
        """
        results = []
        for i, ex in enumerate(examples):
            log.info("Processing example %d / %d …", i + 1, len(examples))
            out = self.generate(
                resume_text=ex["resume_text"],
                job_description=ex["job_description"],
                target_role=ex.get("target_role", ""),
                greedy=greedy,
            )
            results.append(out)
        return results


# ─── CLI ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="ResumeFit AI Inference Pipeline")
    parser.add_argument("--resume",  required=True, help="Path to resume text file")
    parser.add_argument("--jd",      required=True, help="Path to job description text file")
    parser.add_argument("--role",    required=True, help="Target role (e.g. 'Software Engineer')")
    parser.add_argument("--adapter", default=None,  help="Path to LoRA adapter directory")
    parser.add_argument("--base_model", default="Qwen/Qwen2.5-1.5B-Instruct")
    parser.add_argument("--no_4bit", action="store_true", help="Disable 4-bit quantization")
    parser.add_argument("--beam_search", action="store_true", help="Use beam search (slower, possibly better)")
    parser.add_argument("--output", default=None, help="Save output JSON to this path")
    args = parser.parse_args()

    resume_text     = Path(args.resume).read_text(encoding="utf-8")
    job_description = Path(args.jd).read_text(encoding="utf-8")

    pipe = ResumeFitInference(
        base_model=args.base_model,
        adapter_path=args.adapter,
        use_4bit=not args.no_4bit,
    )

    result = pipe.generate(
        resume_text=resume_text,
        job_description=job_description,
        target_role=args.role,
        greedy=not args.beam_search,
    )

    out_str = json.dumps(result, indent=2, ensure_ascii=False)
    print("\n" + "=" * 60)
    print("ResumeFit AI — Output")
    print("=" * 60)
    print(out_str)

    if args.output:
        Path(args.output).write_text(out_str, encoding="utf-8")
        log.info("Output saved → %s", args.output)


if __name__ == "__main__":
    main()
