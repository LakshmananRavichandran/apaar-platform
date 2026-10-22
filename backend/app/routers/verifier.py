import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
import io

from app.database import get_db
from app.models.models import (
    Student, VerificationRequest, ConsentRecord, ApiKey, Bookmark, User, UserRole
)
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/verifier", tags=["Verifier Portal"])

@router.get("/search")
def verifier_search(
    apaar_id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    dob: Optional[str] = Query(None),
    enrollment_no: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Student).filter(Student.is_deleted == False)

    if apaar_id:
        query = query.filter(Student.apaar_id == apaar_id.strip())
    elif enrollment_no:
        query = query.filter(Student.enrollment_no == enrollment_no.strip())
    elif name and dob:
        query = query.filter(Student.name.ilike(f"%{name.strip()}%"), Student.dob == dob.strip())
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either APAAR ID, Enrollment Number, or Name + DOB."
        )

    student = query.first()
    if not student:
        return {"found": False, "message": "No matching academic credentials discovered."}

    # Privacy Check: Does this verifier have granted consent?
    active_consent = db.query(ConsentRecord).filter(
        ConsentRecord.student_id == student.id,
        ConsentRecord.status == "ACTIVE",
        ConsentRecord.expires_at > datetime.now(timezone.utc)
    ).first()

    # Base consented fields (privacy-aware)
    result = {
        "found": True,
        "student_id": student.id,
        "apaar_id": student.apaar_id,
        "name": student.name,
        "verification_status": student.verification_status,
        "trust_score": student.trust_score,
        "institution": student.college.name if student.college else "AICTE Institution",
        "course": student.course_name,
        "branch": student.branch,
        "admission_year": student.admission_year,
        "status": student.status,
        "has_extended_consent": active_consent is not None,
        "last_verified_date": student.updated_at.strftime("%d-%b-%Y")
    }

    # If extended consent granted, expose academic metrics
    if active_consent:
        result["cgpa"] = student.cgpa
        result["current_semester"] = student.current_semester
        result["category"] = student.category
        result["consent_expires_at"] = active_consent.expires_at.strftime("%d-%b-%Y")

    log_audit_event(db, current_user, "VERIFIER_QUERY", "STUDENT", str(student.id), None, f"Queried APAAR: {student.apaar_id}")

    return result

@router.post("/request-access")
def request_detailed_access(
    student_id: int,
    purpose: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id, Student.is_deleted == False).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    code = f"VER-REQ-{secrets.token_hex(4).upper()}"
    req = VerificationRequest(
        request_code=code,
        student_id=student.id,
        requested_by_user_id=current_user.id,
        organization_name=current_user.full_name or "Verification Agency",
        purpose=purpose,
        status="PENDING",
        requested_fields="apaar_id,name,dob,college,course,cgpa,semester",
        expires_at=datetime.now(timezone.utc) + timedelta(days=14)
    )
    db.add(req)
    db.commit()

    log_audit_event(db, current_user, "REQUEST_CONSENT", "STUDENT", str(student.id), None, f"Purpose: {purpose}")
    return {"message": "Detailed credential access request transmitted to student for authorization.", "request_code": code}

@router.post("/bulk-verify")
async def bulk_verify_apaar_ids(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception:
        df = pd.read_excel(io.BytesIO(contents))

    # Look for apaar_id column
    id_col = None
    for col in df.columns:
        if "apaar" in str(col).lower() or "id" in str(col).lower():
            id_col = col
            break
    if not id_col:
        id_col = df.columns[0]

    results = []
    for val in df[id_col].dropna():
        apaar = str(val).strip()
        student = db.query(Student).filter(Student.apaar_id == apaar, Student.is_deleted == False).first()
        if student:
            results.append({
                "apaar_id": apaar,
                "name": student.name,
                "status": student.verification_status,
                "trust_score": student.trust_score,
                "institution": student.college.name if student.college else "AICTE Institution",
                "verified": student.verification_status == "Verified"
            })
        else:
            results.append({
                "apaar_id": apaar,
                "name": "Unknown",
                "status": "Not Found",
                "trust_score": 0.0,
                "institution": "N/A",
                "verified": False
            })

    return {
        "total_submitted": len(results),
        "verified_count": sum(1 for r in results if r["verified"]),
        "results": results
    }

@router.get("/api-keys")
def list_api_keys(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = db.query(ApiKey).filter(ApiKey.user_id == current_user.id).all()
    return [
        {
            "id": k.id,
            "org_name": k.org_name,
            "key_prefix": k.key_prefix,
            "rate_limit_per_minute": k.rate_limit_per_minute,
            "usage_count": k.usage_count,
            "is_active": k.is_active,
            "created_at": k.created_at,
            "last_used_at": k.last_used_at
        }
        for k in keys
    ]

@router.post("/api-keys")
def create_api_key(
    org_name: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw_token = f"apaar_live_{secrets.token_urlsafe(24)}"
    prefix = raw_token[:10]
    key_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    key_record = ApiKey(
        user_id=current_user.id,
        org_name=org_name,
        key_prefix=prefix,
        key_hash=key_hash,
        rate_limit_per_minute=60,
        is_active=True
    )
    db.add(key_record)
    db.commit()

    log_audit_event(db, current_user, "CREATE_API_KEY", "API_KEY", str(key_record.id), None, f"Org: {org_name}")

    return {
        "message": "API key created. Save this secret key now as it will not be shown again.",
        "api_key": raw_token,
        "key_prefix": prefix,
        "rate_limit_per_minute": 60
    }

@router.delete("/api-keys/{id}")
def revoke_api_key(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    k = db.query(ApiKey).filter(ApiKey.id == id, ApiKey.user_id == current_user.id).first()
    if not k:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    k.is_active = False
    db.commit()
    return {"message": "API Key revoked successfully"}

@router.get("/usage-stats")
def get_usage_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = db.query(ApiKey).filter(ApiKey.user_id == current_user.id).all()
    total_calls = sum(k.usage_count for k in keys)
    return {
        "active_keys": len([k for k in keys if k.is_active]),
        "total_api_calls_made": total_calls,
        "rate_limit_rpm": 60,
        "sandbox_mode": True,
        "monthly_quota": 50000,
        "usage_percentage": round((total_calls / 50000) * 100, 2)
    }
