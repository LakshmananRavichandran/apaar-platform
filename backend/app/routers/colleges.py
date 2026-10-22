from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Dict, Any

from app.database import get_db
from app.models.models import College, Student, Course, Department, Flag, User, UserRole, VerificationStatus
from app.schemas.schemas import CollegeOut, CollegeCreate
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/colleges", tags=["Colleges"])

@router.get("", response_model=Dict[str, Any])
def list_colleges(
    search: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    min_compliance: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(College)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (College.name.ilike(s)) | (College.aicte_code.ilike(s)) | (College.district.ilike(s))
        )
    if state:
        query = query.filter(College.state == state)
    if district:
        query = query.filter(College.district == district)
    if status_filter:
        query = query.filter(College.status == status_filter)
    if min_compliance is not None:
        query = query.filter(College.compliance_score >= min_compliance)

    total = query.count()
    colleges = query.order_by(College.verification_score.desc()).offset((page - 1) * limit).limit(limit).all()

    # Enrich with student metrics
    items = []
    for c in colleges:
        stu_count = db.query(Student).filter(Student.college_id == c.id, Student.is_deleted == False).count()
        ver_count = db.query(Student).filter(
            Student.college_id == c.id,
            Student.verification_status == VerificationStatus.VERIFIED.value,
            Student.is_deleted == False
        ).count()
        
        # RAG rating: Green (>=90%), Amber (75-89%), Red (<75%)
        rag = "GREEN" if c.compliance_score >= 90.0 else ("AMBER" if c.compliance_score >= 75.0 else "RED")
        
        items.append({
            "id": c.id,
            "aicte_code": c.aicte_code,
            "name": c.name,
            "address": c.address,
            "state": c.state,
            "district": c.district,
            "pin_code": c.pin_code,
            "accreditation": c.accreditation,
            "intake_capacity": c.intake_capacity,
            "compliance_score": c.compliance_score,
            "verification_score": c.verification_score,
            "status": c.status,
            "rag_rating": rag,
            "phone": c.phone,
            "email": c.email,
            "website": c.website,
            "total_students": stu_count,
            "verified_students": ver_count,
            "created_at": c.created_at
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "colleges": items
    }

@router.get("/{id}")
def get_college(id: int, db: Session = Depends(get_db)):
    c = db.query(College).filter(College.id == id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found")

    stu_count = db.query(Student).filter(Student.college_id == c.id, Student.is_deleted == False).count()
    ver_count = db.query(Student).filter(Student.college_id == c.id, Student.verification_status == "Verified", Student.is_deleted == False).count()
    flagged_count = db.query(Student).filter(Student.college_id == c.id, Student.verification_status == "Flagged", Student.is_deleted == False).count()
    courses = db.query(Course).filter(Course.college_id == c.id).all()

    # RAG compliance
    rag = "GREEN" if c.compliance_score >= 90.0 else ("AMBER" if c.compliance_score >= 75.0 else "RED")

    return {
        "id": c.id,
        "aicte_code": c.aicte_code,
        "name": c.name,
        "address": c.address,
        "state": c.state,
        "district": c.district,
        "pin_code": c.pin_code,
        "accreditation": c.accreditation,
        "intake_capacity": c.intake_capacity,
        "compliance_score": c.compliance_score,
        "verification_score": c.verification_score,
        "rag_rating": rag,
        "status": c.status,
        "phone": c.phone,
        "email": c.email,
        "website": c.website,
        "total_students": stu_count,
        "verified_students": ver_count,
        "flagged_students": flagged_count,
        "courses": [{"id": cs.id, "name": cs.name, "branch": cs.branch, "duration_years": cs.duration_years} for cs in courses]
    }

@router.put("/{id}")
def update_college(
    id: int,
    payload: Dict[str, Any],
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    c = db.query(College).filter(College.id == id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found")

    for k, v in payload.items():
        if hasattr(c, k):
            setattr(c, k, v)
    db.commit()

    log_audit_event(db, current_user, "UPDATE", "COLLEGE", str(c.id), None, c.name)
    return {"message": "College profile updated successfully"}

@router.get("/{id}/reports")
def get_college_reports(id: int, db: Session = Depends(get_db)):
    c = db.query(College).filter(College.id == id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found")

    # Gender ratio
    gender_stats = db.query(Student.gender, func.count(Student.id)).filter(
        Student.college_id == id, Student.is_deleted == False
    ).group_by(Student.gender).all()

    # Category stats
    cat_stats = db.query(Student.category, func.count(Student.id)).filter(
        Student.college_id == id, Student.is_deleted == False
    ).group_by(Student.category).all()

    # Branch stats
    branch_stats = db.query(Student.branch, func.count(Student.id)).filter(
        Student.college_id == id, Student.is_deleted == False
    ).group_by(Student.branch).all()

    return {
        "gender_ratio": [{"name": g[0], "value": g[1]} for g in gender_stats],
        "category_wise": [{"name": cat[0], "value": cat[1]} for cat in cat_stats],
        "branch_wise": [{"name": b[0], "value": b[1]} for b in branch_stats],
        "quality_score": round(c.compliance_score * 0.95, 1)
    }
