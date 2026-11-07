"""
Logging configuration for ResumeFit AI.

Sets up:
- Console handler (human-readable)
- File handler with JSON structured output  (logs/app.log)
- Per-module log levels
"""

from __future__ import annotations

import json
import logging
import logging.handlers
import os
import traceback
from datetime import datetime, timezone
from typing import Any, Dict


# ─────────────────────────── JSON Formatter ─────────────────────────────── #

class JsonFormatter(logging.Formatter):
    """Emit log records as single-line JSON objects."""

    RESERVED_ATTRS = {
        "args", "asctime", "created", "exc_info", "exc_text", "filename",
        "funcName", "id", "levelname", "levelno", "lineno", "message",
        "module", "msecs", "msg", "name", "pathname", "process",
        "processName", "relativeCreated", "stack_info", "thread", "threadName",
    }

    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        log_dict: Dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }

        # Attach exception info when present
        if record.exc_info:
            log_dict["exception"] = self.formatException(record.exc_info)

        if record.stack_info:
            log_dict["stack_info"] = self.formatStack(record.stack_info)

        # Attach any extra fields supplied by the caller
        for key, value in record.__dict__.items():
            if key not in self.RESERVED_ATTRS and not key.startswith("_"):
                log_dict[key] = value

        return json.dumps(log_dict, default=str, ensure_ascii=False)


# ─────────────────────────── Console Formatter ──────────────────────────── #

class ConsoleFormatter(logging.Formatter):
    """Coloured, human-readable console output."""

    COLOURS: Dict[str, str] = {
        "DEBUG":    "\033[36m",   # Cyan
        "INFO":     "\033[32m",   # Green
        "WARNING":  "\033[33m",   # Yellow
        "ERROR":    "\033[31m",   # Red
        "CRITICAL": "\033[35m",   # Magenta
    }
    RESET = "\033[0m"

    FMT = "[{asctime}] {colour}{levelname:<8}{reset} {name} - {message}"

    def format(self, record: logging.LogRecord) -> str:  # noqa: A003
        colour = self.COLOURS.get(record.levelname, "")
        fmt = self.FMT.format(
            asctime="{asctime}",
            colour=colour,
            levelname=record.levelname,
            reset=self.RESET,
            name=record.name,
            message="{message}",
        )
        formatter = logging.Formatter(fmt, datefmt="%Y-%m-%d %H:%M:%S", style="{")
        return formatter.format(record)


# ─────────────────────────── Setup Function ─────────────────────────────── #

def setup_logging(log_level: str = "INFO", log_dir: str = "logs") -> None:
    """
    Configure application-wide logging.

    Parameters
    ----------
    log_level:
        Root log level string (DEBUG / INFO / WARNING / ERROR).
    log_dir:
        Directory where ``app.log`` will be written.
    """
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "app.log")

    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # ── Root logger ──
    root = logging.getLogger()
    root.setLevel(logging.DEBUG)  # capture everything; handlers filter

    # Remove any pre-existing handlers (avoid duplicates on hot-reload)
    root.handlers.clear()

    # ── Console handler ──
    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(ConsoleFormatter())
    root.addHandler(console_handler)

    # ── Rotating JSON file handler ──
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)  # always capture debug to file
    file_handler.setFormatter(JsonFormatter())
    root.addHandler(file_handler)

    # ── Per-module overrides ──
    module_levels: Dict[str, int] = {
        "app.api":                  logging.INFO,
        "app.services.ml_inference": logging.DEBUG,
        "app.services.resume_analyzer": logging.DEBUG,
        "app.database":             logging.WARNING,
        "sqlalchemy.engine":        logging.WARNING,
        "uvicorn":                  logging.INFO,
        "uvicorn.access":           logging.WARNING,
        "httpx":                    logging.WARNING,
        "multipart":                logging.WARNING,
    }
    for name, level in module_levels.items():
        logging.getLogger(name).setLevel(level)

    logging.getLogger("app").info(
        "Logging initialised",
        extra={"log_level": log_level, "log_file": log_file},
    )
