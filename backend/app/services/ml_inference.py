"""
ML inference service for ResumeFit AI.

Wraps a Qwen 2.5 (or compatible) language model with optional LoRA adapter.
Gracefully falls back to the rule-based ResumeAnalyzer when no model is
configured or the model fails to load.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from typing import Any, Dict, Optional

from app.core.config import settings
from app.schemas.schemas import AnalysisResult, ModelStatus

logger = logging.getLogger(__name__)


class MLInferenceService:
    """
    Manages LLM loading and inference for resume analysis.

    Lifecycle::

        service = MLInferenceService()
        await service.initialize()           # call during app startup
        result = service.generate_analysis(resume_text, jd_text, role)
    """

    def __init__(self) -> None:
        self._model = None
        self._tokenizer = None
        self._adapter_loaded: bool = False
        self._status: str = "not_configured"
        self._device: str = "cpu"
        self._quantization: Optional[str] = None
        self._model_name: str = "unknown"
        self._load_error: Optional[str] = None

        logger.info(
            "MLInferenceService created. USE_FINE_TUNED_MODEL=%s, "
            "MODEL_PATH=%s, ADAPTER_PATH=%s",
            settings.USE_FINE_TUNED_MODEL,
            settings.MODEL_PATH,
            settings.ADAPTER_PATH,
        )

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def is_model_available(self) -> bool:
        """Return True if the model is loaded and ready for inference."""
        return self._status == "ready" and self._model is not None

    async def initialize(self) -> None:
        """
        Attempt to load the model asynchronously on startup.

        Does NOT raise — any failure sets status to 'unavailable' and
        the service will fall back to rule-based analysis.
        """
        if not settings.MODEL_PATH:
            logger.info(
                "No MODEL_PATH configured — ML inference disabled. "
                "Using rule-based analyser."
            )
            self._status = "not_configured"
            return

        self._status = "loading"
        try:
            self._load_model()
        except Exception as exc:
            self._load_error = str(exc)
            self._status = "error"
            logger.error("Model load failed: %s", exc, exc_info=True)

    def load_model(self) -> None:
        """Synchronous wrapper for model loading (called from initialize)."""
        self._load_model()

    def get_model_status(self) -> ModelStatus:
        """Return current model status as a Pydantic schema."""
        return ModelStatus(
            model_name=self._model_name,
            fine_tuned=settings.USE_FINE_TUNED_MODEL,
            adapter_loaded=self._adapter_loaded,
            training_status=self._status,  # type: ignore[arg-type]
            device=self._device,
            quantization=self._quantization,
            model_path=settings.MODEL_PATH,
            adapter_path=settings.ADAPTER_PATH,
        )

    def generate_analysis(
        self,
        resume_text: str,
        jd_text: str,
        target_role: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run LLM inference to produce a structured analysis.

        Parameters
        ----------
        resume_text, jd_text, target_role:
            Standard analysis inputs.

        Returns
        -------
        dict
            Parsed JSON dict matching the AnalysisResult schema.
            Returns an empty dict on failure (caller should use rule-based fallback).
        """
        if not self.is_model_available():
            logger.debug("Model not available — returning empty dict for rule-based fallback.")
            return {}

        try:
            prompt = self._build_prompt(resume_text, jd_text, target_role)
            raw_output = self._run_inference(prompt)
            parsed = self._parse_json_output(raw_output)
            return parsed
        except Exception as exc:
            logger.error("LLM inference failed: %s", exc, exc_info=True)
            return {}

    # ------------------------------------------------------------------ #
    # Internal: model loading
    # ------------------------------------------------------------------ #

    def _load_model(self) -> None:
        """
        Load tokenizer + model weights + optional LoRA adapter.

        Requires: transformers, torch (optionally bitsandbytes for quantisation).
        """
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer
        except ImportError as exc:
            raise ImportError(
                "transformers and torch are required for ML inference. "
                "Install with: pip install transformers torch"
            ) from exc

        model_path = settings.MODEL_PATH
        logger.info("Loading tokenizer from %s …", model_path)

        self._tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            trust_remote_code=True,
        )

        # Device selection
        if torch.cuda.is_available():
            self._device = "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            self._device = "mps"
        else:
            self._device = "cpu"

        logger.info("Using device: %s", self._device)

        # Try to load with 4-bit quantisation (bitsandbytes) on GPU
        load_kwargs: Dict[str, Any] = {
            "trust_remote_code": True,
            "device_map": "auto" if self._device == "cuda" else None,
        }

        if self._device == "cuda":
            try:
                import bitsandbytes  # noqa: F401
                from transformers import BitsAndBytesConfig

                bnb_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                )
                load_kwargs["quantization_config"] = bnb_config
                self._quantization = "4bit-nf4"
                logger.info("4-bit quantisation enabled.")
            except ImportError:
                logger.info(
                    "bitsandbytes not installed — loading model in full precision."
                )

        logger.info("Loading model weights from %s …", model_path)
        self._model = AutoModelForCausalLM.from_pretrained(model_path, **load_kwargs)

        # Move to device if device_map wasn't used
        if self._device != "cuda" and self._model is not None:
            self._model = self._model.to(self._device)

        self._model_name = os.path.basename(model_path.rstrip("/\\"))

        # ── Load LoRA adapter if configured ──
        if settings.ADAPTER_PATH and os.path.isdir(settings.ADAPTER_PATH):
            logger.info("Loading LoRA adapter from %s …", settings.ADAPTER_PATH)
            try:
                from peft import PeftModel  # type: ignore

                self._model = PeftModel.from_pretrained(
                    self._model,
                    settings.ADAPTER_PATH,
                )
                self._adapter_loaded = True
                self._model_name += " + LoRA"
                logger.info("LoRA adapter loaded successfully.")
            except ImportError:
                logger.warning(
                    "peft library not installed — LoRA adapter not loaded. "
                    "Install with: pip install peft"
                )
            except Exception as exc:
                logger.error("LoRA adapter load failed: %s", exc, exc_info=True)

        self._model.eval()  # type: ignore[union-attr]
        self._status = "ready"
        logger.info("Model ready: %s on %s", self._model_name, self._device)

    # ------------------------------------------------------------------ #
    # Internal: prompt building
    # ------------------------------------------------------------------ #

    def _build_prompt(
        self,
        resume_text: str,
        jd_text: str,
        target_role: Optional[str],
    ) -> str:
        """
        Build the chat-template prompt for Qwen 2.5.

        Returns a formatted string ready for tokenisation.
        """
        role_note = f"Target Role: {target_role}\n\n" if target_role else ""

        system_msg = (
            "You are ResumeFit AI, an expert resume analyser. "
            "Analyse the provided resume against the job description and return "
            "a structured JSON object matching the AnalysisResult schema. "
            "Be precise, ground all observations in the actual resume content, "
            "and avoid hallucinating skills or experiences not present in the resume."
        )

        user_msg = (
            f"{role_note}"
            f"RESUME:\n{resume_text[:3000]}\n\n"
            f"JOB DESCRIPTION:\n{jd_text[:2000]}\n\n"
            "Return ONLY valid JSON matching the AnalysisResult schema. "
            "Do not include any text before or after the JSON object."
        )

        # Qwen 2.5 chat template format
        messages = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ]

        # Use tokenizer's apply_chat_template if available
        if self._tokenizer is not None and hasattr(self._tokenizer, "apply_chat_template"):
            try:
                return self._tokenizer.apply_chat_template(
                    messages,
                    tokenize=False,
                    add_generation_prompt=True,
                )
            except Exception:
                pass

        # Fallback: manual Qwen format
        formatted = "<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{user}<|im_end|>\n<|im_start|>assistant\n"
        return formatted.format(system=system_msg, user=user_msg)

    # ------------------------------------------------------------------ #
    # Internal: inference
    # ------------------------------------------------------------------ #

    def _run_inference(self, prompt: str) -> str:
        """Tokenise prompt, run generation, return decoded output string."""
        import torch

        inputs = self._tokenizer(  # type: ignore[misc]
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=4096,
        ).to(self._device)

        with torch.no_grad():
            output_ids = self._model.generate(  # type: ignore[union-attr]
                **inputs,
                max_new_tokens=settings.MODEL_MAX_NEW_TOKENS,
                temperature=settings.MODEL_TEMPERATURE,
                do_sample=settings.MODEL_TEMPERATURE > 0,
                pad_token_id=self._tokenizer.eos_token_id,  # type: ignore[union-attr]
            )

        # Decode only the newly generated tokens
        input_len = inputs["input_ids"].shape[1]
        new_tokens = output_ids[0][input_len:]
        decoded = self._tokenizer.decode(new_tokens, skip_special_tokens=True)  # type: ignore[union-attr]
        return decoded.strip()

    # ------------------------------------------------------------------ #
    # Internal: JSON parsing
    # ------------------------------------------------------------------ #

    def _parse_json_output(self, raw: str) -> Dict[str, Any]:
        """
        Extract and validate JSON from LLM output.

        Handles common issues:
        - Markdown code fences (```json … ```)
        - Leading/trailing noise
        - Partial JSON (truncation)
        """
        # 1. Strip markdown fences
        cleaned = re.sub(r"```(?:json)?\s*", "", raw, flags=re.I).strip()
        cleaned = re.sub(r"```\s*$", "", cleaned).strip()

        # 2. Find the outermost { ... }
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start == -1 or end == 0:
            logger.warning("No JSON object found in LLM output.")
            return {}

        json_str = cleaned[start:end]

        try:
            parsed = json.loads(json_str)
        except json.JSONDecodeError as exc:
            logger.warning("JSON parse error: %s. Attempting partial recovery …", exc)
            # Attempt to fix truncated JSON by closing open structures
            parsed = self._recover_partial_json(json_str)

        if not isinstance(parsed, dict):
            logger.warning("LLM output parsed but is not a dict: %s", type(parsed))
            return {}

        # 3. Light validation — ensure at least the core score field is present
        if "overall_match_percentage" not in parsed:
            logger.warning(
                "LLM JSON missing 'overall_match_percentage'. "
                "Will merge with rule-based output."
            )

        return parsed

    @staticmethod
    def _recover_partial_json(json_str: str) -> Dict[str, Any]:
        """Best-effort recovery for truncated JSON strings."""
        # Try progressively shorter substrings
        for end in range(len(json_str), 0, -1):
            candidate = json_str[:end]
            # Pad with closing brackets/braces to fix truncation
            open_braces = candidate.count("{") - candidate.count("}")
            open_brackets = candidate.count("[") - candidate.count("]")
            candidate += "]" * max(0, open_brackets) + "}" * max(0, open_braces)
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                continue
        return {}


# ─────────────────────────── Singleton ──────────────────────────────────── #

# Global instance initialised during app startup
_ml_service: Optional[MLInferenceService] = None


def get_ml_service() -> MLInferenceService:
    """Return (and lazily create) the singleton MLInferenceService."""
    global _ml_service
    if _ml_service is None:
        _ml_service = MLInferenceService()
    return _ml_service
