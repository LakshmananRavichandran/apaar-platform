import os
import json
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.database import get_db
from app.models.models import (
    Student, College, AcademicRecord, Document, Flag, FlagSeverity,
    FlagStatus, User, UserRole, VerificationStatus, StudentStatus,
    StudentEditRequest, TransferRequest
)
from app.schemas.schemas import (
    StudentCreate, StudentUpdate, StudentOut, StudentDetailOut, AcademicRecordOut, DocumentOut
)
from app.core.dependencies import get_current_user, require_roles
from app.core.security import (
    encrypt_field, mask_aadhaar, mask_phone, validate_apaar_id
)
from app.services.verification_engine import verification_engine
from app.services.audit_service import log_audit_event
from app.services.certificate_service import (
    generate_verification_certificate_pdf, generate_student_card_pdf
)
from app.config import settings

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=Dict[str, Any])
def list_students(
    search: Optional[str] = Query(None, description="Search by Name, APAAR ID, or Enrollment No"),
    college_id: Optional[int] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    admission_year: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    verification_status: Optional[str] = Query(None),
    min_trust_score: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Student).filter(Student.is_deleted == False)

    # Restrict college admins and staff to their own college
    if current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        if current_user.college_id:
            query = query.filter(Student.college_id == current_user.college_id)
    elif college_id:
        query = query.filter(Student.college_id == college_id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_term),
                Student.apaar_id.ilike(search_term),
                Student.enrollment_no.ilike(search_term),
                Student.email.ilike(search_term)
            )
        )

    if state:
        query = query.filter(Student.state == state)
    if district:
        query = query.filter(Student.district == district)
    if branch:
        query = query.filter(Student.branch == branch)
    if admission_year:
        query = query.filter(Student.admission_year == admission_year)
    if status_filter:
        query = query.filter(Student.status == status_filter)
    if verification_status:
        query = query.filter(Student.verification_status == verification_status)
    if min_trust_score is not None:
        query = query.filter(Student.trust_score >= min_trust_score)

    total = query.count()
    items = query.order_by(Student.id.desc()).offset((page - 1) * limit).limit(limit).all()

    # Apply data masking for verifiers / auditors / privacy
    out_items = []
    for s in items:
        out_items.append({
            "id": s.id,
            "apaar_id": s.apaar_id,
            "name": s.name,
            "father_name": s.father_name,
            "mother_name": s.mother_name,
            "dob": s.dob,
            "gender": s.gender,
            "category": s.category,
            "aadhaar_last4": s.aadhaar_last4,
            "phone_masked": s.phone_masked,
            "email": s.email,
            "address": s.address,
            "state": s.state,
            "district": s.district,
            "college_id": s.college_id,
            "college_name": s.college.name if s.college else None,
            "course_name": s.course_name,
            "branch": s.branch,
            "admission_year": s.admission_year,
            "current_semester": s.current_semester,
            "cgpa": s.cgpa,
            "enrollment_no": s.enrollment_no,
            "status": s.status,
            "photo_url": s.photo_url,
            "verification_status": s.verification_status,
            "trust_score": s.trust_score,
            "risk_score": s.risk_score,
            "anomaly_reasons": s.anomaly_reasons,
            "consent_status": s.consent_status,
            "created_at": s.created_at
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "students": out_items
    }

@router.get("/{id}", response_model=StudentDetailOut)
def get_student(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student record not found")

    # Scope check for college roles
    if current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        if current_user.college_id and student.college_id != current_user.college_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to students outside your institution")

    # Audit log access
    log_audit_event(db, current_user, "VIEW_PROFILE", "STUDENT", str(student.id), None, f"Viewed student #{student.id}")

    return {
        "id": student.id,
        "apaar_id": student.apaar_id,
        "name": student.name,
        "father_name": student.father_name,
        "mother_name": student.mother_name,
        "dob": student.dob,
        "gender": student.gender,
        "category": student.category,
        "aadhaar_last4": student.aadhaar_last4,
        "phone_masked": student.phone_masked,
        "email": student.email,
        "address": student.address,
        "state": student.state,
        "district": student.district,
        "college_id": student.college_id,
        "college_name": student.college.name if student.college else None,
        "course_name": student.course_name,
        "branch": student.branch,
        "admission_year": student.admission_year,
        "current_semester": student.current_semester,
        "cgpa": student.cgpa,
        "enrollment_no": student.enrollment_no,
        "status": student.status,
        "photo_url": student.photo_url,
        "verification_status": student.verification_status,
        "trust_score": student.trust_score,
        "risk_score": student.risk_score,
        "anomaly_reasons": student.anomaly_reasons,
        "consent_status": student.consent_status,
        "created_at": student.created_at,
        "academic_records": student.academic_records,
        "documents": student.documents
    }

@router.post("", response_model=StudentOut)
def create_student(
    payload: StudentCreate,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value])),
    db: Session = Depends(get_db)
):
    college_id = payload.college_id
    if current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        if current_user.college_id:
            college_id = current_user.college_id

    # Check APAAR ID checksum
    if not validate_apaar_id(payload.apaar_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"APAAR ID '{payload.apaar_id}' failed 12-digit Luhn checksum validation."
        )

    # Check duplicate
    existing = db.query(Student).filter(Student.apaar_id == payload.apaar_id, Student.is_deleted == False).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with APAAR ID '{payload.apaar_id}' is already registered in College #{existing.college_id}."
        )

    aadhaar_raw = ''.join(c for c in payload.aadhaar_number if c.isdigit())
    aadhaar_last4 = aadhaar_raw[-4:] if len(aadhaar_raw) >= 4 else "0000"
    aadhaar_enc = encrypt_field(aadhaar_raw)

    phone_raw = ''.join(c for c in payload.phone if c.isdigit())
    phone_enc = encrypt_field(phone_raw)
    phone_msk = mask_phone(phone_raw)

    student = Student(
        apaar_id=payload.apaar_id,
        name=payload.name,
        father_name=payload.father_name,
        mother_name=payload.mother_name,
        dob=payload.dob,
        gender=payload.gender,
        category=payload.category,
        aadhaar_encrypted=aadhaar_enc,
        aadhaar_last4=aadhaar_last4,
        phone_encrypted=phone_enc,
        phone_masked=phone_msk,
        email=payload.email,
        address=payload.address,
        state=payload.state,
        district=payload.district,
        college_id=college_id,
        course_name=payload.course_name,
        branch=payload.branch,
        admission_year=payload.admission_year,
        current_semester=payload.current_semester,
        cgpa=payload.cgpa,
        enrollment_no=payload.enrollment_no,
        status=StudentStatus.ACTIVE.value,
        verification_status=VerificationStatus.PENDING.value
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    # Run verification engine
    res = verification_engine.run_all_checks(student, db)
    student.verification_status = res["status"]
    student.trust_score = res["trust_score"]
    student.risk_score = res["risk_score"]
    student.anomaly_reasons = json.dumps(res["anomaly_reasons"])
    db.commit()

    # Log audit
    log_audit_event(db, current_user, "CREATE", "STUDENT", str(student.id), None, student.name)

    return student

@router.put("/{id}", response_model=StudentOut)
def update_student(
    id: int,
    payload: StudentUpdate,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if current_user.role == UserRole.COLLEGE_ADMIN.value and student.college_id != current_user.college_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit student outside your institution")

    old_data = {"name": student.name, "cgpa": student.cgpa, "status": student.status, "semester": student.current_semester}

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, key, value)

    # Re-run verification engine
    res = verification_engine.run_all_checks(student, db)
    student.verification_status = res["status"]
    student.trust_score = res["trust_score"]
    student.risk_score = res["risk_score"]
    student.anomaly_reasons = json.dumps(res["anomaly_reasons"])
    db.commit()

    log_audit_event(db, current_user, "UPDATE", "STUDENT", str(student.id), old_data, payload.model_dump(exclude_unset=True))

    return student

@router.delete("/{id}")
def delete_student(
    id: int,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    student.is_deleted = True
    db.commit()

    log_audit_event(db, current_user, "SOFT_DELETE", "STUDENT", str(student.id), student.name, "Marked is_deleted=True")
    return {"message": f"Student '{student.name}' (APAAR: {student.apaar_id}) successfully soft-deleted."}

@router.post("/bulk-action")
def bulk_student_action(
    action: str = Form(...), # "mark_alumni", "mark_active", "mark_dropped"
    student_ids: str = Form(...), # JSON list of IDs
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    ids = json.loads(student_ids)
    new_status = StudentStatus.ACTIVE.value
    if action == "mark_alumni":
        new_status = StudentStatus.PASSED_OUT.value
    elif action == "mark_dropped":
        new_status = StudentStatus.DROPPED.value

    updated_count = db.query(Student).filter(Student.id.in_(ids)).update({"status": new_status}, synchronize_session=False)
    db.commit()

    log_audit_event(db, current_user, "BULK_UPDATE_STATUS", "STUDENT", f"{len(ids)} records", None, f"Status changed to {new_status}")
    return {"message": f"Successfully updated status to {new_status} for {updated_count} students."}

@router.post("/{id}/documents")
async def upload_document(
    id: int,
    doc_type: str = Form(...), # marksheet, id_proof, photo, transfer_cert
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{student.apaar_id}_{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
    target_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    doc = Document(
        student_id=student.id,
        doc_type=doc_type,
        file_name=file.filename,
        file_path=target_path,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        uploaded_by=current_user.full_name
    )
    db.add(doc)
    
    if doc_type == "photo":
        student.photo_url = f"/api/v1/students/{student.id}/documents/{doc.id}/download"
    
    db.commit()
    db.refresh(doc)

    log_audit_event(db, current_user, "UPLOAD_DOCUMENT", "DOCUMENT", str(doc.id), None, f"{doc_type}: {file.filename}")
    return {"message": "Document uploaded successfully", "document_id": doc.id, "file_name": file.filename}

@router.get("/{id}/documents/{doc_id}/download")
def download_document(id: int, doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.student_id == id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found")
    return FileResponse(doc.file_path, filename=doc.file_name, media_type=doc.mime_type)

@router.get("/{id}/certificate")
def get_verification_certificate(id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    code = f"APAAR-VERIFY-2026-{student.apaar_id[-4:]}-{student.enrollment_no[-4:]}"
    pdf_path = generate_verification_certificate_pdf(student, code)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"Verification_Certificate_{student.apaar_id}.pdf"
    )

@router.get("/{id}/id-card")
def get_digital_student_card(id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    pdf_path = generate_student_card_pdf(student)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"APAAR_Digital_Card_{student.apaar_id}.pdf"
    )

@router.post("/{id}/request-edit")
def submit_edit_request(
    id: int,
    proposed_changes: str = Form(...), # JSON diff
    current_user: User = Depends(require_roles([UserRole.COLLEGE_STAFF.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    req = StudentEditRequest(
        student_id=student.id,
        college_id=student.college_id,
        requested_by_user_id=current_user.id,
        proposed_changes_json=proposed_changes,
        status="PENDING"
    )
    db.add(req)
    db.commit()

    log_audit_event(db, current_user, "SUBMIT_EDIT_REQUEST", "STUDENT", str(student.id), None, "Submitted edit approval request")
    return {"message": "Edit request submitted for administrator approval.", "request_id": req.id}

@router.post("/{id}/transfer")
def initiate_transfer(
    id: int,
    to_college_id: int = Form(...),
    reason: str = Form(...),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    target_college = db.query(College).filter(College.id == to_college_id).first()
    if not target_college:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination college not found")

    transfer = TransferRequest(
        student_id=student.id,
        from_college_id=student.college_id,
        to_college_id=to_college_id,
        initiated_by_user_id=current_user.id,
        reason=reason,
        from_approved=True,
        to_approved=False,
        aicte_approved=False,
        status="PENDING"
    )
    db.add(transfer)
    db.commit()

    log_audit_event(db, current_user, "INITIATE_TRANSFER", "STUDENT", str(student.id), f"From college {student.college_id}", f"To college {to_college_id}")
    return {"message": "Student transfer request submitted. Awaiting destination college and AICTE approval.", "transfer_id": transfer.id}
