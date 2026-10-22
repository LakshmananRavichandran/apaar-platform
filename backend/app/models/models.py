from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    AICTE_OFFICER = "AICTE_OFFICER"
    REGIONAL_OFFICER = "REGIONAL_OFFICER"
    COLLEGE_ADMIN = "COLLEGE_ADMIN"
    COLLEGE_STAFF = "COLLEGE_STAFF"
    VERIFIER = "VERIFIER"
    STUDENT = "STUDENT"
    AUDITOR = "AUDITOR"

class StudentStatus(str, enum.Enum):
    ACTIVE = "Active"
    PASSED_OUT = "Passed Out"
    DROPPED = "Dropped"
    TRANSFERRED = "Transferred"

class VerificationStatus(str, enum.Enum):
    VERIFIED = "Verified"
    PENDING = "Pending"
    FLAGGED = "Flagged"
    REJECTED = "Rejected"
    EXPIRED = "Expired"

class FlagSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class FlagStatus(str, enum.Enum):
    OPEN = "OPEN"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    REOPENED = "REOPENED"

# --- Models ---

class College(Base):
    __tablename__ = "colleges"

    id = Column(Integer, primary_key=True, index=True)
    aicte_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    address = Column(String(500), nullable=False)
    state = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    pin_code = Column(String(10), nullable=False)
    accreditation = Column(String(50), default="NAAC A+")
    intake_capacity = Column(Integer, default=600)
    compliance_score = Column(Float, default=95.0)
    verification_score = Column(Float, default=92.0)
    status = Column(String(50), default="Approved")  # Approved, Under Review, Suspended
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    students = relationship("Student", back_populates="college")
    users = relationship("User", back_populates="college")
    departments = relationship("Department", back_populates="college")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    name = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False)

    college = relationship("College", back_populates="departments")
    courses = relationship("Course", back_populates="department")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    name = Column(String(150), nullable=False)  # B.Tech Computer Science
    branch = Column(String(100), nullable=False) # Computer Science & Engineering
    duration_years = Column(Integer, default=4)
    degree_type = Column(String(50), default="UG")  # UG, PG, Diploma

    department = relationship("Department", back_populates="courses")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(50), default=UserRole.STUDENT.value, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    apaar_id = Column(String(12), nullable=True, index=True)  # link for student user
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    totp_secret = Column(String(64), nullable=True)
    is_totp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    college = relationship("College", back_populates="users")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    apaar_id = Column(String(12), index=True, nullable=False) # Indexed, non-unique to allow cross-college duplicate detection
    name = Column(String(150), index=True, nullable=False)
    father_name = Column(String(150), nullable=False)
    mother_name = Column(String(150), nullable=False)
    dob = Column(String(10), nullable=False)  # YYYY-MM-DD
    gender = Column(String(20), nullable=False)
    category = Column(String(50), default="General")  # General, OBC, SC, ST, EWS
    
    # Sensitive masked & encrypted fields
    aadhaar_encrypted = Column(Text, nullable=True)
    aadhaar_last4 = Column(String(4), nullable=False)
    phone_encrypted = Column(Text, nullable=True)
    phone_masked = Column(String(20), nullable=False)
    
    email = Column(String(150), nullable=False)
    address = Column(String(500), nullable=False)
    state = Column(String(100), index=True, nullable=False)
    district = Column(String(100), index=True, nullable=False)
    
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    course_name = Column(String(150), default="B.Tech")
    branch = Column(String(100), index=True, nullable=False)
    admission_year = Column(Integer, index=True, nullable=False)
    current_semester = Column(Integer, default=1)
    cgpa = Column(Float, default=0.0)
    enrollment_no = Column(String(50), index=True, nullable=False)
    
    status = Column(String(50), default=StudentStatus.ACTIVE.value, index=True)
    photo_url = Column(String(300), nullable=True)
    photo_hash = Column(String(64), nullable=True)
    
    # Verification & Trust Metrics
    verification_status = Column(String(50), default=VerificationStatus.PENDING.value, index=True)
    trust_score = Column(Float, default=85.0)  # 0 to 100
    risk_score = Column(Float, default=15.0)   # 0 to 100
    anomaly_reasons = Column(Text, default="[]") # JSON list of detected anomaly reasons
    consent_status = Column(String(50), default="Granted") # Granted, Denied, Pending
    
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    college = relationship("College", back_populates="students")
    academic_records = relationship("AcademicRecord", back_populates="student", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="student", cascade="all, delete-orphan")
    flags = relationship("Flag", back_populates="student", cascade="all, delete-orphan")
    consent_records = relationship("ConsentRecord", back_populates="student", cascade="all, delete-orphan")


class AcademicRecord(Base):
    __tablename__ = "academic_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    sgpa = Column(Float, default=0.0)
    cgpa = Column(Float, default=0.0)
    credits_earned = Column(Integer, default=24)
    total_credits = Column(Integer, default=24)
    backlogs = Column(Integer, default=0)
    result_status = Column(String(50), default="Pass")
    academic_year = Column(String(20), default="2024-2025")
    exam_session = Column(String(50), default="May-June")

    student = relationship("Student", back_populates="academic_records")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    doc_type = Column(String(50), nullable=False)  # marksheet, id_proof, photo, transfer_cert
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100), default="application/pdf")
    file_hash = Column(String(64), nullable=True)
    uploaded_by = Column(String(150), nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="documents")


