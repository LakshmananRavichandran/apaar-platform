import io
import csv
import json
import re
from datetime import datetime, timezone
import pandas as pd
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session

from app.models.models import (
    Student, College, UploadBatch, UploadError, StudentStatus, VerificationStatus
)
from app.core.security import (
    validate_apaar_id, encrypt_field, mask_aadhaar, mask_phone
)
from app.services.verification_engine import verification_engine

REQUIRED_FIELDS = ["apaar_id", "name", "dob", "gender", "aadhaar_last4", "email", "phone", "branch", "admission_year", "enrollment_no"]

def get_csv_template_string() -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "apaar_id", "name", "father_name", "mother_name", "dob", "gender", "category",
        "aadhaar_number", "email", "phone", "address", "state", "district",
        "branch", "admission_year", "current_semester", "cgpa", "enrollment_no"
    ])
    # Add a sample row with a valid 12-digit Luhn APAAR ID
    writer.writerow([
        "100000000007", "Aarav Sharma", "Rajesh Sharma", "Sunita Sharma", "2004-05-15", "Male", "General",
        "123456789012", "aarav.sharma@example.edu", "9876543210", "123 MG Road", "Maharashtra", "Pune",
        "Computer Science", 2023, 3, 8.75, "ENR20230001"
    ])
    return output.getvalue()

