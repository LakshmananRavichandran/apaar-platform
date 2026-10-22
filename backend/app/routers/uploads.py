import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.models import UploadBatch, UploadError, User, UserRole
from app.core.dependencies import get_current_user, require_roles
from app.services.bulk_upload import (
    get_csv_template_string, preview_uploaded_file, process_bulk_file_upload,
    rollback_upload_batch, get_error_report_csv
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/uploads", tags=["Bulk Upload"])

@router.get("/template")
def download_csv_template():
    csv_data = get_csv_template_string()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=apaar_student_upload_template.csv"}
    )

@router.post("/preview")
async def preview_upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]))
):
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    preview_res = preview_uploaded_file(contents, file.filename)
    return preview_res

@router.post("/process")
async def process_upload(
    college_id: int = Form(...),
    column_mapping: str = Form(...), # JSON dict mapping file_col -> standard_col
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value])),
    db: Session = Depends(get_db)
):
    if current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        if current_user.college_id:
            college_id = current_user.college_id

    contents = await file.read()
    mapping_dict = json.loads(column_mapping)

    res = process_bulk_file_upload(
        college_id=college_id,
        user_id=current_user.id,
        file_bytes=contents,
        filename=file.filename,
        column_mapping=mapping_dict,
        db=db
    )

    log_audit_event(
        db, current_user, "BULK_UPLOAD", "UPLOAD_BATCH", str(res["batch_id"]),
        None, f"File: {file.filename}, Success: {res['success_count']}, Errors: {res['error_count']}"
    )

    return res

@router.get("/history")
def get_upload_history(
    college_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(UploadBatch)
    if current_user.role in [UserRole.COLLEGE_ADMIN.value, UserRole.COLLEGE_STAFF.value]:
        if current_user.college_id:
            query = query.filter(UploadBatch.college_id == current_user.college_id)
    elif college_id:
        query = query.filter(UploadBatch.college_id == college_id)

    batches = query.order_by(UploadBatch.id.desc()).limit(30).all()
    return [
        {
            "id": b.id,
            "filename": b.filename,
            "total_records": b.total_records,
            "success_count": b.success_count,
            "error_count": b.error_count,
            "status": b.status,
            "created_at": b.created_at
        }
        for b in batches
    ]

@router.post("/{batch_id}/rollback")
def rollback_batch_endpoint(
    batch_id: int,
    current_user: User = Depends(require_roles([UserRole.SUPER_ADMIN.value, UserRole.COLLEGE_ADMIN.value])),
    db: Session = Depends(get_db)
):
    res = rollback_upload_batch(batch_id, db)
    if not res["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res["message"])

    log_audit_event(db, current_user, "ROLLBACK_BATCH", "UPLOAD_BATCH", str(batch_id), None, res["message"])
    return res

@router.get("/{batch_id}/errors-csv")
def download_errors_csv(batch_id: int, db: Session = Depends(get_db)):
    csv_content = get_error_report_csv(batch_id, db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=upload_errors_batch_{batch_id}.csv"}
    )
