from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models.models import SupportTicket, User, UserRole
from app.schemas.schemas import TicketOut, TicketCreate
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/tickets", tags=["Support & Grievances"])

@router.get("", response_model=List[TicketOut])
def list_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SupportTicket)
    if current_user.role == UserRole.STUDENT.value:
        query = query.filter(SupportTicket.reported_by_user_id == current_user.id)
    elif current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        if current_user.college_id:
            query = query.filter(SupportTicket.college_id == current_user.college_id)
    
    if status_filter:
        query = query.filter(SupportTicket.status == status_filter)

    return query.order_by(SupportTicket.id.desc()).all()

@router.post("", response_model=TicketOut)
def create_ticket(
    payload: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ticket_num = f"TCK-2026-{datetime.now().strftime('%M%S%f')[:8]}"
    t = SupportTicket(
        ticket_number=ticket_num,
        student_id=payload.student_id,
        college_id=current_user.college_id,
        reported_by_user_id=current_user.id,
        subject=payload.subject,
        category=payload.category,
        priority=payload.priority,
        status="OPEN",
        resolution_notes=payload.resolution_notes
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    log_audit_event(db, current_user, "CREATE_TICKET", "SUPPORT_TICKET", str(t.id), None, payload.subject)
    return t

@router.put("/{id}/status")
def update_ticket_status(
    id: int,
    status_val: str = Form(...), # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    resolution_notes: Optional[str] = Form(None),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    t = db.query(SupportTicket).filter(SupportTicket.id == id).first()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    t.status = status_val
    if resolution_notes:
        t.resolution_notes = resolution_notes
    if status_val in ["RESOLVED", "CLOSED"]:
        t.resolved_at = datetime.now(timezone.utc)

    db.commit()
    log_audit_event(db, current_user, "UPDATE_TICKET_STATUS", "SUPPORT_TICKET", str(t.id), None, f"Status: {status_val}")
    return {"message": f"Ticket #{t.ticket_number} updated to {status_val}."}