class ApaarRecord(Base):
    __tablename__ = "apaar_records"
    # Mock APAAR / DigiLocker Registry record for ground-truth verification comparison
    id = Column(Integer, primary_key=True, index=True)
    apaar_id = Column(String(12), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    dob = Column(String(10), nullable=False)
    gender = Column(String(20), nullable=False)
    father_name = Column(String(150), nullable=False)
    mother_name = Column(String(150), nullable=False)
    aadhaar_last4 = Column(String(4), nullable=False)
    state = Column(String(100), nullable=False)
    photo_hash = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(64), unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    requested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_name = Column(String(200), nullable=False)
    purpose = Column(String(300), nullable=False) # Employment, Higher Ed, Loan
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, EXPIRED
    requested_fields = Column(Text, default="apaar_id,name,dob,college,course,cgpa") # comma-separated
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = Column(DateTime, nullable=True)


class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    rule_checks_passed = Column(Text, default="{}") # JSON of rules checked
    checksum_valid = Column(Boolean, default=True)
    anomaly_score = Column(Float, default=0.0)
    trust_score = Column(Float, default=100.0)
    flags_detected = Column(Text, default="[]") # JSON list of flags
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    verified_by = Column(String(100), default="System Engine")
    notes = Column(Text, nullable=True)


class Flag(Base):
    __tablename__ = "flags"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    flag_type = Column(String(100), nullable=False) # CHECKSUM_FAIL, AGE_MISMATCH, DUPLICATE_ID, etc.
    severity = Column(String(50), default=FlagSeverity.MEDIUM.value)
    description = Column(Text, nullable=False)
    status = Column(String(50), default=FlagStatus.OPEN.value, index=True)
    sla_deadline = Column(DateTime, nullable=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="flags")
    comments = relationship("FlagComment", back_populates="flag", cascade="all, delete-orphan")


class FlagComment(Base):
    __tablename__ = "flag_comments"

    id = Column(Integer, primary_key=True, index=True)
    flag_id = Column(Integer, ForeignKey("flags.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_name = Column(String(150), default="Officer")
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    flag = relationship("Flag", back_populates="comments")


class DuplicateGroup(Base):
    __tablename__ = "duplicate_groups"

    id = Column(Integer, primary_key=True, index=True)
    group_identifier = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(50), default="DETECTED") # DETECTED, UNDER_REVIEW, RESOLVED_MERGED, RESOLVED_SEPARATE
    confidence_score = Column(Float, default=95.0)
    reasons = Column(Text, default="[]") # JSON list of matching reasons
    primary_student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    secondary_student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_by = Column(String(150), nullable=True)


class UploadBatch(Base):
    __tablename__ = "upload_batches"

    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    total_records = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED") # PROCESSING, COMPLETED, FAILED, ROLLED_BACK
    created_student_ids = Column(Text, default="[]") # JSON list of IDs for rollback
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    errors = relationship("UploadError", back_populates="batch", cascade="all, delete-orphan")


class UploadError(Base):
    __tablename__ = "upload_errors"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("upload_batches.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    apaar_id = Column(String(50), nullable=True)
    student_name = Column(String(150), nullable=True)
    error_field = Column(String(100), nullable=False)
    error_message = Column(Text, nullable=False)
    raw_data = Column(Text, nullable=True)

    batch = relationship("UploadBatch", back_populates="errors")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(150), default="system@aicte.gov.in")
    role = Column(String(50), default="SYSTEM")
    action = Column(String(100), nullable=False) # CREATE, UPDATE, DELETE, VERIFY, MERGE, EXPORT
    resource = Column(String(100), nullable=False) # STUDENT, COLLEGE, CONSENT, FLAG
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    previous_hash = Column(String(64), nullable=True)
    hash = Column(String(64), nullable=False) # SHA-256 hash of (previous_hash + content)
    timestamp_str = Column(String(60), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # None = broadcast
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="SYSTEM") # ALERT, VERIFICATION, COMPLIANCE, SYSTEM
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    verifier_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verifier_org = Column(String(200), nullable=False)
    fields_granted = Column(Text, default="[]") # JSON list of granted fields
    status = Column(String(50), default="ACTIVE") # ACTIVE, REVOKED, EXPIRED
    granted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)

    student = relationship("Student", back_populates="consent_records")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    org_name = Column(String(200), nullable=False)
    key_prefix = Column(String(12), nullable=False)
    key_hash = Column(String(64), nullable=False)
    rate_limit_per_minute = Column(Integer, default=60)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_used_at = Column(DateTime, nullable=True)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)
    generated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    file_path = Column(String(500), nullable=True)
    format = Column(String(20), default="PDF") # PDF, CSV, EXCEL
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False)
    query_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value_json = Column(Text, nullable=False)
    updated_by = Column(String(150), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    reported_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    category = Column(String(100), default="Data Correction") # Data Correction, Login, Verification, Transfer
    priority = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH
    status = Column(String(50), default="OPEN", index=True) # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    target_role = Column(String(50), default="ALL") # ALL, COLLEGE_ADMIN, VERIFIER, STUDENT
    target_state = Column(String(100), default="ALL")
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TransferRequest(Base):
    __tablename__ = "transfer_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    from_college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    to_college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    initiated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    from_approved = Column(Boolean, default=False)
    to_approved = Column(Boolean, default=False)
    aicte_approved = Column(Boolean, default=False)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class StudentEditRequest(Base):
    __tablename__ = "student_edit_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    requested_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    proposed_changes_json = Column(Text, nullable=False) # JSON diff
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
