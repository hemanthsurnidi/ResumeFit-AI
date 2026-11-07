"""
Document text extraction utilities for ResumeFit AI.

Supports:
- PDF  (via PyMuPDF / fitz)
- DOCX (via python-docx)

Entry point: ``extract_text(file_bytes, filename) -> dict``
"""

from __future__ import annotations

import io
import logging
import os
import re
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)


# ─────────────────────────── PDF Extraction ─────────────────────────────── #

def extract_text_from_pdf(file_bytes: bytes) -> dict:
    """
    Extract text from a PDF file using PyMuPDF (fitz).

    Parameters
    ----------
    file_bytes:
        Raw bytes of the PDF.

    Returns
    -------
    dict with keys: text, pages, word_count, extraction_method, warnings
    """
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise ImportError(
            "PyMuPDF is required for PDF extraction. "
            "Install it with: pip install pymupdf"
        ) from exc

    warnings: List[str] = []
    all_text_parts: List[str] = []
    page_count = 0

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page_count = doc.page_count

        for page_num in range(page_count):
            page = doc[page_num]
            page_text = page.get_text("text")  # type: ignore[arg-type]
            all_text_parts.append(page_text)

        doc.close()
    except Exception as exc:
        logger.error("PDF extraction failed: %s", exc)
        raise ValueError(f"Failed to extract text from PDF: {exc}") from exc

    raw_text = "\n".join(all_text_parts)

    # ── Scanned-document heuristic ──
    total_chars = len(raw_text.strip())
    chars_per_page = total_chars / max(page_count, 1)
    if chars_per_page < 100:
        warnings.append(
            "This PDF appears to be a scanned image with little selectable text. "
            "OCR is not currently supported — text extraction may be incomplete."
        )
        logger.warning("Low text density in PDF (%d chars/page). Possibly scanned.", chars_per_page)

    cleaned = _clean_text(raw_text)
    word_count = len(cleaned.split())

    return {
        "text": cleaned,
        "pages": page_count,
        "word_count": word_count,
        "extraction_method": "pymupdf",
        "warnings": warnings,
    }


# ─────────────────────────── DOCX Extraction ────────────────────────────── #

def extract_text_from_docx(file_bytes: bytes) -> dict:
    """
    Extract text from a DOCX file using python-docx.

    Extracts: paragraphs, table cells, and styled headings.

    Parameters
    ----------
    file_bytes:
        Raw bytes of the DOCX.

    Returns
    -------
    dict with keys: text, pages, word_count, extraction_method, warnings
    """
    try:
        from docx import Document  # python-docx
    except ImportError as exc:
        raise ImportError(
            "python-docx is required for DOCX extraction. "
            "Install it with: pip install python-docx"
        ) from exc

    warnings: List[str] = []

    try:
        doc = Document(io.BytesIO(file_bytes))
    except Exception as exc:
        logger.error("DOCX extraction failed: %s", exc)
        raise ValueError(f"Failed to open DOCX file: {exc}") from exc

    parts: List[str] = []

    # ── Body paragraphs (preserving heading structure) ──
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        style_name = (para.style.name or "").lower()
        if "heading" in style_name:
            # Add blank lines around headings for readability
            parts.append(f"\n{text.upper()}\n")
        else:
            parts.append(text)

    # ── Table content ──
    for table in doc.tables:
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_cells:
                parts.append(" | ".join(row_cells))

    # ── Headers / Footers (from first section) ──
    try:
        for section in doc.sections:
            if section.header:
                for para in section.header.paragraphs:
                    if para.text.strip():
                        parts.insert(0, para.text.strip())
            break  # Only first section header needed
    except Exception:
        pass  # Headers are optional

    raw_text = "\n".join(parts)
    cleaned = _clean_text(raw_text)
    word_count = len(cleaned.split())

    if word_count < 20:
        warnings.append(
            "Very little text was extracted from this DOCX. "
            "The document may rely on text boxes or images not supported by this extractor."
        )

    return {
        "text": cleaned,
        "pages": _estimate_docx_pages(word_count),
        "word_count": word_count,
        "extraction_method": "python-docx",
        "warnings": warnings,
    }


# ─────────────────────────── Main Entry Point ───────────────────────────── #

def extract_text(file_bytes: bytes, filename: str) -> dict:
    """
    Extract text from a supported document file.

    Parameters
    ----------
    file_bytes:
        Raw bytes of the uploaded file.
    filename:
        Original filename (used to determine file type).

    Returns
    -------
    dict::

        {
            "text": str,
            "pages": int,
            "word_count": int,
            "extraction_method": str,
            "warnings": list[str],
        }

    Raises
    ------
    ValueError
        If the extension is unsupported or extraction yields no content.
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        result = extract_text_from_pdf(file_bytes)
    elif ext == ".docx":
        result = extract_text_from_docx(file_bytes)
    else:
        raise ValueError(
            f"Unsupported file type: '{ext}'. Only .pdf and .docx are accepted."
        )

    # ── Non-empty guard ──
    if not result["text"] or result["word_count"] < 10:
        raise ValueError(
            "No readable text could be extracted from the document. "
            "Please ensure the file is not empty or entirely image-based."
        )

    logger.info(
        "Text extraction complete",
        extra={
            "doc_filename": filename,
            "pages": result["pages"],
            "word_count": result["word_count"],
            "method": result["extraction_method"],
            "warnings": len(result["warnings"]),
        },
    )

    return result


# ─────────────────────────── Helpers ────────────────────────────────────── #

def _clean_text(text: str) -> str:
    """Normalise whitespace and remove control characters from extracted text."""
    # Replace Windows-style line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Remove null bytes and other non-printable control chars (keep \n \t)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Collapse 3+ consecutive blank lines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip leading/trailing whitespace per line, then overall
    lines = [line.rstrip() for line in text.split("\n")]
    text = "\n".join(lines).strip()
    return text


def _estimate_docx_pages(word_count: int) -> int:
    """Rough page estimate based on average 300 words per page."""
    return max(1, round(word_count / 300))
