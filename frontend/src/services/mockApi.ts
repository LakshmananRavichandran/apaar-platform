/**
 * APAAR Verify - Comprehensive Mock Engine for Standalone Vercel Previews
 * Automatically provides high-fidelity simulated responses when backend is offline
 */

import { Student, College, Flag, UserRole } from '../types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: 1,
    apaar_id: '100000000007',
    name: 'Aarav Sharma',
    father_name: 'Rajesh Sharma',
    mother_name: 'Sunita Sharma',
    dob: '2003-08-14',
    gender: 'MALE',
    category: 'GENERAL',
    aadhaar_last4: '4892',
    phone_masked: '+91 98****1234',
    email: 'student.aarav@student.aicte.gov.in',
    address: 'Flat 402, Shanti Vihar, Dadar West',
    state: 'Maharashtra',
    district: 'Mumbai City',
    college_id: 1,
    college_name: 'Veermata Jijabai Technological Institute (VJTI)',
    course_name: 'B.Tech in Computer Engineering',
    branch: 'Computer Science',
    admission_year: 2022,
    current_semester: 6,
    cgpa: 9.15,
    enrollment_no: '221080045',
    status: 'Active',
    photo_url: null,
    verification_status: 'Verified',
    trust_score: 98,
    risk_score: 2,
    anomaly_reasons: undefined,
    consent_status: 'GRANTED',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    apaar_id: '100000000014',
    name: 'Priya Anand Patel',
    father_name: 'Anand Patel',
    mother_name: 'Meena Patel',
    dob: '2004-02-21',
    gender: 'FEMALE',
    category: 'OBC',
    aadhaar_last4: '9012',
    phone_masked: '+91 97****5678',
    email: 'priya.patel@student.aicte.gov.in',
    address: '12 Green Park Society, Shivajinagar',
    state: 'Maharashtra',
    district: 'Pune',
    college_id: 2,
    college_name: 'College of Engineering Pune (COEP)',
    course_name: 'B.Tech in Electronics & Telecommunication',
    branch: 'Electronics & Comm.',
    admission_year: 2022,
    current_semester: 6,
    cgpa: 8.84,
    enrollment_no: '221090012',
    status: 'Active',
    photo_url: null,
    verification_status: 'Verified',
    trust_score: 95,
    risk_score: 5,
    anomaly_reasons: undefined,
    consent_status: 'GRANTED',
    created_at: '2024-01-16T11:00:00Z'
  },
  {
    id: 3,
    apaar_id: '100000000089',
    name: 'Rohan Vikram Mehta',
    father_name: 'Vikram Mehta',
    mother_name: 'Rekha Mehta',
    dob: '2003-11-05',
    gender: 'MALE',
    category: 'GENERAL',
    aadhaar_last4: '3411',
    phone_masked: '+91 94****9901',
    email: 'rohan.mehta@student.aicte.gov.in',
    address: 'Plot 88, Sector 17, Vashi',
    state: 'Maharashtra',
    district: 'Thane',
    college_id: 1,
    college_name: 'Veermata Jijabai Technological Institute (VJTI)',
    course_name: 'B.Tech in Information Technology',
    branch: 'Information Tech.',
    admission_year: 2022,
    current_semester: 6,
    cgpa: 5.42,
    enrollment_no: '221080099',
    status: 'Active',
    photo_url: null,
    verification_status: 'Flagged',
    trust_score: 41,
    risk_score: 59,
    anomaly_reasons: 'Sudden CGPA variance (+3.2 jumping in Sem 4) and duplicate enrollment detected at Gujarat Tech Univ.',
    consent_status: 'PENDING',
    created_at: '2024-02-01T09:15:00Z'
  },
  {
    id: 4,
    apaar_id: '100000000102',
    name: 'Ananya S. Iyer',
    father_name: 'Suresh Iyer',
    mother_name: 'Lakshmi Iyer',
    dob: '2003-05-19',
    gender: 'FEMALE',
    category: 'GENERAL',
    aadhaar_last4: '6618',
    phone_masked: '+91 91****3344',
    email: 'ananya.iyer@student.aicte.gov.in',
    address: '45 Lake View Road, Indiranagar',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    college_id: 3,
    college_name: 'BMS College of Engineering, Bengaluru',
    course_name: 'B.Tech in Artificial Intelligence',
    branch: 'AI & Data Science',
    admission_year: 2023,
    current_semester: 4,
    cgpa: 9.68,
    enrollment_no: '23AI0041',
    status: 'Active',
    photo_url: null,
    verification_status: 'Verified',
    trust_score: 99,
    risk_score: 1,
    anomaly_reasons: undefined,
    consent_status: 'GRANTED',
    created_at: '2024-02-10T14:20:00Z'
  },
  {
    id: 5,
    apaar_id: '100000000215',
    name: 'Kavita Suresh Deshmukh',
    father_name: 'Suresh Deshmukh',
    mother_name: 'Vandana Deshmukh',
    dob: '2002-12-30',
    gender: 'FEMALE',
    category: 'SC',
    aadhaar_last4: '7722',
    phone_masked: '+91 93****8811',
    email: 'kavita.deshmukh@student.aicte.gov.in',
    address: 'Ramdas Peth, Nagpur',
    state: 'Maharashtra',
    district: 'Nagpur',
    college_id: 4,
    college_name: 'Visvesvaraya National Institute of Technology (VNIT)',
    course_name: 'B.Tech in Mechanical Engineering',
    branch: 'Mechanical',
    admission_year: 2021,
    current_semester: 8,
    cgpa: 8.12,
    enrollment_no: '21ME0087',
    status: 'Active',
    photo_url: null,
    verification_status: 'Pending',
    trust_score: 72,
    risk_score: 28,
    anomaly_reasons: 'Awaiting DigiLocker 12th Board certificate cryptographic handshake',
    consent_status: 'PENDING',
    created_at: '2024-03-01T12:00:00Z'
  }
];

