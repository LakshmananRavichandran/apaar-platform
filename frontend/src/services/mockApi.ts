/**
 * APAAR Verify - Comprehensive High-Fidelity Mock Engine
 * Ensures 100% interactive, crash-proof operation for all screens on Vercel
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
    anomaly_reasons: JSON.stringify([
      'Sudden CGPA variance (+3.2 jumping in Sem 4)',
      'Duplicate enrollment detected at Gujarat Tech Univ'
    ]),
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
    anomaly_reasons: JSON.stringify([
      'Awaiting DigiLocker 12th Board certificate cryptographic handshake'
    ]),
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
      students: MOCK_STUDENTS,
      items: MOCK_STUDENTS,
      total: 5000,
      total_pages: 250,
      page: 1,
      size: 20
    };
  }

  // 5. Colleges
  if (cleanUrl.match(/\/colleges\/\d+\/reports/)) {
    return {
      compliance_score: 96,
      intake_compliance_pct: 98.2,
      branch_distribution: [
        { branch: 'Computer Science', count: 320 },
        { branch: 'Electronics', count: 280 },
        { branch: 'Mechanical', count: 240 }
      ]
    };
  }

  if (cleanUrl.match(/\/colleges\/\d+/)) {
    const id = parseInt(cleanUrl.split('/')[2]);
    return MOCK_COLLEGES.find(c => c.id === id) || MOCK_COLLEGES[0];
  }

  if (cleanUrl.startsWith('/colleges')) {
    return {
      colleges: MOCK_COLLEGES,
      items: MOCK_COLLEGES,
      total: 60,
      total_pages: 3,
      page: 1,
      size: 20
    };
  }

  // 6. Flags
  if (cleanUrl.match(/\/flags\/\d+/)) {
    const id = parseInt(cleanUrl.split('/')[2]);
    return MOCK_FLAGS.find(f => f.id === id) || MOCK_FLAGS[0];
  }

  if (cleanUrl.startsWith('/flags')) {
    return {
      flags: MOCK_FLAGS,
      items: MOCK_FLAGS,
      total: MOCK_FLAGS.length
    };
  }

  // 7. Duplicates
  const detailedDuplicateGroup = {
    id: 1,
    group_identifier: 'DUP-2026-0081',
    status: 'DETECTED',
    confidence_score: 96,
    reasons: ['Aadhaar Hash Collision', 'Simultaneous Active Semester Enrollment in 2 States'],
    primary_student: {
      id: 1,
      name: 'Rohan Vikram Mehta',
      apaar_id: '100000000089',
      college: 'Veermata Jijabai Technological Institute (VJTI)',
      branch: 'Information Tech.',
      state: 'Maharashtra',
      father_name: 'Vikram Mehta',
      mother_name: 'Rekha Mehta',
      dob: '2003-11-05',
      enrollment_no: '221080099',
      cgpa: 5.42
    },
    secondary_student: {
      id: 99,
      name: 'Rohan Mehta',
      apaar_id: '100000000999',
      college: 'Gujarat Technological University (GTU)',
      branch: 'Computer Engineering',
      state: 'Gujarat',
      father_name: 'Vikram Mehta',
      mother_name: 'Rekha Mehta',
      dob: '2003-11-05',
      enrollment_no: 'GTU-2022-771',
      cgpa: 8.65
    },
    created_at: '2026-09-12T14:22:00Z'
  };

  if (cleanUrl.match(/\/duplicates\/\d+/)) {
    return detailedDuplicateGroup;
  }

  if (cleanUrl.startsWith('/duplicates')) {
    return {
      groups: [detailedDuplicateGroup],
      total: 1
    };
  }

  // 8. Approvals (Transfers & Demographic Edits)
  if (cleanUrl.startsWith('/approvals/transfers')) {
    return [
      {
        id: 1,
        student_id: 1,
        student_name: 'Aarav Sharma',
        student_apaar: '100000000007',
        from_college: 'Veermata Jijabai Technological Institute (VJTI)',
        to_college: 'College of Engineering Pune (COEP)',
        reason: 'Parental relocation to Pune regional zone',
        from_approved: true,
        to_approved: true,
        aicte_approved: false,
        status: 'PENDING',
        created_at: '2026-10-14T09:30:00Z'
      }
    ];
  }

  if (cleanUrl.startsWith('/approvals/edit-requests')) {
    return [
      {
        id: 1,
        student_id: 2,
        student_name: 'Priya Anand Patel',
        student_apaar: '100000000014',
        college_id: 2,
        proposed_changes: { mother_name: 'Meena Anand Patel' },
        status: 'PENDING',
        review_notes: 'Spelling correction in mother name per 10th marksheet gazette',
        created_at: '2026-10-18T11:20:00Z'
      }
    ];
  }

  // 9. Uploads / Bulk History
  if (cleanUrl.startsWith('/uploads/history')) {
    return [
      {
        id: 104,
        filename: 'vjti_batch_2022_btech.csv',
        total_records: 480,
        success_count: 472,
        error_count: 8,
        status: 'COMPLETED',
        uploaded_at: '2026-09-20T14:00:00Z'
      },
      {
        id: 103,
        filename: 'coep_lateral_entry_2023.csv',
        total_records: 120,
        success_count: 120,
        error_count: 0,
        status: 'COMPLETED',
        uploaded_at: '2026-09-15T10:15:00Z'
      }
    ];
  }

  if (cleanUrl.startsWith('/uploads/preview')) {
    return {
      headers: ['name', 'apaar_id', 'dob', 'gender', 'branch', 'cgpa', 'enrollment_no'],
      rows: [
        ['Aarav Sharma', '100000000007', '2003-08-14', 'MALE', 'Computer Science', '9.15', '221080045'],
        ['Priya Patel', '100000000014', '2004-02-21', 'FEMALE', 'Electronics', '8.84', '221090012']
      ],
      total_rows: 2,
      suggested_mapping: {
        name: 'name',
        apaar_id: 'apaar_id',
        dob: 'dob',
        gender: 'gender',
        branch: 'branch',
        cgpa: 'cgpa',
        enrollment_no: 'enrollment_no'
      }
    };
  }

  if (cleanUrl.startsWith('/uploads/process')) {
    return {
      batch_id: 105,
      total_records: 2,
      success_count: 2,
      error_count: 0,
      errors: []
    };
  }

  // 10. Audit Trail & Cryptographic Chain: /audit
  if (cleanUrl.startsWith('/audit/verify-integrity')) {
    return {
      chain_valid: true,
      total_events_checked: 1089,
      merkle_root_hash: '3f786850e387550fdab836ed7e6dc881de23001b70e87038c01362214cb29588'
    };
  }

  if (cleanUrl.startsWith('/audit')) {
    return {
      logs: [
        {
          id: 1089,
          timestamp: '2026-10-30T11:45:00Z',
          user_email: 'superadmin@aicte.gov.in',
          role: 'SUPER_ADMIN',
          action: 'VERIFY_DOCUMENT_FORENSICS',
          resource: 'STUDENT',
          resource_id: '100000000007',
          new_value: 'Watermark Authentic (95.8%)',
          hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
        },
        {
          id: 1088,
          timestamp: '2026-10-30T10:12:00Z',
          user_email: 'officer@aicte.gov.in',
          role: 'AICTE_OFFICER',
          action: 'BATCH_DIGILOCKER_SYNC',
          resource: 'COLLEGE',
          resource_id: '1',
          new_value: 'Sync 480 Students Completed',
          hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
        }
      ],
      total: 2,
      total_pages: 1
    };
  }

  // 11. Student Portal: /student-portal/my-profile & /student-portal/consent-center
  if (cleanUrl.startsWith('/student-portal/my-profile')) {
    return {
      student: MOCK_STUDENTS[0],
      timeline: [
        { step: 'Aadhaar e-KYC Handshake', date: '15 Aug 2022', detail: 'UIDAI biometric OTP verified successfully' },
        { step: 'Marksheet Ledger Cryptographic Seal', date: '20 Jun 2023', detail: 'DigiLocker verifiable credential anchored' },
        { step: 'APAAR Permanent Identity Issued', date: '10 Jan 2024', detail: 'Permanent 12-digit APAAR ID 100000000007 generated' }
      ],
      academic_records: [
        { id: 1, semester: 1, sgpa: 8.90, cgpa: 8.90, credits_earned: 22, total_credits: 22, backlogs: 0, result_status: 'PASS', academic_year: '2022-23', exam_session: 'Winter 2022' },
        { id: 2, semester: 2, sgpa: 9.10, cgpa: 9.00, credits_earned: 24, total_credits: 24, backlogs: 0, result_status: 'PASS', academic_year: '2022-23', exam_session: 'Summer 2023' },
        { id: 3, semester: 3, sgpa: 9.25, cgpa: 9.08, credits_earned: 24, total_credits: 24, backlogs: 0, result_status: 'PASS', academic_year: '2023-24', exam_session: 'Winter 2023' },
        { id: 4, semester: 4, sgpa: 9.30, cgpa: 9.14, credits_earned: 26, total_credits: 26, backlogs: 0, result_status: 'PASS', academic_year: '2023-24', exam_session: 'Summer 2024' },
        { id: 5, semester: 5, sgpa: 9.18, cgpa: 9.15, credits_earned: 24, total_credits: 24, backlogs: 0, result_status: 'PASS', academic_year: '2024-25', exam_session: 'Winter 2024' }
      ]
    };
  }

  if (cleanUrl.startsWith('/student-portal/consent-center')) {
    return {
      pending_requests: [
        {
          id: 501,
          organization_name: 'Tata Consultancy Services (TCS) Campus Hiring',
          purpose: 'Final Placement Background Verification & CGPA Validation',
          requested_fields: ['Full Academic Transcript', 'Provisional Degree', 'APAAR Identity'],
          requested_at: '2026-10-25T14:30:00Z'
        }
      ],
      active_consents: [
        {
          id: 401,
          organization_name: 'State Bank of India (Education Loan Cell)',
          purpose: 'Interest Subsidy Verification under CSIS Scheme',
          granted_at: '2026-08-10T10:00:00Z',
          expires_at: '2027-08-10T10:00:00Z'
        }
      ],
      consent_history: []
    };
  }

  // 12. Verifier Portal: /verifier/api-keys & /verifier/usage-stats & /verifier/search
  if (cleanUrl.startsWith('/verifier/api-keys')) {
    return [
      {
        id: 1,
        organization_name: 'Tata Consultancy Services',
        key_preview: 'ap_live_9812********************3411',
        created_at: '2026-08-01T10:00:00Z',
        status: 'ACTIVE',
        requests_count: 1420
      }
    ];
  }

  if (cleanUrl.startsWith('/verifier/usage-stats')) {
    return {
      total_verifications: 1420,
      monthly_quota: 5000,
      remaining_quota: 3580,
      verified_rate: 98.4
    };
  }

  if (cleanUrl.startsWith('/verifier/search')) {
    return {
      student_id: 1,
      student_name: 'Aarav Sharma',
      apaar_id: '100000000007',
      college: 'Veermata Jijabai Technological Institute (VJTI)',
      status: 'Verified',
      consent_required: true
    };
  }

  // 13. Public Verify: /verification/public-verify
  if (cleanUrl.startsWith('/verification/public-verify')) {
    return {
      is_valid: true,
      student_name: 'Aarav Sharma',
      apaar_id: '100000000007',
      trust_score: 98,
      verification_code: 'APAAR-VERIFY-2026-7192-3819',
      college: 'Veermata Jijabai Technological Institute (VJTI)',
      course: 'B.Tech in Computer Engineering',
      verification_date: '2026-09-15',
      digilocker_verified: true,
      biometric_verified: true
    };
  }

  // 14. Verification Actions
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
      success: true,
      match: true,
      digilocker_status: 'AUTHENTICATED',
      certificate_found: true,
      issuer: 'Maharashtra State Board of Secondary and Higher Secondary Education',
      timestamp: new Date().toISOString(),
      differences: []
    };
  }

  if (cleanUrl.startsWith('/verification/run-nightly-verification')) {
    return {
      batch_id: 'BATCH-NIGHTLY-' + Date.now(),
      records_processed: 5000,
      anomalies_detected: 14,
      status: 'COMPLETED',
      message: 'Nightly verification completed across all 5,000 students.'
    };
  }

  // 15. System Health & Telemetry
  if (cleanUrl.startsWith('/system/health')) {
    return {
      status: 'HEALTHY',
      service: 'APAAR Verification Core',
      version: '2.4.0',
      database: {
        size_mb: 6.4,
        engine: 'SQLite WAL / Postgres',
        status: 'ONLINE'
      },
      background_queue: {
        active_workers: 4,
        jobs_in_queue: 0,
        status: 'ACTIVE'
      },
      digilocker_mock_gateway: {
        latency_ms: 24,
        rate_limit_rpm: 120,
        status: 'AUTHENTICATED'
      },
      activity_heatmap: [
        { day: 'Mon', verifications: 1420, uploads: 320, flags: 18 },
        { day: 'Tue', verifications: 1890, uploads: 410, flags: 24 },
        { day: 'Wed', verifications: 2350, uploads: 590, flags: 31 },
        { day: 'Thu', verifications: 2120, uploads: 480, flags: 22 },
        { day: 'Fri', verifications: 1980, uploads: 390, flags: 19 },
        { day: 'Sat', verifications: 840, uploads: 120, flags: 7 },
        { day: 'Sun', verifications: 420, uploads: 45, flags: 3 }
      ]
    };
  }

  if (cleanUrl.startsWith('/system/settings')) {
    return {
      automated_verification: true,
      anomaly_contamination_rate: 0.04,
      trust_score_pass_threshold: 80,
      auto_flag_age_mismatch: true,
      auto_flag_semester_drift: true,
      dpdp_act_enforce_masking: true,
      digilocker_sync_rate_limit: 120,
      audit_retention_days: 365,
      require_2fa_for_officers: true
    };
  }

  // 16. AI Assistant: /ai/ask or /ask-apaar
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
