"""Main FastAPI application for ResumeFit AI."""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

# Ensure backend directory is in sys.path regardless of execution working directory
_backend_dir = Path(__file__).resolve().parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.endpoints import ml_service, router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.database.database import create_tables, dispose_engine

# Setup structured logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle events."""
    logger.info("Initializing %s v%s ...", settings.APP_NAME, settings.VERSION)
    # Initialize SQLite tables
    create_tables()
    logger.info("Database tables verified.")

    # Initialize ML service
    await ml_service.initialize()
    logger.info("ML Service status: %s", ml_service.get_model_status().training_status)

    yield

    logger.info("Shutting down %s ...", settings.APP_NAME)
    dispose_engine()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="End-to-End LLM Fine-Tuning, PEFT/LoRA, Resume Intelligence and Job Alignment Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers - both /api and /api/v1 for compatibility
app.include_router(router, prefix="/api")
app.include_router(router, prefix="/api/v1")

# Mount frontend static distribution if available (allows single-service full-stack deployment on Render)
dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_dir.exists() and (dist_dir / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        """Serve the frontend single-page application root."""
        return FileResponse(str(dist_dir / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not intercept API or documentation routes
        if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        target_file = dist_dir / full_path
        if target_file.is_file():
            return FileResponse(str(target_file))
        return FileResponse(str(dist_dir / "index.html"))
else:
    @app.get("/")
    def root():
        """Root status endpoint."""
        return {
            "app": settings.APP_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs": "/docs",
            "health": "/api/health",
        }


@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return JSON error response."""
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "error": str(exc)},
    )
