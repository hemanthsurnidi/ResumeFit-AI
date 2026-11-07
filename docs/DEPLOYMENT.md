# ResumeFit AI — Deployment & Production Guide

## 1. Local Development Deployment

### Backend Server
```bash
python backend/run.py
```
- Listens on `http://localhost:8000`.
- Automatic Swagger documentation at `http://localhost:8000/docs`.
- SQLite database initializes automatically as `resumefit.db`.

### Frontend Application
```bash
cd frontend
npm install
npm run dev
```
- Available at `http://localhost:5173`.
- Proxies `/api` requests to backend server at `http://localhost:8000`.

---

## 2. Docker & Container Deployment

### Docker Compose
Run both backend and frontend in isolated containers:
```bash
docker-compose up --build
```
- **Backend Service**: Port `8000`.
- **Frontend Service**: Nginx static build on Port `80` (or `3000`).

---

## 3. Production Environment Variables (`.env`)

```ini
APP_NAME=ResumeFit AI
VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false

DATABASE_URL=sqlite:///./resumefit.db
MAX_FILE_SIZE_MB=10

MODEL_PATH=models/adapters/resumefit-qwen2.5-lora
ADAPTER_PATH=models/adapters/resumefit-qwen2.5-lora
USE_FINE_TUNED_MODEL=true
MODEL_MAX_NEW_TOKENS=2048
MODEL_TEMPERATURE=0.1

SECRET_KEY=generate-a-secure-random-key-for-production
```

---

## 4. Hardware Sizing Recommendations

- **CPU Only**: 4+ Cores, 8GB+ RAM (Rule-based engine + lightweight LoRA execution runs in <200ms).
- **GPU (Recommended for Full 1.5B/7B LLM Inference)**:
  - NVIDIA T4 (16GB VRAM) or RTX 3060/4060 (12GB+ VRAM).
  - Use 4-bit NormalFloat (NF4) quantization via BitsAndBytes.
