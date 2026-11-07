"""
Security utilities for ResumeFit AI.

Provides:
- SHA-256 hash computation
- File extension validation
- File size validation
- Secure temp-file context manager
"""

from __future__ import annotations

import hashlib
import logging
import os
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, List

logger = logging.getLogger(__name__)


# ─────────────────────────── Hash Utilities ─────────────────────────────── #

def compute_sha256(data: bytes) -> str:
    """Return the hex-encoded SHA-256 digest of *data*."""
    return hashlib.sha256(data).hexdigest()


def compute_text_hash(text: str) -> str:
    """Return the SHA-256 of UTF-8 encoded *text*."""
    return compute_sha256(text.encode("utf-8"))


# ─────────────────────────── File Validation ────────────────────────────── #

class FileValidationError(ValueError):
    """Raised when an uploaded file fails validation."""


def validate_file_extension(filename: str, allowed: List[str]) -> str:
    """
    Return the lower-cased file extension or raise FileValidationError.

    Parameters
    ----------
    filename:
        Original filename from the upload.
    allowed:
        List of permitted extensions, e.g. [".pdf", ".docx"].
    """
    ext = Path(filename).suffix.lower()
    if ext not in [a.lower() for a in allowed]:
        raise FileValidationError(
            f"File type '{ext}' is not allowed. "
            f"Accepted types: {', '.join(allowed)}"
        )
    return ext


def validate_file_size(size_bytes: int, max_bytes: int) -> None:
    """
    Raise FileValidationError if *size_bytes* exceeds *max_bytes*.

    Parameters
    ----------
    size_bytes:
        Actual byte count of the file.
    max_bytes:
        Maximum allowed byte count.
    """
    if size_bytes > max_bytes:
        max_mb = max_bytes / (1024 * 1024)
        actual_mb = size_bytes / (1024 * 1024)
        raise FileValidationError(
            f"File size {actual_mb:.1f} MB exceeds the maximum allowed size of "
            f"{max_mb:.0f} MB."
        )


def validate_upload(filename: str, file_bytes: bytes, allowed_extensions: List[str], max_bytes: int) -> str:
    """
    Validate both extension and size; return the lower-cased extension.

    Raises FileValidationError on failure.
    """
    ext = validate_file_extension(filename, allowed_extensions)
    validate_file_size(len(file_bytes), max_bytes)
    logger.debug(
        "File validation passed",
        extra={"doc_filename": filename, "size_bytes": len(file_bytes), "ext": ext},
    )
    return ext


# ─────────────────────────── Temp-file Helper ───────────────────────────── #

@contextmanager
def secure_temp_file(
    suffix: str = "",
    prefix: str = "resumefit_",
    content: bytes | None = None,
) -> Generator[str, None, None]:
    """
    Context manager that creates a secure temporary file and deletes it on exit.

    Parameters
    ----------
    suffix:
        File suffix / extension.
    prefix:
        File name prefix.
    content:
        Optional bytes to write immediately after creation.

    Yields
    ------
    str
        Absolute path to the temporary file.
    """
    fd, path = tempfile.mkstemp(suffix=suffix, prefix=prefix)
    try:
        if content is not None:
            with os.fdopen(fd, "wb") as fh:
                fh.write(content)
        else:
            os.close(fd)
        yield path
    finally:
        try:
            os.unlink(path)
        except OSError:
            logger.warning("Could not delete temp file: %s", path)
