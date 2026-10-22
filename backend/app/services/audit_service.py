import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.models import AuditLog, User
from app.core.security import compute_audit_hash

def log_audit_event(
    db: Session,
    user: Optional[User],
    action: str,
    resource: str,
    resource_id: Optional[str] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    ip_address: str = "127.0.0.1"
) -> AuditLog:
    """
    Appends an entry to the tamper-evident cryptographic hash chain.
    """
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_log.hash if last_log else "GENESIS_BLOCK_AICTE_APAAR"
    
    user_id = user.id if user else None
    user_email = user.email if user else "system@aicte.gov.in"
    role = user.role if user else "SYSTEM"
    
    old_val_str = json.dumps(old_value) if isinstance(old_value, (dict, list)) else (str(old_value) if old_value is not None else None)
    new_val_str = json.dumps(new_value) if isinstance(new_value, (dict, list)) else (str(new_value) if new_value is not None else None)
    
    timestamp_dt = datetime.now(timezone.utc)
    timestamp_str = timestamp_dt.isoformat()
    
    entry_hash = compute_audit_hash(
        prev_hash=prev_hash,
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=resource_id,
        old_value=old_val_str,
        new_value=new_val_str,
        timestamp=timestamp_str
    )
    
    log_entry = AuditLog(
        user_id=user_id,
        user_email=user_email,
        role=role,
        action=action,
        resource=resource,
        resource_id=resource_id,
        ip_address=ip_address,
        old_value=old_val_str,
        new_value=new_val_str,
        previous_hash=prev_hash,
        hash=entry_hash,
        timestamp_str=timestamp_str,
        timestamp=timestamp_dt
    )
    
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

def verify_audit_chain_integrity(db: Session) -> Dict[str, Any]:
    """
    Verifies that the entire historical audit log chain has not been tampered with,
    re-calculating the SHA-256 hash at every step.
    """
    logs: List[AuditLog] = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    if not logs:
        return {
            "is_intact": True,
            "total_records": 0,
            "broken_at_id": None,
            "message": "Audit chain is empty. Genesis ready."
        }

    expected_prev = "GENESIS_BLOCK_AICTE_APAAR"
    for log in logs:
        if log.previous_hash != expected_prev:
            return {
                "is_intact": False,
                "total_records": len(logs),
                "broken_at_id": log.id,
                "message": f"Tampering detected! Previous hash link mismatch at record #{log.id}."
            }
        
        recomputed = compute_audit_hash(
            prev_hash=log.previous_hash,
            user_id=log.user_id,
            action=log.action,
            resource=log.resource,
            resource_id=log.resource_id,
            old_value=log.old_value,
            new_value=log.new_value,
            timestamp=log.timestamp_str or (log.timestamp.isoformat() if log.timestamp else "")
        )
        
        if recomputed != log.hash:
            return {
                "is_intact": False,
                "total_records": len(logs),
                "broken_at_id": log.id,
                "message": f"Cryptographic integrity failed at record #{log.id}. Stored hash does not match recalculated hash."
            }
        
        expected_prev = log.hash

    return {
        "is_intact": True,
        "total_records": len(logs),
        "broken_at_id": None,
        "message": f"All {len(logs)} audit records cryptographically verified. Hash chain is intact and untampered."
    }
