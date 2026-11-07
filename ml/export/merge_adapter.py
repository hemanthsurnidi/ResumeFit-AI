"""
ResumeFit AI: Adapter Merging and Standalone Model Export
Combines the fine-tuned LoRA adapter weights with the base Qwen model
to create a merged, standalone Hugging Face model for production inference.
"""

import os
import argparse
import logging
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def merge_and_export(base_model_path: str, adapter_path: str, output_path: str, device: str = "cpu"):
    """
    Merge LoRA weights into base model and save as full standalone model.
    """
    logger.info("Loading base tokenizer and model from: %s", base_model_path)
    tokenizer = AutoTokenizer.from_pretrained(base_model_path, trust_remote_code=True)
    
    logger.info("Loading base model on %s...", device)
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_path,
        torch_dtype=torch.float16 if device != "cpu" else torch.float32,
        device_map=device if device != "cpu" else None,
        trust_remote_code=True
    )
    
    logger.info("Loading LoRA adapter from: %s", adapter_path)
    model = PeftModel.from_pretrained(base_model, adapter_path)
    
    logger.info("Merging LoRA adapter weights into base model (merge_and_unload)...")
    merged_model = model.merge_and_unload()
    
    logger.info("Saving standalone merged model to: %s", output_path)
    os.makedirs(output_path, exist_ok=True)
    merged_model.save_pretrained(output_path, safe_serialization=True)
    tokenizer.save_pretrained(output_path)
    
    logger.info("Merged model saved successfully!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge LoRA adapter into base model")
    parser.add_argument("--base_model", type=str, default="Qwen/Qwen2.5-1.5B-Instruct")
    parser.add_argument("--adapter_path", type=str, default="models/adapters/resumefit-qwen2.5-lora")
    parser.add_argument("--output_path", type=str, default="models/merged/resumefit-qwen2.5-merged")
    args = parser.parse_args()
    
    merge_and_export(args.base_model, args.adapter_path, args.output_path)