def preview_uploaded_file(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parses first 20 rows of CSV or Excel and suggests column mappings.
    """
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        # CSV fallback
        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin1")

    headers = [str(col).strip() for col in df.columns]
    
    # Auto-detect column mapping
    suggested_mapping = {}
    standard_keys = {
        "apaar_id": ["apaar", "apaar_id", "apaarid", "abc_id"],
        "name": ["name", "student_name", "full_name"],
        "father_name": ["father_name", "father", "guardian_name"],
        "mother_name": ["mother_name", "mother"],
        "dob": ["dob", "date_of_birth", "birth_date"],
        "gender": ["gender", "sex"],
        "category": ["category", "caste"],
        "aadhaar_number": ["aadhaar", "aadhaar_number", "aadhaar_last4", "aadhar"],
        "email": ["email", "email_id"],
        "phone": ["phone", "mobile", "contact"],
        "address": ["address", "residence"],
        "state": ["state", "province"],
        "district": ["district", "city"],
        "branch": ["branch", "department", "stream"],
        "admission_year": ["admission_year", "year_of_admission", "batch"],
        "current_semester": ["current_semester", "semester", "sem"],
        "cgpa": ["cgpa", "gpa", "score"],
        "enrollment_no": ["enrollment_no", "reg_no", "roll_no", "usn"]
    }

    for header in headers:
        clean = header.lower().replace(" ", "_")
        for std_key, aliases in standard_keys.items():
            if clean in aliases or std_key in clean:
                suggested_mapping[header] = std_key
                break

    preview_rows = df.head(20).fillna("").to_dict(orient="records")

    return {
        "headers": headers,
        "suggested_mapping": suggested_mapping,
        "preview_rows": preview_rows,
        "total_rows": len(df)
    }

def process_bulk_file_upload(
    college_id: int,
    user_id: int,
    file_bytes: bytes,
    filename: str,
    column_mapping: Dict[str, str], # Maps file_header -> standard_field
    db: Session
) -> Dict[str, Any]:
    """
    Validates, handles partial success, stores errors, executes verification engine,
    and returns upload metrics and batch ID.
    """
    if filename.endswith(".xlsx") or filename.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin1")

    df = df.fillna("")
    
    # Invert mapping to map standard_field -> file_header
    inv_map = {v: k for k, v in column_mapping.items()}

    # Create batch record
    batch = UploadBatch(
        college_id=college_id,
        user_id=user_id,
        filename=filename,
        total_records=len(df),
        success_count=0,
        error_count=0,
        status="PROCESSING",
        created_student_ids="[]"
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    created_ids = []
    seen_in_batch_apaar = set()
    errors_list = []

    college = db.query(College).filter(College.id == college_id).first()
    college_state = college.state if college else "Delhi"

    for idx, row in df.iterrows():
        row_num = idx + 1
        
        def get_val(std_key: str, default: str = "") -> str:
            col_name = inv_map.get(std_key)
            if col_name and col_name in row:
                return str(row[col_name]).strip()
            return default

        apaar_id = get_val("apaar_id")
        name = get_val("name")
        dob = get_val("dob")
        gender = get_val("gender", "Other")
        aadhaar_raw = get_val("aadhaar_number", "0000")
        email = get_val("email")
        phone = get_val("phone", "9000000000")
        branch = get_val("branch", "General Engineering")
        adm_year_str = get_val("admission_year", "2024")
        sem_str = get_val("current_semester", "1")
        cgpa_str = get_val("cgpa", "7.5")
        enrollment_no = get_val("enrollment_no", f"ENR{datetime.now().year}{row_num:04d}")
        
        # Validation rules:
        # Check mandatory fields
        if not apaar_id or not name or not dob:
            err = UploadError(
                batch_id=batch.id,
                row_index=row_num,
                apaar_id=apaar_id,
                student_name=name,
                error_field="Mandatory Fields",
                error_message="Missing required fields (APAAR ID, Name, or DOB).",
                raw_data=json.dumps(row.to_dict())
            )
            db.add(err)
            errors_list.append(err)
            continue

        # Check APAAR ID checksum & format
        if not validate_apaar_id(apaar_id):
            err = UploadError(
                batch_id=batch.id,
                row_index=row_num,
                apaar_id=apaar_id,
                student_name=name,
                error_field="apaar_id",
                error_message=f"APAAR ID '{apaar_id}' failed 12-digit Luhn checksum validation.",
                raw_data=json.dumps(row.to_dict())
            )
            db.add(err)
            errors_list.append(err)
            continue

        # Check duplicate in current file
        if apaar_id in seen_in_batch_apaar:
            err = UploadError(
                batch_id=batch.id,
                row_index=row_num,
                apaar_id=apaar_id,
                student_name=name,
                error_field="apaar_id",
                error_message=f"Duplicate APAAR ID '{apaar_id}' detected inside this upload file.",
                raw_data=json.dumps(row.to_dict())
            )
            db.add(err)
            errors_list.append(err)
            continue
        seen_in_batch_apaar.add(apaar_id)

        # Check duplicate in database
        existing = db.query(Student).filter(Student.apaar_id == apaar_id, Student.is_deleted == False).first()
        if existing:
            err = UploadError(
                batch_id=batch.id,
                row_index=row_num,
                apaar_id=apaar_id,
                student_name=name,
                error_field="apaar_id",
                error_message=f"APAAR ID '{apaar_id}' already registered to student '{existing.name}' at institution #{existing.college_id}.",
                raw_data=json.dumps(row.to_dict())
            )
            db.add(err)
            errors_list.append(err)
            continue

        # Parse numeric fields
        try:
            admission_year = int(float(adm_year_str))
        except Exception:
            admission_year = 2024
        
        try:
            semester = int(float(sem_str))
        except Exception:
            semester = 1

        try:
            cgpa = float(cgpa_str)
        except Exception:
            cgpa = 7.0

        # Clean aadhaar and phone
        aadhaar_digits = ''.join(c for c in aadhaar_raw if c.isdigit())
        aadhaar_last4 = aadhaar_digits[-4:] if len(aadhaar_digits) >= 4 else "1234"
        aadhaar_enc = encrypt_field(aadhaar_digits) if aadhaar_digits else ""

        phone_digits = ''.join(c for c in phone if c.isdigit())
        phone_enc = encrypt_field(phone_digits)
        phone_msk = mask_phone(phone_digits)

        # Insert student
        student = Student(
            apaar_id=apaar_id,
            name=name,
            father_name=get_val("father_name", "Father"),
            mother_name=get_val("mother_name", "Mother"),
            dob=dob,
            gender=gender,
            category=get_val("category", "General"),
            aadhaar_encrypted=aadhaar_enc,
            aadhaar_last4=aadhaar_last4,
            phone_encrypted=phone_enc,
            phone_masked=phone_msk,
            email=email if email else f"student.{apaar_id[-4:]}@college.edu",
            address=get_val("address", "Campus Hostel"),
            state=get_val("state", college_state),
            district=get_val("district", "City"),
            college_id=college_id,
            branch=branch,
            admission_year=admission_year,
            current_semester=semester,
            cgpa=cgpa,
            enrollment_no=enrollment_no,
            status=StudentStatus.ACTIVE.value,
            verification_status=VerificationStatus.PENDING.value
        )
        db.add(student)
        db.flush()

        # Run verification engine
        v_res = verification_engine.run_all_checks(student, db)
        student.verification_status = v_res["status"]
        student.trust_score = v_res["trust_score"]
        student.risk_score = v_res["risk_score"]
        student.anomaly_reasons = json.dumps(v_res["anomaly_reasons"])

        created_ids.append(student.id)

    batch.success_count = len(created_ids)
    batch.error_count = len(errors_list)
    batch.created_student_ids = json.dumps(created_ids)
    batch.status = "COMPLETED" if len(errors_list) == 0 else "PARTIAL_SUCCESS"
    
    db.commit()

    return {
        "batch_id": batch.id,
        "total_records": len(df),
        "success_count": len(created_ids),
        "error_count": len(errors_list),
        "status": batch.status
    }

def rollback_upload_batch(batch_id: int, db: Session) -> Dict[str, Any]:
    """
    Rolls back an entire upload batch, safely removing created student records.
    """
    batch = db.query(UploadBatch).filter(UploadBatch.id == batch_id).first()
    if not batch:
        return {"success": False, "message": "Batch not found"}
    
    if batch.status == "ROLLED_BACK":
        return {"success": False, "message": "Batch has already been rolled back"}

    try:
        student_ids = json.loads(batch.created_student_ids or "[]")
    except Exception:
        student_ids = []

    if student_ids:
        # Soft delete students
        db.query(Student).filter(Student.id.in_(student_ids)).update({"is_deleted": True}, synchronize_session=False)

    batch.status = "ROLLED_BACK"
    db.commit()

    return {
        "success": True,
        "batch_id": batch.id,
        "rolled_back_count": len(student_ids),
        "message": f"Successfully rolled back batch #{batch.id} ({len(student_ids)} students deleted)."
    }

def get_error_report_csv(batch_id: int, db: Session) -> str:
    errors = db.query(UploadError).filter(UploadError.batch_id == batch_id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Row Number", "APAAR ID", "Student Name", "Error Field", "Error Reason"])
    for e in errors:
        writer.writerow([e.row_index, e.apaar_id or "N/A", e.student_name or "N/A", e.error_field, e.error_message])
    return output.getvalue()