export const MOCK_COLLEGES: College[] = [
  {
    id: 1,
    aicte_code: '1-10293847',
    name: 'Veermata Jijabai Technological Institute (VJTI)',
    address: 'H. R. Mahajani Marg, Matunga, Mumbai',
    state: 'Maharashtra',
    district: 'Mumbai',
    pin_code: '400019',
    accreditation: 'NAAC A+ (NBA Accredited)',
    intake_capacity: 1200,
    compliance_score: 96,
    verification_score: 94,
    rag_rating: 'GREEN',
    status: 'Approved',
    phone: '+91 22 2419 8100',
    email: 'principal@vjti.ac.in',
    website: 'https://vjti.ac.in',
    total_students: 1140,
    verified_students: 1080
  },
  {
    id: 2,
    aicte_code: '1-10928374',
    name: 'College of Engineering Pune (COEP Tech)',
    address: 'Wellesley Rd, Shivajinagar, Pune',
    state: 'Maharashtra',
    district: 'Pune',
    pin_code: '411005',
    accreditation: 'NAAC A++ (NBA Tier-1)',
    intake_capacity: 1400,
    compliance_score: 98,
    verification_score: 96,
    rag_rating: 'GREEN',
    status: 'Approved',
    phone: '+91 20 2550 7000',
    email: 'admin@coep.ac.in',
    website: 'https://coep.org.in',
    total_students: 1350,
    verified_students: 1290
  },
  {
    id: 3,
    aicte_code: '1-33829102',
    name: 'BMS College of Engineering',
    address: 'Bull Temple Rd, Basavanagudi, Bengaluru',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    pin_code: '560019',
    accreditation: 'NAAC A++ (NBA Accredited)',
    intake_capacity: 1500,
    compliance_score: 92,
    verification_score: 90,
    rag_rating: 'GREEN',
    status: 'Approved',
    phone: '+91 80 2662 2130',
    email: 'principal@bmsce.ac.in',
    website: 'https://bmsce.ac.in',
    total_students: 1420,
    verified_students: 1310
  },
  {
    id: 4,
    aicte_code: '1-99882211',
    name: 'Apex Institute of Advanced Technology',
    address: 'Near Highway Bypass, Zone 4',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    pin_code: '226010',
    accreditation: 'Under Review',
    intake_capacity: 600,
    compliance_score: 54,
    verification_score: 48,
    rag_rating: 'RED',
    status: 'Warning Issued',
    phone: '+91 522 998811',
    email: 'info@apexiat.edu.in',
    website: 'https://apexiat.example.edu.in',
    total_students: 580,
    verified_students: 210
  }
];

