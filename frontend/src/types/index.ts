export type UserRole =
  | 'SUPER_ADMIN'
  | 'AICTE_OFFICER'
  | 'REGIONAL_OFFICER'
  | 'COLLEGE_ADMIN'
  | 'COLLEGE_STAFF'
  | 'VERIFIER'
  | 'STUDENT'
  | 'AUDITOR';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  college_id?: number | null;
  college_name?: string | null;
  apaar_id?: string | null;
  phone?: string | null;
  is_totp_enabled?: boolean;
}

export interface Student {
  id: number;
  apaar_id: string;
  name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  gender: string;
  category: string;
  aadhaar_last4: string;
  phone_masked: string;
  email: string;
  address: string;
  state: string;
  district: string;
  college_id: number;
  college_name?: string;
  course_name?: string;
  branch: string;
  admission_year: number;
  current_semester: number;
  cgpa: number;
  enrollment_no: string;
  status: 'Active' | 'Passed Out' | 'Dropped' | 'Transferred';
  photo_url?: string | null;
  verification_status: 'Verified' | 'Pending' | 'Flagged' | 'Rejected' | 'Expired';
  trust_score: number;
  risk_score: number;
  anomaly_reasons?: string;
  consent_status: string;
  created_at: string;
}

export interface AcademicRecord {
  id: number;
  semester: number;
  sgpa: number;
  cgpa: number;
  credits_earned: number;
  total_credits: number;
  backlogs: number;
  result_status: string;
  academic_year: string;
  exam_session: string;
}

export interface DocumentItem {
  id: number;
  doc_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface College {
  id: number;
  aicte_code: string;
  name: string;
  address: string;
  state: string;
  district: string;
  pin_code: string;
  accreditation: string;
  intake_capacity: number;
  compliance_score: number;
  verification_score: number;
  rag_rating?: 'GREEN' | 'AMBER' | 'RED';
  status: string;
  phone?: string;
  email?: string;
  website?: string;
  total_students?: number;
  verified_students?: number;
}

export interface Flag {
  id: number;
  student_id: number;
  student_name?: string;
  student_apaar?: string;
  college_id?: number;
  college_name?: string;
  flag_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'OPEN' | 'ESCALATED' | 'RESOLVED' | 'REOPENED';
  sla_deadline?: string;
  created_at: string;
  resolved_at?: string | null;
  comments_count?: number;
  comments?: Array<{
    id: number;
    user_name: string;
    comment: string;
    created_at: string;
  }>;
}

export interface DuplicateGroup {
  id: number;
  group_identifier: string;
  status: string;
  confidence_score: number;
  reasons: string[];
  primary_student?: any;
  secondary_student?: any;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_email: string;
  role: string;
  action: string;
  resource: string;
  resource_id?: string;
  ip_address: string;
  old_value?: string;
  new_value?: string;
  previous_hash: string;
  hash: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'ALERT' | 'VERIFICATION' | 'COMPLIANCE' | 'SYSTEM';
  timestamp: string;
  read: boolean;
}

export interface VerificationDifference {
  field: string;
  label: string;
  college_value: string;
  official_value: string;
  matches: boolean;
  similarity_score: number;
  resolution: string;
}

export type Language = 'en' | 'hi' | 'ta';
