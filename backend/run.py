"""Entry point for the ResumeFit AI backend server."""
import sys
from pathlib import Path
import uvicorn

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
