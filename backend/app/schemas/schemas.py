from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str
    otp: Optional[str] = None

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    college_id: Optional[int] = None
    phone: Optional[str] = None
    apaar_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    token_or_otp: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class TOTPVerifyRequest(BaseModel):
    code: str

# --- Student Schemas ---
class StudentCreate(BaseModel):
    apaar_id: str
    name: str
    father_name: str
    mother_name: str
    dob: str
    gender: str
    category: str = "General"
    aadhaar_number: str
    email: str
    phone: str
    address: str
    state: str
    district: str
    college_id: int
    course_name: str = "B.Tech"
    branch: str
    admission_year: int
    current_semester: int = 1
    cgpa: float = 7.5
    enrollment_no: str

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    branch: Optional[str] = None
    current_semester: Optional[int] = None
    cgpa: Optional[float] = None
    status: Optional[str] = None

class AcademicRecordOut(BaseModel):
    id: int
    semester: int
    sgpa: float
    cgpa: float
    credits_earned: int
    total_credits: int
    backlogs: int
    result_status: str
    academic_year: str
    exam_session: str

    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: int
    doc_type: str
    file_name: str
    file_path: str
    file_size: int
    mime_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class StudentOut(BaseModel):
    id: int
    apaar_id: str
    name: str
    father_name: str
    mother_name: str
    dob: str
    gender: str
    category: str
    aadhaar_last4: str
    phone_masked: str
    email: str
    address: str
    state: str
    district: str
    college_id: int
    college_name: Optional[str] = None
    course_name: Optional[str] = None
    branch: str
    admission_year: int
    current_semester: int
    cgpa: float
    enrollment_no: str
    status: str
    photo_url: Optional[str] = None
    verification_status: str
    trust_score: float
    risk_score: float
    anomaly_reasons: Optional[str] = "[]"
    consent_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class StudentDetailOut(StudentOut):
    academic_records: List[AcademicRecordOut] = []
    documents: List[DocumentOut] = []

# --- College Schemas ---
class CollegeCreate(BaseModel):
    aicte_code: str
    name: str
    address: str
    state: str
    district: str
    pin_code: str
    accreditation: str = "NAAC A+"
    intake_capacity: int = 600
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class CollegeOut(BaseModel):
    id: int
    aicte_code: str
    name: str
    address: str
    state: str
    district: str
    pin_code: str
    accreditation: str
    intake_capacity: int
    compliance_score: float
    verification_score: float
    status: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    total_students: Optional[int] = 0
    verified_students: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

# --- Flag Schemas ---
class FlagCreate(BaseModel):
    student_id: int
    flag_type: str
    severity: str = "MEDIUM"
    description: str

class FlagCommentCreate(BaseModel):
    comment: str

class FlagCommentOut(BaseModel):
    id: int
    user_name: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True

class FlagOut(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_apaar: Optional[str] = None
    college_id: Optional[int] = None
    college_name: Optional[str] = None
    flag_type: str
    severity: str
    description: str
    status: str
    sla_deadline: Optional[datetime] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    comments: List[FlagCommentOut] = []

    class Config:
        from_attributes = True

# --- Verification & Verifier Schemas ---
class VerificationRequestCreate(BaseModel):
    apaar_id: str
    purpose: str
    organization_name: str
    requested_fields: List[str]

class PublicVerificationOut(BaseModel):
    is_valid: bool
    verification_code: str
    apaar_id: str
    student_name: str
    institution: str
    course: str
    branch: str
    admission_year: int
    status: str
    trust_score: float
    issued_on: datetime

# --- Ticket & Announcement Schemas ---
class TicketCreate(BaseModel):
    subject: str
    category: str
    priority: str = "MEDIUM"
    resolution_notes: Optional[str] = None
    student_id: Optional[int] = None

class TicketOut(BaseModel):
    id: int
    ticket_number: str
    subject: str
    category: str
    priority: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: str = "ALL"
    target_state: str = "ALL"

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    target_role: str
    target_state: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI Assistant Schema ---
class AiAssistantQuery(BaseModel):
    query: str

class AiAssistantResponse(BaseModel):
    answer: str
    chart_type: Optional[str] = None
    chart_title: Optional[str] = None
    chart_data: Optional[List[Dict[str, Any]]] = None
    follow_ups: List[str] = []
