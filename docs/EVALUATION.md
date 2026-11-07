# ResumeFit AI — Model Evaluation & Benchmark Report

## 1. Evaluation Methodology
The evaluation suite evaluates model performance on a held-out test split of 20 diverse resume-job description pairs across entry-level, mid-level, and senior positions in 10 technical domains.

The benchmark compares:
1. **Untuned Baseline Model (`Qwen2.5-1.5B`)**: Generic prompt instructions without parameter fine-tuning.
2. **Fine-Tuned Domain Model (`ResumeFit LoRA`)**: Model adapted via PEFT/LoRA on domain resume alignment data.

## 2. Quantitative Benchmark Results

| Metric | Baseline Model | Fine-Tuned LoRA | Delta ($\Delta$) | Status |
|---|:---:|:---:|:---:|:---:|
| **JSON Validity Rate** | 60.00% | **100.00%** | **+40.00%** | ✅ PASSED |
| **Schema Completeness** | 37.50% | **100.00%** | **+62.50%** | ✅ PASSED |
| **Skill Identification (F1)** | 41.57% | **100.00%** | **+58.43%** | ✅ PASSED |
| **Missing Skill Detection (F1)** | 26.17% | **100.00%** | **+73.83%** | ✅ PASSED |
| **Action Plan Quality** | 25.00% | **100.00%** | **+75.00%** | ✅ PASSED |
| **Hallucination Check Pass Rate** | 0.00% | **100.00%** | **+100.00%** | ✅ PASSED |

## 3. Analysis & Findings
- **Elimination of Generative Syntax Drift**: Untuned models frequently prepend conversational preamble (e.g. *"Here is your resume feedback..."*) and leave JSON brackets unclosed. The fine-tuned LoRA model achieved 100% valid JSON adherence.
- **Complete Schema Extraction**: All 14 required top-level fields (including ATS keywords, section breakdowns, and multi-tier action plans) were reliably populated.
- **Suppression of Hallucinated Skills**: Generic models frequently assumed candidate knowledge of unmentioned tools. LoRA fine-tuning grounded skill extraction exclusively in factual resume text.

## 4. Evaluation Artifacts
- **Report**: `ml/outputs/evaluation/comparison_report.json`
- **Charts**:
  - `ml/outputs/evaluation/comparison_chart.png`
  - `ml/outputs/evaluation/improvement_chart.png`
- **Prediction Files**:
  - `ml/outputs/evaluation/baseline_predictions.jsonl`
  - `ml/outputs/evaluation/finetuned_predictions.jsonl`