export const MOCK_NATIONAL_DASHBOARD = {
  metrics: {
    total_students: 5000,
    verified: 4120,
    pending: 580,
    flagged: 245,
    rejected: 55,
    total_colleges: 60,
    verification_rate: 82.4,
    high_risk_colleges: 4
  },
  state_stats: [
    { state: 'Maharashtra', total: 1250, verified: 1040, pending: 150, flagged: 60 },
    { state: 'Karnataka', total: 980, verified: 820, pending: 110, flagged: 50 },
    { state: 'Tamil Nadu', total: 890, verified: 750, pending: 100, flagged: 40 },
    { state: 'Delhi', total: 640, verified: 550, pending: 65, flagged: 25 },
    { state: 'Uttar Pradesh', total: 520, verified: 410, pending: 80, flagged: 30 },
    { state: 'Gujarat', total: 420, verified: 350, pending: 50, flagged: 20 },
    { state: 'Telangana', total: 300, verified: 200, pending: 25, flagged: 20 }
  ],
  funnel: [
    { stage: 'Data Ingested', count: 5000 },
    { stage: 'Aadhaar Matched', count: 4850 },
    { stage: 'Academic Validated', count: 4420 },
    { stage: 'DigiLocker Verified', count: 4120 }
  ],
  monthly_trend: [
    { month: 'May 2026', verified: 380, flagged: 22 },
    { month: 'Jun 2026', verified: 620, flagged: 35 },
    { month: 'Jul 2026', verified: 940, flagged: 58 },
    { month: 'Aug 2026', verified: 1150, flagged: 64 },
    { month: 'Sep 2026', verified: 1030, flagged: 41 }
  ],
  gender_ratio: [
    { name: 'Male', value: 3100 },
    { name: 'Female', value: 1850 },
    { name: 'Other', value: 50 }
  ],
  category_breakdown: [
    { name: 'General', count: 2100 },
    { name: 'OBC', count: 1650 },
    { name: 'SC', count: 750 },
    { name: 'ST', count: 350 },
    { name: 'EWS', count: 150 }
  ],
  branch_breakdown: [
    { branch: 'Computer Science', count: 1600 },
    { branch: 'Electronics & Comm.', count: 1100 },
    { branch: 'Mechanical', count: 850 },
    { branch: 'Civil', count: 650 },
    { branch: 'Information Tech.', count: 500 },
    { branch: 'AI & Data Science', count: 300 }
  ]
};

export const MOCK_FLAGS: Flag[] = [
  {
    id: 1,
    student_id: 3,
    student_name: 'Rohan Vikram Mehta',
    student_apaar: '100000000089',
    flag_type: 'DUPLICATE_ENROLLMENT',
    severity: 'CRITICAL',
    status: 'OPEN',
    college_id: 1,
    college_name: 'Veermata Jijabai Technological Institute (VJTI)',
    created_at: '2026-09-12T14:22:00Z',
    description: 'Student enrolled simultaneously at VJTI Mumbai and GTU Ahmedabad under identical Aadhaar hash.',
    comments_count: 2
  },
  {
    id: 2,
    student_id: 5,
    student_name: 'Kavita Suresh Deshmukh',
    student_apaar: '100000000215',
    flag_type: 'DIGILOCKER_SEAL_MISMATCH',
    severity: 'MEDIUM',
    status: 'ESCALATED',
    college_id: 4,
    college_name: 'Visvesvaraya National Institute of Technology (VNIT)',
    created_at: '2026-09-18T10:11:00Z',
    description: '12th Board marksheet cryptographic signature mismatch between state board database and DigiLocker XML.',
    comments_count: 1
  }
];

export const MOCK_DUPLICATES = [
  {
    id: 1,
    group_id: 'DUP-2026-0081',
    status: 'INVESTIGATING',
    match_score: 96.5,
    primary_student: MOCK_STUDENTS[2],
    matched_students: [
      {
        id: 99,
        apaar_id: '100000000999',
        name: 'Rohan Mehta',
        father_name: 'Vikram Mehta',
        college_name: 'Gujarat Technological University',
        state: 'Gujarat',
        enrollment_no: 'GTU-2022-771',
        aadhaar_last4: '3411'
      }
    ]
  }
];

