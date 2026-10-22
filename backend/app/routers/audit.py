from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import AuditLog, User, UserRole
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import verify_audit_chain_integrity
from app.services.export_service import export_records_to_csv

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=Dict[str, Any])
def list_audit_logs(
    action: Optional[str] = Query(None),
    resource: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value, UserRole.AUDITOR.value])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if resource:
        query = query.filter(AuditLog.resource == resource)
    if user_email:
        query = query.filter(AuditLog.user_email.ilike(f"%{user_email}%"))

    total = query.count()
    logs = query.order_by(AuditLog.id.desc()).offset((page - 1) * limit).limit(limit).all()

    items = [
        {
            "id": l.id,
            "user_id": l.user_id,
            "user_email": l.user_email,
            "role": l.role,
            "action": l.action,
            "resource": l.resource,
            "resource_id": l.resource_id,
            "ip_address": l.ip_address,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "previous_hash": l.previous_hash,
            "hash": l.hash,
            "timestamp": l.timestamp
        }
        for l in logs
    ]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "logs": items
    }

@router.get("/verify-integrity")
def check_chain_integrity(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value, UserRole.AUDITOR.value])),
    db: Session = Depends(get_db)
):
    """
    Cryptographically verifies the entire SHA-256 hash chain from genesis to head.
    """
    integrity_result = verify_audit_chain_integrity(db)
    return integrity_result

@router.get("/export")
def export_audit_logs(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AUDITOR.value])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    data = [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "user_email": l.user_email,
            "role": l.role,
            "action": l.action,
            "resource": l.resource,
            "resource_id": l.resource_id,
            "ip_address": l.ip_address,
            "old_value": l.old_value or "",
            "new_value": l.new_value or "",
            "previous_hash": l.previous_hash,
            "hash": l.hash
        }
        for l in logs
    ]
    csv_str = export_records_to_csv(data, ["id", "timestamp", "user_email", "role", "action", "resource", "resource_id", "ip_address", "old_value", "new_value", "previous_hash", "hash"])
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aicte_audit_tamper_log.csv"}
    )
