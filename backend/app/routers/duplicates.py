import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.models import DuplicateGroup, Student, User, UserRole
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/duplicates", tags=["Duplicate Management"])

@router.get("", response_model=Dict[str, Any])
def list_duplicate_groups(
    status_filter: str = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(DuplicateGroup)
    if status_filter:
        query = query.filter(DuplicateGroup.status == status_filter)
    
    groups = query.order_by(DuplicateGroup.id.desc()).all()
    out = []
    for g in groups:
        p_stu = db.query(Student).filter(Student.id == g.primary_student_id).first()
        s_stu = db.query(Student).filter(Student.id == g.secondary_student_id).first()
        out.append({
            "id": g.id,
            "group_identifier": g.group_identifier,
            "status": g.status,
            "confidence_score": g.confidence_score,
            "reasons": json.loads(g.reasons or "[]"),
            "primary_student": {
                "id": p_stu.id,
                "name": p_stu.name,
                "apaar_id": p_stu.apaar_id,
                "college": p_stu.college.name if p_stu and p_stu.college else "College A",
                "admission_year": p_stu.admission_year if p_stu else None
            } if p_stu else None,
            "secondary_student": {
                "id": s_stu.id,
                "name": s_stu.name,
                "apaar_id": s_stu.apaar_id,
                "college": s_stu.college.name if s_stu and s_stu.college else "College B",
                "admission_year": s_stu.admission_year if s_stu else None
            } if s_stu else None,
            "created_at": g.created_at
        })

    return {"total": len(out), "groups": out}

@router.get("/{id}")
def get_duplicate_comparison(id: int, db: Session = Depends(get_db)):
    g = db.query(DuplicateGroup).filter(DuplicateGroup.id == id).first()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duplicate group not found")

    p = db.query(Student).filter(Student.id == g.primary_student_id).first()
    s = db.query(Student).filter(Student.id == g.secondary_student_id).first()

    def stu_dict(st: Student):
        if not st:
            return None
        return {
            "id": st.id,
            "name": st.name,
            "apaar_id": st.apaar_id,
            "dob": st.dob,
            "gender": st.gender,
            "father_name": st.father_name,
            "mother_name": st.mother_name,
            "aadhaar_last4": st.aadhaar_last4,
            "phone_masked": st.phone_masked,
            "college": st.college.name if st.college else "N/A",
            "state": st.state,
            "course": st.course_name,
            "branch": st.branch,
            "admission_year": st.admission_year,
            "cgpa": st.cgpa,
            "enrollment_no": st.enrollment_no,
            "trust_score": st.trust_score,
            "verification_status": st.verification_status
        }

    return {
        "id": g.id,
        "group_identifier": g.group_identifier,
        "confidence_score": g.confidence_score,
        "status": g.status,
        "reasons": json.loads(g.reasons or "[]"),
        "primary": stu_dict(p),
        "secondary": stu_dict(s)
    }

@router.post("/{id}/merge")
def merge_duplicate_records(
    id: int,
    retain_student_id: int = Query(...), # Which student to keep as canonical
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value])),
    db: Session = Depends(get_db)
):
    g = db.query(DuplicateGroup).filter(DuplicateGroup.id == id).first()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duplicate group not found")

    archive_id = g.secondary_student_id if retain_student_id == g.primary_student_id else g.primary_student_id
    
    # Soft delete archived student
    archived = db.query(Student).filter(Student.id == archive_id).first()
    if archived:
        archived.is_deleted = True
        archived.status = "Transferred"

    # Retained student verified
    retained = db.query(Student).filter(Student.id == retain_student_id).first()
    if retained:
        retained.verification_status = "Verified"
        retained.trust_score = 98.0

    g.status = "RESOLVED_MERGED"
    g.resolved_by = current_user.full_name
    db.commit()

    log_audit_event(
        db, current_user, "MERGE_DUPLICATES", "DUPLICATE_GROUP", str(g.id),
        f"Archived #{archive_id}", f"Retained #{retain_student_id} as canonical record"
    )

    return {"message": f"Successfully merged records. Student #{retain_student_id} established as canonical record."}

@router.post("/{id}/resolve-separate")
def mark_as_not_duplicate(
    id: int,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value])),
    db: Session = Depends(get_db)
):
    g = db.query(DuplicateGroup).filter(DuplicateGroup.id == id).first()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Duplicate group not found")

    g.status = "RESOLVED_SEPARATE"
    g.resolved_by = current_user.full_name
    db.commit()

    log_audit_event(db, current_user, "SEPARATE_DUPLICATES", "DUPLICATE_GROUP", str(g.id), None, "Confirmed distinct individuals")
    return {"message": "Group resolved as distinct individuals."}
