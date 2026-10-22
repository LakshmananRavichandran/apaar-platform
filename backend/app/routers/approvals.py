import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models.models import (
    TransferRequest, StudentEditRequest, College, Student, User, UserRole
)
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/approvals", tags=["Approvals Queue"])

@router.get("/transfers")
def list_transfer_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TransferRequest)
    if current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        query = query.filter(
            (TransferRequest.from_college_id == current_user.college_id) |
            (TransferRequest.to_college_id == current_user.college_id)
        )
    transfers = query.order_by(TransferRequest.id.desc()).all()
    
    out = []
    for t in transfers:
        stu = db.query(Student).filter(Student.id == t.student_id).first()
        from_c = db.query(College).filter(College.id == t.from_college_id).first()
        to_c = db.query(College).filter(College.id == t.to_college_id).first()
        out.append({
            "id": t.id,
            "student_id": t.student_id,
            "student_name": stu.name if stu else "Student",
            "student_apaar": stu.apaar_id if stu else "N/A",
            "from_college": from_c.name if from_c else "College A",
            "to_college": to_c.name if to_c else "College B",
            "reason": t.reason,
            "from_approved": t.from_approved,
            "to_approved": t.to_approved,
            "aicte_approved": t.aicte_approved,
            "status": t.status,
            "created_at": t.created_at
        })
    return out

@router.post("/transfers/{id}/approve")
def approve_transfer(
    id: int,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    t = db.query(TransferRequest).filter(TransferRequest.id == id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer request not found")

    if current_user.role == UserRole.COLLEGE_ADMIN.value:
        if current_user.college_id == t.to_college_id:
            t.to_approved = True
        elif current_user.college_id == t.from_college_id:
            t.from_approved = True
    else:
        # AICTE Officer / Super Admin
        t.aicte_approved = True

    if t.from_approved and t.to_approved and t.aicte_approved:
        t.status = "APPROVED"
        # Move student to new college
        stu = db.query(Student).filter(Student.id == t.student_id).first()
        if stu:
            stu.college_id = t.to_college_id
            stu.status = "Active"

    db.commit()
    log_audit_event(db, current_user, "APPROVE_TRANSFER", "TRANSFER_REQUEST", str(t.id), None, f"Transfer status: {t.status}")
    return {"message": f"Transfer approval updated. Current status: {t.status}"}

@router.get("/edit-requests")
def list_edit_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(StudentEditRequest)
    if current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        if current_user.college_id:
            query = query.filter(StudentEditRequest.college_id == current_user.college_id)

    requests = query.order_by(StudentEditRequest.id.desc()).all()
    out = []
    for r in requests:
        stu = db.query(Student).filter(Student.id == r.student_id).first()
        out.append({
            "id": r.id,
            "student_id": r.student_id,
            "student_name": stu.name if stu else "Student",
            "student_apaar": stu.apaar_id if stu else "N/A",
            "college_id": r.college_id,
            "proposed_changes": json.loads(r.proposed_changes_json or "{}"),
            "status": r.status,
            "review_notes": r.review_notes,
            "created_at": r.created_at
        })
    return out

@router.post("/edit-requests/{id}/decide")
def decide_edit_request(
    id: int,
    decision: str = Query(...), # "APPROVED" or "REJECTED"
    notes: Optional[str] = Query(None),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    req = db.query(StudentEditRequest).filter(StudentEditRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edit request not found")

    req.status = decision
    req.reviewed_by_user_id = current_user.id
    req.review_notes = notes

    if decision == "APPROVED":
        stu = db.query(Student).filter(Student.id == req.student_id).first()
        changes = json.loads(req.proposed_changes_json or "{}")
        for k, v in changes.items():
            if hasattr(stu, k):
                setattr(stu, k, v)

    db.commit()
    log_audit_event(db, current_user, "DECIDE_EDIT_REQUEST", "STUDENT_EDIT_REQUEST", str(req.id), None, f"Decision: {decision}")
    return {"message": f"Edit request #{req.id} has been {decision.lower()}."}
