"""Main FastAPI application for ResumeFit AI."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
