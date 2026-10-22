from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.models import Announcement, User, UserRole
from app.schemas.schemas import AnnouncementOut, AnnouncementCreate
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event
from app.core.websocket import ws_manager

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.get("", response_model=List[AnnouncementOut])
def list_announcements(db: Session = Depends(get_db)):
    announcements = db.query(Announcement).filter(Announcement.is_active == True).order_by(Announcement.id.desc()).all()
    return announcements

@router.post("", response_model=AnnouncementOut)
async def create_announcement(
    payload: AnnouncementCreate,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value])),
    db: Session = Depends(get_db)
):
    ann = Announcement(
        title=payload.title,
        content=payload.content,
        target_role=payload.target_role,
        target_state=payload.target_state,
        author_id=current_user.id,
        is_active=True
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)

    log_audit_event(db, current_user, "BROADCAST_ANNOUNCEMENT", "ANNOUNCEMENT", str(ann.id), None, payload.title)

    await ws_manager.broadcast({
        "type": "ANNOUNCEMENT",
        "title": ann.title,
        "content": ann.content
    })

    return ann
