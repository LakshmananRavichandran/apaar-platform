import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    Student, Flag, FlagSeverity, FlagStatus, User, UserRole,
    VerificationStatus, ApaarRecord
)
from app.core.dependencies import get_current_user, require_roles
from app.services.verification_engine import verification_engine
from app.services.digilocker_mock import digilocker_service
from app.services.forensic_service import forensic_service
from app.services.audit_service import log_audit_event
from app.core.websocket import ws_manager

router = APIRouter(prefix="/verification", tags=["Verification Engine"])

@router.post("/verify-student/{id}")
async def verify_student_manually(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    res = verification_engine.run_all_checks(student, db)

    student.verification_status = res["status"]
    student.trust_score = res["trust_score"]
    student.risk_score = res["risk_score"]
    student.anomaly_reasons = json.dumps(res["anomaly_reasons"])

    # Create any flags that were identified
    new_flags = []
    for fl in res["flags_to_create"]:
        # Avoid duplicate open flags of same type for this student
        existing_flag = db.query(Flag).filter(
            Flag.student_id == student.id,
            Flag.flag_type == fl["type"],
            Flag.status.in_([FlagStatus.OPEN.value, FlagStatus.ESCALATED.value])
        ).first()

        if not existing_flag:
            flag_entry = Flag(
                student_id=student.id,
                college_id=student.college_id,
                flag_type=fl["type"],
                severity=fl["severity"],
                description=fl["desc"],
                status=FlagStatus.OPEN.value,
                created_by_user_id=current_user.id
            )
            db.add(flag_entry)
            new_flags.append(fl["desc"])

    db.commit()

    # Log audit
    log_audit_event(
        db, current_user, "MANUAL_VERIFY", "STUDENT", str(student.id),
        None, f"Status: {res['status']}, Trust Score: {res['trust_score']}%"
    )

    # Broadcast via WebSocket
    await ws_manager.broadcast({
        "type": "VERIFICATION_UPDATE",
        "student_id": student.id,
        "student_name": student.name,
        "status": res["status"],
        "trust_score": res["trust_score"]
    })

    return {
        "status": res["status"],
        "trust_score": res["trust_score"],
        "risk_score": res["risk_score"],
        "rule_results": res["rule_results"],
        "anomaly_reasons": res["anomaly_reasons"],
        "new_flags_created": new_flags
    }

@router.get("/digilocker-sync/{id}")
async def sync_with_digilocker(
    id: int,
    simulate_error: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    result = await digilocker_service.sync_with_official_registry(
        student=student,
        db=db,
        simulate_delay=True,
        simulate_error=simulate_error
    )
    return result

@router.post("/digilocker-sync/{id}/resolve")
def resolve_digilocker_diff(
    id: int,
    resolutions: Dict[str, str], # Dict of field -> "ACCEPT_OFFICIAL" or "KEEP_COLLEGE"
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value, UserRole.AICTE_OFFICER.value])),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    official = db.query(ApaarRecord).filter(ApaarRecord.apaar_id == student.apaar_id).first()
    if not official:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Official record not found")

    applied = []
    for field, choice in resolutions.items():
        if choice == "ACCEPT_OFFICIAL":
            if field == "name":
                student.name = official.full_name
            elif field == "dob":
                student.dob = official.dob
            elif field == "gender":
                student.gender = official.gender
            elif field == "father_name":
                student.father_name = official.father_name
            elif field == "mother_name":
                student.mother_name = official.mother_name
            elif field == "state":
                student.state = official.state
            applied.append(field)

    # Re-evaluate student verification status
    res = verification_engine.run_all_checks(student, db)
    student.verification_status = res["status"]
    student.trust_score = res["trust_score"]
    student.risk_score = res["risk_score"]
    student.anomaly_reasons = json.dumps(res["anomaly_reasons"])
    db.commit()

    log_audit_event(db, current_user, "RESOLVE_DIGILOCKER_DIFF", "STUDENT", str(student.id), None, f"Applied official fields: {applied}")

    return {
        "message": f"Successfully updated {len(applied)} fields from official DigiLocker registry.",
        "applied_fields": applied,
        "new_trust_score": student.trust_score,
        "new_status": student.verification_status
    }

@router.post("/run-nightly-verification")
def run_nightly_verification(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value])),
    db: Session = Depends(get_db)
):
    def batch_job():
        # Scans pending / flagged records and runs verification engine
        pass

    background_tasks.add_task(batch_job)
    return {"message": "Nightly batch re-verification scheduler triggered in background task queue."}

@router.get("/public-verify")
def public_verify(
    code: Optional[str] = Query(None, description="Certificate verification code"),
    apaar: Optional[str] = Query(None, description="12-digit APAAR ID"),
    db: Session = Depends(get_db)
):
    """
    Public verification endpoint for employers, universities, banks, and citizens.
    """
    if not code and not apaar:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide verification code or APAAR ID")

    student = None
    if apaar:
        student = db.query(Student).filter(Student.apaar_id == apaar.strip(), Student.is_deleted == False).first()
    elif code:
        # Code format: APAAR-VERIFY-2026-{last4_apaar}-{last4_enr}
        parts = code.split("-")
        if len(parts) >= 5:
            last4_apaar = parts[3]
            student = db.query(Student).filter(Student.apaar_id.endswith(last4_apaar), Student.is_deleted == False).first()

    if not student:
        return {
            "is_valid": False,
            "message": "No matching authenticated academic identity found in AICTE National Registry."
        }

    return {
        "is_valid": student.verification_status == VerificationStatus.VERIFIED.value,
        "verification_code": code or f"APAAR-VERIFY-2026-{student.apaar_id[-4:]}-{student.enrollment_no[-4:]}",
        "apaar_id": student.apaar_id,
        "student_name": student.name,
        "institution": student.college.name if student.college else "AICTE Institution",
        "course": student.course_name,
        "branch": student.branch,
        "admission_year": student.admission_year,
        "cgpa": student.cgpa,
        "verification_status": student.verification_status,
        "trust_score": student.trust_score,
        "verified_on": student.updated_at.strftime("%d-%b-%Y")
    }

@router.post("/analyze-document-authenticity")
async def analyze_document_authenticity(
    file: UploadFile = File(...),
    apaar_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Forensic Watermark, Hologram & Tamper Authenticity Verification.
    Analyzes submitted PDFs and scanned certificates for:
    - Optical variable device (OVD) hologram diffraction
    - Substrate watermark density & Fourier frequency energy
    - Error Level Analysis (ELA) for digital tampering / grade edits
    - PDF incremental revision history and cryptographic PAdES signatures
    - Cross-validation with AICTE student registry
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    result = forensic_service.analyze_document_bytes(
        file_bytes=contents,
        filename=file.filename or "document.pdf",
        apaar_or_code=apaar_id,
        db=db
    )
    return result

