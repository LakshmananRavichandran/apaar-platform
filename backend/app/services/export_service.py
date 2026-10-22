import io
import csv
import pandas as pd
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def export_records_to_csv(data: List[Dict[str, Any]], fieldnames: List[str]) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    for row in data:
        writer.writerow(row)
    return output.getvalue()

def export_records_to_excel(data: List[Dict[str, Any]]) -> bytes:
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Exported Records")
    output.seek(0)
    return output.getvalue()

def export_records_to_pdf_table(
    title: str,
    headers: List[str],
    rows: List[List[str]],
    landscape_mode: bool = True
) -> bytes:
    output = io.BytesIO()
    pagesize = landscape(letter) if landscape_mode else letter
    doc = SimpleDocTemplate(
        output,
        pagesize=pagesize,
        leftMargin=24,
        rightMargin=24,
        topMargin=24,
        bottomMargin=24
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'RepTitle',
        parent=styles['Heading2'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#121212'),
        alignment=1
    )
    cell_style = ParagraphStyle(
        'RepCell',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
    )

    elements = [
        Paragraph(f"<b>AICTE APAAR VERIFY - {title.upper()}</b>", title_style),
        Spacer(1, 12)
    ]

    # Convert headers & rows to Paragraphs
    table_data = [[Paragraph(f"<b>{h}</b>", cell_style) for h in headers]]
    for row in rows:
        table_data.append([Paragraph(str(val), cell_style) for val in row])

    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1DB954')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#9CA3AF')),
    ]))

    elements.append(table)
    doc.build(elements)
    output.seek(0)
    return output.getvalue()
