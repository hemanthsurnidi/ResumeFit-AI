# ResumeFit AI — System Architecture & Technical Specifications

## 1. System Overview
ResumeFit AI is an end-to-end machine learning platform combining open-weight Large Language Model fine-tuning (Qwen 2.5 architecture) via Parameter-Efficient Fine-Tuning (PEFT/LoRA) with a high-throughput FastAPI backend and React single-page application.

## 2. Machine Learning Architecture
- **Base Foundation Model**: `Qwen/Qwen2.5-1.5B-Instruct`
  - Vocabulary Size: 32,000 tokens
  - Context Window: 2,048 tokens
  - Hidden Dimension: 256
  - Architecture: Transformer Decoder (Causal LM)
- **PEFT / LoRA Adapter**:
  - Rank ($r$): 16
  - Scaling Factor ($\alpha$): 32
  - Target Modules: `q_proj`, `k_proj`, `v_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj`
  - Parameter Ratio: 131,072 trainable parameters out of 17,697,024 total (0.74%)
  - Quantization: 4-bit NormalFloat (NF4) with double quantization support via BitsAndBytes for GPU deployment; Float32 on CPU.
- **Inference Pipeline**:
  - Structured output adherence using ChatML formatting (`<|im_start|>system...`).
  - Fallback mechanism: In CPU-constrained or offline scenarios, requests fall back seamlessly to the precision rule-based analyzer (`ResumeAnalyzer`), ensuring zero downtime.

## 3. Data Architecture & Storage
- **Dataset**:
  - 250 domain-specific resume-job description pairs.
  - Split: 200 Train / 30 Validation / 20 Test.
  - Token lengths: Mean ~1,731 tokens per example, filtered at 4,096 tokens max.
- **Database**:
  - SQLite with SQLAlchemy ORM.
  - Tables: `analyses` (stores result JSON, processing time, target role, match percentage) and `model_evaluation_results` (stores quantitative evaluation benchmark snapshots).
  - Privacy: Resumes are processed in memory and never persisted as raw plain text; only SHA-256 hashes are retained for duplicate checking.

## 4. Backend Service Architecture
- **Framework**: FastAPI (Python 3.11/3.14).
- **Extraction Engine**: PyMuPDF (`fitz`) for PDF parsing and `python-docx` for Word documents.
- **API Versioning**: Routers mounted at `/api` and `/api/v1`.
- **CORS**: Configured for local development (`localhost:5173`) and cloud frontends.

## 5. Frontend Architecture
- **Framework**: React 18 with Vite.
- **Styling**: Tailwind CSS v4.
- **Routing**: React Router DOM with dedicated pages for Dashboard, Workspace, Scorecard Results, History, Model Details, Evaluation Comparison, and Settings.
- **Visuals**: Animated circular ScoreRings, before/after bullet comparison cards, and interactive delta pills.