export function handleMockRoute(url: string, method: string = 'GET', data?: any): any {
  const cleanUrl = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1/, '');

  // 1. Auth: /auth/login
  if (cleanUrl.startsWith('/auth/login')) {
    const email = data?.email || 'superadmin@aicte.gov.in';
    let role: UserRole = 'SUPER_ADMIN';
    let name = 'Dr. Ramesh Pokhriyal (Super Admin)';
    let collegeName: string | undefined = undefined;

    if (email.includes('officer')) {
      role = 'AICTE_OFFICER';
      name = 'Prof. Anil Sahasrabudhe (AICTE Officer)';
    } else if (email.includes('regional')) {
      role = 'REGIONAL_OFFICER';
      name = 'Dr. S. K. Mahajan (Regional Officer)';
    } else if (email.includes('college.admin')) {
      role = 'COLLEGE_ADMIN';
      name = 'Dr. Dhiren Patel (College Admin)';
      collegeName = 'Veermata Jijabai Technological Institute (VJTI)';
    } else if (email.includes('staff')) {
      role = 'COLLEGE_STAFF';
      name = 'Sunil Shinde (College Staff)';
      collegeName = 'Veermata Jijabai Technological Institute (VJTI)';
    } else if (email.includes('verifier') || email.includes('tcs')) {
      role = 'VERIFIER';
      name = 'Priya Sharma (HR Verifier - TCS)';
    } else if (email.includes('student')) {
      role = 'STUDENT';
      name = 'Aarav Sharma (Student)';
    } else if (email.includes('auditor')) {
      role = 'AUDITOR';
      name = 'K. Venkataraman (Auditor - CAG)';
    }

    return {
      access_token: 'demo_token_' + Date.now(),
      refresh_token: 'demo_refresh_' + Date.now(),
      token_type: 'bearer',
      user: {
        id: 1,
        email,
        full_name: name,
        role,
        college_id: collegeName ? 1 : null,
        college_name: collegeName,
        apaar_id: role === 'STUDENT' ? '100000000007' : null,
        is_totp_enabled: false
      }
    };
  }

  // 2. National Dashboard: /reports/national-dashboard
  if (cleanUrl.startsWith('/reports/national-dashboard')) {
    return MOCK_NATIONAL_DASHBOARD;
  }

  // 3. Document Authenticity Forensics: /verification/analyze-document-authenticity
  if (cleanUrl.startsWith('/verification/analyze-document-authenticity')) {
    // Check if formData contains tampered filename
    let isTampered = false;
    if (data instanceof FormData) {
      const file = data.get('file') as File;
      if (file && (file.name.toLowerCase().includes('tamper') || file.name.toLowerCase().includes('fake'))) {
        isTampered = true;
      }
    }

    if (isTampered) {
      return {
        tampering_detected: true,
        authenticity_score: 28.4,
        verdict: 'TAMPERED / SUSPICIOUS',
        ela_compression_variance: 42.8,
        watermark_fourier_density: 12.1,
        hologram_diffraction_index: 0.18,
        registry_cross_check: 'FAILED - Cryptographic seal mismatch against AICTE registry hash',
        extracted_apaar_id: '100000000007',
        audit_id: 'AUD-VERCEL-TAMPER-' + Math.floor(Math.random() * 9000 + 1000),
        explanation: 'Error Level Analysis (ELA) detected 42.8% high-noise anomaly in CGPA and signature bounding boxes. Optical Holographic diffraction index (0.18) falls below authentic threshold (0.45).'
      };
    } else {
      return {
        tampering_detected: false,
        authenticity_score: 95.8,
        verdict: 'GENUINE & CERTIFIED',
        ela_compression_variance: 4.2,
        watermark_fourier_density: 88.5,
        hologram_diffraction_index: 0.89,
        registry_cross_check: 'PASSED - Digital watermark and cryptographic seal matched against AICTE Central Registry hash',
        extracted_apaar_id: '100000000007',
        audit_id: 'AUD-VERCEL-GENUINE-' + Math.floor(Math.random() * 9000 + 1000),
        explanation: 'Document shows uniform compression variance across text layers. 2D Fourier spectrum confirms valid high-frequency micro-text watermark. Hologram reflects full multi-spectral diffraction pattern.'
      };
    }
  }

  // 4. Students
  if (cleanUrl.startsWith('/students/')) {
    const id = parseInt(cleanUrl.split('/')[2]);
    const student = MOCK_STUDENTS.find(s => s.id === id) || MOCK_STUDENTS[0];
    return {
      ...student,
      academic_records: [
        { id: 1, semester: 1, sgpa: 8.90, cgpa: 8.90, credits_earned: 22, total_credits: 22, backlogs: 0, result_status: 'PASS', academic_year: '2022-23', exam_session: 'Winter 2022' },
        { id: 2, semester: 2, sgpa: 9.10, cgpa: 9.00, credits_earned: 24, total_credits: 24, backlogs: 0, result_status: 'PASS', academic_year: '2022-23', exam_session: 'Summer 2023' },
        { id: 3, semester: 3, sgpa: 9.25, cgpa: 9.08, credits_earned: 24, total_credits: 24, backlogs: 0, result_status: 'PASS', academic_year: '2023-24', exam_session: 'Winter 2023' },
        { id: 4, semester: 4, sgpa: 9.30, cgpa: 9.14, credits_earned: 26, total_credits: 26, backlogs: 0, result_status: 'PASS', academic_year: '2023-24', exam_session: 'Summer 2024' },
        { id: 5, semester: 5, sgpa: 9.18, cgpa: 9.15, credits_earned: 24, total_credits: 24, backlogs: 0, result_status: 'PASS', academic_year: '2024-25', exam_session: 'Winter 2024' }
      ],
      documents: [
        { id: 1, doc_type: 'MARKSHEET_SEM_5', file_name: 'Marksheet_Sem5_Verified.pdf', file_path: '/docs/sem5.pdf', file_size: 245000, mime_type: 'application/pdf', uploaded_at: '2025-01-10T10:00:00Z' },
        { id: 2, doc_type: 'AADHAAR_XML', file_name: 'eAadhaar_Offline_XML.pdf', file_path: '/docs/aadhaar.pdf', file_size: 180000, mime_type: 'application/pdf', uploaded_at: '2024-01-15T10:30:00Z' }
      ]
    };
  }

  if (cleanUrl.startsWith('/students')) {
    return {
      items: MOCK_STUDENTS,
      total: 5000,
      page: 1,
      size: 20,
      pages: 250
    };
  }

  // 5. Colleges
  if (cleanUrl.startsWith('/colleges')) {
    return {
      items: MOCK_COLLEGES,
      total: 60,
      page: 1,
      size: 20
    };
  }

  // 6. Flags
  if (cleanUrl.startsWith('/flags')) {
    return {
      items: MOCK_FLAGS,
      total: MOCK_FLAGS.length
    };
  }

  // 7. Duplicates
  if (cleanUrl.startsWith('/duplicates')) {
    return {
      groups: MOCK_DUPLICATES,
      total: MOCK_DUPLICATES.length
    };
  }

  // 8. Verification Actions
  if (cleanUrl.startsWith('/verification/verify-student')) {
    return {
      success: true,
      message: 'Student APAAR verification successfully completed with 98.4% confidence score.',
      status: 'Verified',
      trust_score: 98
    };
  }

  if (cleanUrl.startsWith('/verification/digilocker-sync')) {
    return {
      synced: true,
      match: true,
      digilocker_status: 'AUTHENTICATED',
      certificate_found: true,
      issuer: 'Maharashtra State Board of Secondary and Higher Secondary Education',
      timestamp: new Date().toISOString()
    };
  }

  if (cleanUrl.startsWith('/verification/run-nightly-verification')) {
    return {
      batch_id: 'BATCH-NIGHTLY-' + Date.now(),
      records_processed: 5000,
      anomalies_detected: 14,
      status: 'COMPLETED'
    };
  }

  // 9. System Health
  if (cleanUrl.startsWith('/system/health')) {
    return {
      status: 'HEALTHY',
      service: 'APAAR Verification Core',
      version: '2.4.0',
      database: 'ONLINE (SQLite WAL Monitored)',
      ml_detector: 'ONLINE (IsolationForest + Fourier Watermark Forensics)',
      active_sessions: 42,
      latency_ms: 18
    };
  }

  if (cleanUrl.startsWith('/system/settings')) {
    return {
      automated_verification: true,
      fraud_threshold: 0.75,
      digilocker_sync: true,
      audit_retention_days: 365,
      require_2fa_for_officers: true
    };
  }

  // 10. AI Assistant: /ai/ask or /ask-apaar
  if (cleanUrl.startsWith('/ai/ask') || cleanUrl.startsWith('/ask-apaar')) {
    return {
      reply: 'APAAR Verify AI Assistant: AICTE National database contains 5,000 enrolled students across 60 accredited colleges. 82.4% are fully verified via DigiLocker and biometric Aadhaar hashes. Document Forensics confirms all micro-text watermarks and holographic seals are verified in real time.'
    };
  }

  // Default fallback for any other GET/POST
  return {
    status: 'success',
    mode: 'mock_preview_fallback',
    message: 'Data successfully processed via standalone demo preview engine.'
  };
}
