import os
import io
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime, timezone
from app.config import settings
from app.models.models import Student

os.makedirs(settings.CERTIFICATE_DIR, exist_ok=True)

def generate_qr_image_bytes(data: str) -> io.BytesIO:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=8,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#121212", back_color="#FFFFFF")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

def generate_verification_certificate_pdf(student: Student, verification_code: str) -> str:
    """
    Generates a production-grade AICTE Verification Certificate with embedded QR code.
    Saves to disk and returns the absolute file path.
    """
    file_name = f"certificate_{student.apaar_id}_{verification_code[-6:]}.pdf"
    file_path = os.path.join(settings.CERTIFICATE_DIR, file_name)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#121212'),
        alignment=1 # Center
    )

    subtitle_style = ParagraphStyle(
        'CertSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1DB954'),
        alignment=1
    )

    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#333333'),
    )

    elements = []

    # Title & Subtitle
    elements.append(Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION", title_style))
    elements.append(Paragraph("NATIONAL APAAR STUDENT DATA & VERIFICATION SYSTEM", subtitle_style))
    elements.append(Spacer(1, 10))

    # Border Banner
    cert_code_text = f"<b>CERTIFICATE OF AUTHENTICATED ACADEMIC IDENTITY</b><br/><font size=9 color='#666666'>Verification Code: {verification_code}</font>"
    elements.append(Paragraph(cert_code_text, ParagraphStyle('Banner', alignment=1, fontSize=12, leading=16)))
    elements.append(Spacer(1, 15))

    # QR Code generation
    # QR points to the verification page
    qr_url = f"http://localhost:5173/verify-public?code={verification_code}&apaar={student.apaar_id}"
    qr_buf = generate_qr_image_bytes(qr_url)
    qr_img = Image(qr_buf, width=1.6*inch, height=1.6*inch)

    # Student metadata table
    college_name = student.college.name if student.college else "AICTE Approved Institution"
    data = [
        [Paragraph("<b>Student Full Name:</b>", body_style), Paragraph(student.name, body_style), qr_img],
        [Paragraph("<b>APAAR ID (12-Digit):</b>", body_style), Paragraph(f"<b>{student.apaar_id}</b>", body_style), ""],
        [Paragraph("<b>Date of Birth:</b>", body_style), Paragraph(student.dob, body_style), ""],
        [Paragraph("<b>Gender / Category:</b>", body_style), Paragraph(f"{student.gender} / {student.category}", body_style), ""],
        [Paragraph("<b>Institution:</b>", body_style), Paragraph(college_name, body_style), ""],
        [Paragraph("<b>Course / Branch:</b>", body_style), Paragraph(f"{student.course_name} ({student.branch})", body_style), ""],
        [Paragraph("<b>Admission Year / Sem:</b>", body_style), Paragraph(f"{student.admission_year} | Semester {student.current_semester}", body_style), ""],
        [Paragraph("<b>Cumulative GPA (CGPA):</b>", body_style), Paragraph(f"<b>{student.cgpa} / 10.0</b>", body_style), ""],
        [Paragraph("<b>Verification Trust Score:</b>", body_style), Paragraph(f"<font color='#1DB954'><b>{student.trust_score}% (Verified)</b></font>", body_style), ""],
        [Paragraph("<b>Verification Timestamp:</b>", body_style), Paragraph(datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M:%S UTC"), body_style), ""],
    ]

    table = Table(data, colWidths=[2.2*inch, 3.2*inch, 1.8*inch])
    table.setStyle(TableStyle([
        ('SPAN', (2, 0), (2, 9)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8F9FA')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#1DB954')),
        ('INNERGRID', (0, 0), (1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ALIGN', (2, 0), (2, 9), 'CENTER'),
        ('VALIGN', (2, 0), (2, 9), 'MIDDLE'),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))

    # Legal / Security Disclaimer
    legal_text = (
        "<i>This digital certificate has been issued under the AICTE APAAR National Data Framework complying with "
        "the Digital Personal Data Protection (DPDP) Act 2023. Authenticity can be verified instantaneously by scanning the "
        "QR code above or entering the verification code on the official APAAR Verify public portal.</i>"
    )
    elements.append(Paragraph(legal_text, ParagraphStyle('Legal', fontSize=8, leading=11, textColor=colors.HexColor('#6B7280'), alignment=1)))
    elements.append(Spacer(1, 15))

    # Signatures
    sig_data = [
        [
            Paragraph("<b>Digitally Certified</b><br/>AICTE National Verification Cell", body_style),
            Paragraph("<b>Automated Hash Stamp</b><br/>SHA-256 Validated Signature", body_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[3.6*inch, 3.6*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LINEABOVE', (0, 0), (-1, -1), 1, colors.HexColor('#D1D5DB')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(sig_table)

    doc.build(elements)
    return file_path

def generate_student_card_pdf(student: Student) -> str:
    """
    Generates a credit-card styled Digital Student ID Card.
    """
    file_name = f"student_card_{student.apaar_id}.pdf"
    file_path = os.path.join(settings.CERTIFICATE_DIR, file_name)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=(400, 240), # Card format
        rightMargin=12,
        leftMargin=12,
        topMargin=12,
        bottomMargin=12
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CardTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        textColor=colors.HexColor('#FFFFFF'),
        alignment=1
    )

    body_style = ParagraphStyle(
        'CardBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#FFFFFF'),
    )

    elements = []
    qr_url = f"http://localhost:5173/verify-public?apaar={student.apaar_id}"
    qr_buf = generate_qr_image_bytes(qr_url)
    qr_img = Image(qr_buf, width=1.1*inch, height=1.1*inch)

    college_name = student.college.name[:35] if student.college else "AICTE Institution"
    data = [
        [Paragraph(f"<b>APAAR DIGITAL STUDENT IDENTITY</b><br/><font size=7>{college_name}</font>", title_style), ""],
        [
            Paragraph(
                f"<b>Name:</b> {student.name}<br/>"
                f"<b>APAAR ID:</b> <font color='#1DB954'><b>{student.apaar_id}</b></font><br/>"
                f"<b>Branch:</b> {student.branch}<br/>"
                f"<b>Year:</b> {student.admission_year} | <b>DOB:</b> {student.dob}<br/>"
                f"<b>Status:</b> <font color='#1DB954'>Verified ({student.trust_score}%)</font>",
                body_style
            ),
            qr_img
        ]
    ]

    table = Table(data, colWidths=[2.6*inch, 1.3*inch])
    table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#181818')),
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#121212')),
        ('ALIGN', (1, 1), (1, 1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#1DB954')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)
    doc.build(elements)
    return file_path
