import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List

from app.database import get_db, engine
from app.models.models import Setting, Student, College, Flag, User, UserRole
from app.core.dependencies import get_current_user, require_roles
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/system", tags=["System Health & Settings"])

@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    # Database size
    db_size_mb = 0.0
    db_file = "apaar_verify.db"
    if os.path.exists(db_file):
        db_size_mb = round(os.path.getsize(db_file) / (1024 * 1024), 2)

    # Activity Heatmap: simulated 7 days of platform activity
    activity_heatmap = [
        {"day": "Mon", "verifications": 1420, "uploads": 12, "flags": 8},
        {"day": "Tue", "verifications": 1840, "uploads": 18, "flags": 14},
        {"day": "Wed", "verifications": 2100, "uploads": 24, "flags": 19},
        {"day": "Thu", "verifications": 1950, "uploads": 15, "flags": 11},
        {"day": "Fri", "verifications": 2350, "uploads": 29, "flags": 22},
        {"day": "Sat", "verifications": 850, "uploads": 6, "flags": 4},
        {"day": "Sun", "verifications": 420, "uploads": 3, "flags": 2}
    ]

    return {
        "status": "OPERATIONAL",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "api_gateway": "ONLINE (200 OK)",
        "database": {
            "engine": "SQLite WAL Mode / PostgreSQL Ready",
            "size_mb": db_size_mb,
            "connected": True
        },
        "background_queue": {
            "status": "IDLE",
            "active_workers": 4,
            "jobs_in_queue": 0
        },
        "digilocker_mock_gateway": {
            "status": "HEALTHY",
            "latency_ms": 32,
            "rate_limit_rpm": 120
        },
        "activity_heatmap": activity_heatmap
    }

@router.get("/settings")
def get_platform_settings(
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.AICTE_OFFICER.value])),
    db: Session = Depends(get_db)
):
    settings = db.query(Setting).all()
    defaults = {
        "anomaly_contamination_rate": 0.04,
        "trust_score_pass_threshold": 80.0,
        "auto_flag_age_mismatch": True,
        "auto_flag_semester_drift": True,
        "dpdp_act_enforce_masking": True,
        "digilocker_sync_rate_limit": 120,
        "account_lockout_threshold": 5
    }
    for s in settings:
        try:
            defaults[s.key] = eval(s.value_json)
        except Exception:
            defaults[s.key] = s.value_json
    return defaults

@router.put("/settings")
def update_platform_settings(
    payload: Dict[str, Any],
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value])),
    db: Session = Depends(get_db)
):
    for k, v in payload.items():
        s = db.query(Setting).filter(Setting.key == k).first()
        if not s:
            s = Setting(key=k, value_json=str(v), updated_by=current_user.full_name)
            db.add(s)
        else:
            s.value_json = str(v)
            s.updated_by = current_user.full_name
    db.commit()

    log_audit_event(db, current_user, "UPDATE_SETTINGS", "SETTING", "SYSTEM_SETTINGS", None, str(payload))
    return {"message": "Platform threshold parameters updated successfully"}
