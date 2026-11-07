"""
PDF Report Generator for ResumeFit AI.
Uses ReportLab to generate a clean, executive-level resume alignment scorecard.
"""

from __future__ import annotations

import io
from datetime import datetime
from typing import Any, Dict

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_analysis_pdf(analysis_data: Dict[str, Any]) -> io.BytesIO:
    """
    Generate a downloadable PDF scorecard from analysis data.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e3a8a"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=15,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )
    bullet_style = ParagraphStyle(
        "BulletText",
        parent=body_style,
        leftIndent=15,
        spaceAfter=4,
    )

    story = []

    # Header
    story.append(Paragraph("ResumeFit AI — Resume Alignment Scorecard", title_style))
    created_at = analysis_data.get("created_at", datetime.now().isoformat())
    target_role = analysis_data.get("analysis", {}).get("target_role_detected") or "Software Professional"
    model_used = analysis_data.get("model_used", "Qwen 2.5 LoRA")
    story.append(
        Paragraph(
            f"Generated on {created_at[:10]} | Target Role: {target_role} | Model: {model_used}",
            subtitle_style,
        )
    )
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=15))

    analysis = analysis_data.get("analysis", {})

    # Score Summary Table
    overall = analysis.get("overall_match_percentage", 0)
    skills_score = analysis.get("skill_match_score", 0)
    exp_score = analysis.get("experience_match_score", 0)
    kw_score = analysis.get("keyword_coverage_score", 0)

    score_data = [
        ["Overall Alignment", "Technical Skills", "Experience Match", "Keyword Coverage"],
        [f"{int(overall)}%", f"{int(skills_score)}%", f"{int(exp_score)}%", f"{int(kw_score)}%"],
    ]
    t = Table(score_data, colWidths=[130, 130, 130, 130])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#475569")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TEXTCOLOR", (0, 1), (-1, 1), colors.HexColor("#1e3a8a")),
                ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 1), (-1, 1), 16),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ]
        )
    )
    story.append(t)
    story.append(Spacer(1, 15))

    # Executive Summary Recommendation
    story.append(Paragraph("Executive Summary & Recommendation", section_heading))
    summary_text = analysis.get("summary_recommendation", "Analysis completed.")
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 10))

    # Skill Breakdown
    matched = ", ".join(analysis.get("matched_skills", [])) or "None identified"
    missing = ", ".join(analysis.get("missing_skills", [])) or "None identified"

    skill_table_data = [
        [Paragraph("<b>Verified Matched Skills:</b>", body_style), Paragraph(matched, body_style)],
        [Paragraph("<b>Missing Required Skills:</b>", body_style), Paragraph(missing, body_style)],
    ]
    st = Table(skill_table_data, colWidths=[150, 370])
    st.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0fdf4")),
                ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#fef2f2")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(st)
    story.append(Spacer(1, 15))

    # Optimized Bullet Points
    bullets = analysis.get("bullet_improvements", [])
    if bullets:
        story.append(Paragraph("Optimized Resume Bullet Points (Before vs. After)", section_heading))
        for idx, b in enumerate(bullets[:4], 1):
            orig = b.get("original", "")
            imp = b.get("improved", "")
            reason = b.get("reason", "")
            story.append(Paragraph(f"<b>Example {idx}:</b>", body_style))
            story.append(Paragraph(f"• <i>Original:</i> <font color='#dc2626'>{orig}</font>", bullet_style))
            story.append(Paragraph(f"• <i>Optimized:</i> <font color='#16a34a'><b>{imp}</b></font>", bullet_style))
            if reason:
                story.append(Paragraph(f"• <i>Why this works:</i> {reason}", bullet_style))
            story.append(Spacer(1, 6))

    # Action Items
    actions = analysis.get("action_items", [])
    if actions:
        story.append(Paragraph("Prioritized Action Plan", section_heading))
        for act in actions[:5]:
            pri = act.get("priority", "medium").upper()
            action_text = act.get("action", "")
            cat = act.get("category", "")
            color_hex = "#dc2626" if pri == "HIGH" else "#d97706" if pri == "MEDIUM" else "#2563eb"
            story.append(
                Paragraph(
                    f"<b>[<font color='{color_hex}'>{pri}</font>]</b> {action_text} <i>({cat})</i>",
                    bullet_style,
                )
            )

    doc.build(story)
    buffer.seek(0)
    return buffer

