"""
ResumeFit AI — ML Pipeline Test Suite
======================================
Tests dataset engineering, preprocessing, PEFT LoRA training outputs,
and evaluation metrics.
"""

import json
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parent.parent


def test_dataset_splits_exist():
    """Verify train, validation, and test splits were generated."""
    splits_dir = ROOT / "ml" / "dataset" / "splits"
    assert (splits_dir / "train.jsonl").exists(), "train.jsonl missing"
    assert (splits_dir / "validation.jsonl").exists(), "validation.jsonl missing"
    assert (splits_dir / "test.jsonl").exists(), "test.jsonl missing"


def test_dataset_splits_record_counts():
    """Verify split counts match expected distribution (200 train, 30 val, 20 test)."""
    splits_dir = ROOT / "ml" / "dataset" / "splits"
    with open(splits_dir / "train.jsonl", encoding="utf-8") as f:
        train_count = sum(1 for line in f if line.strip())
    with open(splits_dir / "validation.jsonl", encoding="utf-8") as f:
        val_count = sum(1 for line in f if line.strip())
    with open(splits_dir / "test.jsonl", encoding="utf-8") as f:
        test_count = sum(1 for line in f if line.strip())

    assert train_count == 200, f"Expected 200 train examples, got {train_count}"
    assert val_count == 30, f"Expected 30 validation examples, got {val_count}"
    assert test_count == 20, f"Expected 20 test examples, got {test_count}"


def test_processed_chat_templates():
    """Verify preprocessed chat-formatted datasets exist."""
    proc_dir = ROOT / "ml" / "dataset" / "processed"
    assert (proc_dir / "train_formatted.jsonl").exists(), "train_formatted.jsonl missing"
    with open(proc_dir / "train_formatted.jsonl", encoding="utf-8") as f:
        first_line = json.loads(f.readline())
        text_content = first_line.get("text") or first_line.get("prompt", "")
        assert text_content, "Missing chat-template text content"
        assert "<|im_start|>system" in text_content
        assert "<|im_start|>user" in text_content
        assert "<|im_start|>assistant" in text_content


def test_lora_adapter_artifacts_exist():
    """Verify PEFT LoRA adapter was trained and exported with proper artifacts."""
    adapter_dir = ROOT / "models" / "adapters" / "resumefit-qwen2.5-lora"
    assert (adapter_dir / "adapter_config.json").exists(), "adapter_config.json missing"
    assert (adapter_dir / "adapter_model.safetensors").exists(), "adapter_model.safetensors missing"
    assert (adapter_dir / "trainer_state.json").exists(), "trainer_state.json missing"
    assert (adapter_dir / "training_summary.json").exists(), "training_summary.json missing"


def test_adapter_config_hyperparameters():
    """Verify LoRA hyperparameters in adapter_config.json."""
    adapter_dir = ROOT / "models" / "adapters" / "resumefit-qwen2.5-lora"
    with open(adapter_dir / "adapter_config.json", encoding="utf-8") as f:
        config = json.load(f)

    assert config.get("peft_type") == "LORA"
    assert config.get("r") == 16
    assert config.get("lora_alpha") == 32
    assert "q_proj" in config.get("target_modules", [])
    assert "v_proj" in config.get("target_modules", [])


def test_training_loss_reduction():
    """Verify training loss decreased during fine-tuning."""
    adapter_dir = ROOT / "models" / "adapters" / "resumefit-qwen2.5-lora"
    with open(adapter_dir / "training_summary.json", encoding="utf-8") as f:
        summary = json.load(f)

    assert summary.get("status") == "COMPLETED"
    assert summary.get("initial_loss") > summary.get("final_loss"), "Loss did not decrease"
    assert summary.get("loss_reduction_pct") > 50.0, "Expected significant loss reduction"


def test_evaluation_comparison_report():
    """Verify evaluation comparison report shows superior performance for fine-tuned model."""
    eval_dir = ROOT / "ml" / "outputs" / "evaluation"
    report_file = eval_dir / "comparison_report.json"
    assert report_file.exists(), "comparison_report.json missing"

    with open(report_file, encoding="utf-8") as f:
        report = json.load(f)

    base = report["baseline"]
    ft = report["finetuned"]

    assert ft["json_validity_rate"] >= base["json_validity_rate"]
    assert ft["schema_completeness"] > base["schema_completeness"]
    assert ft["skill_identification"] > base["skill_identification"]
    assert ft["hallucination_flag_pass"] > base["hallucination_flag_pass"]
