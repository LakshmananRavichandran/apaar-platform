from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Flag, FlagComment, Student, User, UserRole, FlagStatus, FlagSeverity
from app.schemas.schemas import FlagOut, FlagCreate, FlagCommentCreate
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event
from app.core.websocket import ws_manager

router = APIRouter(prefix="/flags", tags=["Flag Management"])

@router.get("", response_model=Dict[str, Any])
def list_flags(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    college_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Flag)

    if current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        if current_user.college_id:
            query = query.filter(Flag.college_id == current_user.college_id)
    elif college_id:
        query = query.filter(Flag.college_id == college_id)

    if status_filter:
        query = query.filter(Flag.status == status_filter)
    if severity:
        query = query.filter(Flag.severity == severity)
    if search:
        s = f"%{search.strip()}%"
        query = query.join(Student).filter(
            (Student.name.ilike(s)) | (Student.apaar_id.ilike(s)) | (Flag.description.ilike(s))
        )

    total = query.count()
    flags = query.order_by(Flag.id.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for f in flags:
        items.append({
            "id": f.id,
            "student_id": f.student_id,
            "student_name": f.student.name if f.student else "Student",
            "student_apaar": f.student.apaar_id if f.student else "N/A",
            "college_id": f.college_id,
            "college_name": f.student.college.name if f.student and f.student.college else "College",
            "flag_type": f.flag_type,
            "severity": f.severity,
            "description": f.description,
            "status": f.status,
            "sla_deadline": f.sla_deadline,
            "created_at": f.created_at,
            "resolved_at": f.resolved_at,
            "comments_count": len(f.comments)
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "flags": items
    }

@router.get("/{id}")
def get_flag(id: int, db: Session = Depends(get_db)):
    f = db.query(Flag).filter(Flag.id == id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flag not found")

    return {
        "id": f.id,
        "student_id": f.student_id,
        "student_name": f.student.name if f.student else "Student",
        "student_apaar": f.student.apaar_id if f.student else "N/A",
        "college_id": f.college_id,
        "college_name": f.student.college.name if f.student and f.student.college else "College",
        "flag_type": f.flag_type,
        "severity": f.severity,
        "description": f.description,
        "status": f.status,
        "sla_deadline": f.sla_deadline,
        "created_at": f.created_at,
        "resolved_at": f.resolved_at,
        "comments": [
            {
                "id": c.id,
                "user_name": c.user_name,
                "comment": c.comment,
                "created_at": c.created_at
            }
            for c in f.comments
        ]
    }

@router.post("")
def create_flag(
    payload: FlagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    flag = Flag(
        student_id=student.id,
        college_id=student.college_id,
        flag_type=payload.flag_type,
        severity=payload.severity,
        description=payload.description,
        status=FlagStatus.OPEN.value,
        created_by_user_id=current_user.id
    )
    db.add(flag)
    
    # Update student status to Flagged if not rejected
    if student.verification_status != "Rejected":
        student.verification_status = "Flagged"

    db.commit()
    db.refresh(flag)

    log_audit_event(db, current_user, "CREATE_FLAG", "FLAG", str(flag.id), None, payload.description)
    return {"message": "Discrepancy flag logged successfully", "flag_id": flag.id}

@router.post("/{id}/comments")
async def add_flag_comment(
    id: int,
    payload: FlagCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    f = db.query(Flag).filter(Flag.id == id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flag not found")

    comm = FlagComment(
        flag_id=f.id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        comment=payload.comment
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)

    await ws_manager.broadcast({
        "type": "FLAG_COMMENT",
        "flag_id": f.id,
        "author": current_user.full_name,
        "comment": payload.comment
    })

    return {"message": "Comment posted", "comment_id": comm.id}

@router.put("/{id}/status")
def update_flag_status(
    id: int,
    new_status: str = Query(...), # OPEN, ESCALATED, RESOLVED, REOPENED
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    f = db.query(Flag).filter(Flag.id == id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flag not found")

    old_status = f.status
    f.status = new_status
    if new_status == FlagStatus.RESOLVED.value:
        f.resolved_at = datetime.now(timezone.utc)
        
        # Check if student has other open flags
        open_flags = db.query(Flag).filter(
            Flag.student_id == f.student_id,
            Flag.id != f.id,
            Flag.status.in_([FlagStatus.OPEN.value, FlagStatus.ESCALATED.value])
        ).count()
        if open_flags == 0:
            student = db.query(Student).filter(Student.id == f.student_id).first()
            if student:
                student.verification_status = "Verified"
                student.trust_score = 95.0

    db.commit()

    log_audit_event(db, current_user, "UPDATE_FLAG_STATUS", "FLAG", str(f.id), old_status, new_status)
    return {"message": f"Flag status updated from {old_status} to {new_status}"}
