import random
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.database import Base, engine, SessionLocal
from app.models.models import (
    User, UserRole, College, Department, Course, Student, AcademicRecord,
    Document, ApaarRecord, VerificationRequest, Flag, FlagComment,
    DuplicateGroup, AuditLog, Notification, ConsentRecord, ApiKey,
    SupportTicket, Announcement, StudentStatus, VerificationStatus, FlagSeverity, FlagStatus
)
from app.core.security import (
    get_password_hash, generate_apaar_check_digit, encrypt_field, mask_phone,
    compute_audit_hash, validate_apaar_id
)
from app.services.verification_engine import verification_engine

INDIAN_STATES_DATA = [
    {
        "state": "Maharashtra",
        "districts": ["Mumbai", "Pune", "Nagpur", "Nashik"],
        "colleges": [
            ("Veermata Jijabai Technological Institute (VJTI)", "1-1029381"),
            ("College of Engineering Pune (COEP)", "1-1029382"),
            ("Visvesvaraya National Institute of Technology", "1-1029383"),
            ("Sardar Patel Institute of Technology", "1-1029384")
        ]
    },
    {
        "state": "Tamil Nadu",
        "districts": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
        "colleges": [
            ("PSG College of Technology", "1-2029381"),
            ("College of Engineering, Guindy", "1-2029382"),
            ("Thiagarajar College of Engineering", "1-2029383"),
            ("Coimbatore Institute of Technology", "1-2029384")
        ]
    },
    {
        "state": "Karnataka",
        "districts": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"],
        "colleges": [
            ("R.V. College of Engineering (RVCE)", "1-3029381"),
            ("BMS College of Engineering", "1-3029382"),
            ("MS Ramaiah Institute of Technology", "1-3029383"),
            ("PES University College of Engineering", "1-3029384")
        ]
    },
    {
        "state": "Delhi",
        "districts": ["New Delhi", "North Delhi", "South Delhi", "West Delhi"],
        "colleges": [
            ("Delhi Technological University (DTU)", "1-4029381"),
            ("Netaji Subhas University of Technology (NSUT)", "1-4029382"),
            ("Indraprastha Institute of Information Technology", "1-4029383"),
            ("Maharaja Agrasen Institute of Technology", "1-4029384")
        ]
    },
    {
        "state": "Uttar Pradesh",
        "districts": ["Noida", "Kanpur", "Lucknow", "Varanasi"],
        "colleges": [
            ("Harcourt Butler Technical University", "1-5029381"),
            ("Institute of Engineering and Technology Lucknow", "1-5029382"),
            ("JSS Academy of Technical Education", "1-5029383"),
            ("Kamla Nehru Institute of Technology", "1-5029384")
        ]
    },
    {
        "state": "Telangana",
        "districts": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
        "colleges": [
            ("JNTU College of Engineering Hyderabad", "1-6029381"),
            ("Chaitanya Bharathi Institute of Technology", "1-6029382"),
            ("Vasavi College of Engineering", "1-6029383"),
            ("CVR College of Engineering", "1-6029384")
        ]
    },
    {
        "state": "West Bengal",
        "districts": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
        "colleges": [
            ("Jadavpur University Faculty of Engineering", "1-7029381"),
            ("Kalyani Government Engineering College", "1-7029382"),
            ("Heritage Institute of Technology", "1-7029383"),
            ("Institute of Engineering & Management (IEM)", "1-7029384")
        ]
    },
    {
        "state": "Gujarat",
        "districts": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
        "colleges": [
            ("L.D. College of Engineering", "1-8029381"),
            ("Nirma University Institute of Technology", "1-8029382"),
            ("Dharmsinh Desai University", "1-8029383"),
            ("Vishwakarma Government Engineering College", "1-8029384")
        ]
    },
    {
        "state": "Kerala",
        "districts": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
        "colleges": [
            ("College of Engineering Trivandrum (CET)", "1-9029381"),
            ("Government Engineering College Thrissur", "1-9029382"),
            ("Model Engineering College Kochi", "1-9029383"),
            ("TKM College of Engineering Kollam", "1-9029384")
        ]
    },
    {
        "state": "Rajasthan",
        "districts": ["Jaipur", "Jodhpur", "Kota", "Udaipur"],
        "colleges": [
            ("Malaviya National Institute of Technology", "1-1129381"),
            ("Engineering College Ajmer", "1-1129382"),
            ("MBM Engineering College Jodhpur", "1-1129383"),
            ("Swami Keshvanand Institute of Technology", "1-1129384")
        ]
    },
    {
        "state": "Madhya Pradesh",
        "districts": ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
        "colleges": [
            ("Shri Govindram Seksaria Institute (SGSITS)", "1-1229381"),
            ("Maulana Azad National Institute of Technology", "1-1229382"),
            ("Jabalpur Engineering College", "1-1229383"),
            ("Madhav Institute of Technology and Science", "1-1229384")
        ]
    },
    {
        "state": "Andhra Pradesh",
        "districts": ["Visakhapatnam", "Vijayawada", "Tirupati", "Guntur"],
        "colleges": [
            ("Andhra University College of Engineering", "1-1329381"),
            ("JNTU College of Engineering Kakinada", "1-1329382"),
            ("VR Siddhartha Engineering College", "1-1329383"),
            ("Gayatri Vidya Parishad College of Engineering", "1-1329384")
        ]
    },
    {
        "state": "Punjab",
        "districts": ["Ludhiana", "Amritsar", "Patiala", "Jalandhar"],
        "colleges": [
            ("Guru Nanak Dev Engineering College", "1-1429381"),
            ("Thapar Institute of Engineering & Technology", "1-1429382"),
            ("Dr. B.R. Ambedkar National Institute of Tech", "1-1429383"),
            ("Punjab Engineering College (PEC)", "1-1429384")
        ]
    },
    {
        "state": "Haryana",
        "districts": ["Gurugram", "Faridabad", "Kurukshetra", "Panipat"],
        "colleges": [
            ("National Institute of Technology Kurukshetra", "1-1529381"),
            ("JC Bose University of Science and Tech", "1-1529382"),
            ("Deenbandhu Chhotu Ram University", "1-1529383"),
            ("The NorthCap University Gurugram", "1-1529384")
        ]
    },
    {
        "state": "Bihar",
        "districts": ["Patna", "Muzaffarpur", "Bhagalpur", "Gaya"],
        "colleges": [
            ("National Institute of Technology Patna", "1-1629381"),
            ("Muzaffarpur Institute of Technology", "1-1629382"),
            ("Bhagalpur College of Engineering", "1-1629383"),
            ("Bakhtiyarpur College of Engineering", "1-1629384")
        ]
    }
]

FIRST_NAMES_MALE = [
    "Aarav", "Vihaan", "Aditya", "Rohan", "Kabir", "Arjun", "Reyansh", "Aryan", "Ishaan",
    "Dhruv", "Siddharth", "Pranav", "Dev", "Ananya", "Rishi", "Kartik", "Kunal", "Harsh",
    "Manish", "Gaurav", "Nikhil", "Rahul", "Amit", "Varun", "Vikram", "Yash", "Rajat"
]

FIRST_NAMES_FEMALE = [
    "Diya", "Saanvi", "Aanya", "Ananya", "Isha", "Riya", "Kavya", "Tanvi", "Aditi", "Pooja",
    "Neha", "Shreya", "Sneha", "Priya", "Anushka", "Meera", "Swati", "Divya", "Komal", "Simran",
    "Roshni", "Shruti", "Akanksha", "Bhavna", "Deepika", "Kriti", "Trisha"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Singh", "Gupta", "Reddy", "Nair", "Iyer", "Choudhury",
    "Deshmukh", "Kulkarni", "Joshi", "Bose", "Chatterjee", "Banerjee", "Mehta", "Shah",
    "Agarwal", "Rao", "Mishra", "Pandey", "Yadav", "Trivedi", "Menon", "Pillai", "Bhat"
]

BRANCHES = [
    "Computer Science & Engineering",
    "Information Technology",
    "Electronics & Communication Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical & Electronics Engineering"
]

def make_valid_apaar(base_seed: int) -> str:
    base = f"{base_seed:011d}"
    check = generate_apaar_check_digit(base)
    return base + check

def seed_database():
    # Ensure tables are created first
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if already seeded
    existing_students = db.query(Student).count()
    if existing_students >= 5000:
        print(f"Database already contains {existing_students} students. Skipping seed.")
        db.close()
        return

    print("Beginning database seed for APAAR Verify...")

    # 1. Seed 60 Colleges across 15 states first
    colleges_list = []
    college_id_counter = 1
    for state_info in INDIAN_STATES_DATA:
        state_name = state_info["state"]
        for idx, (c_name, aicte_code) in enumerate(state_info["colleges"]):
            district = state_info["districts"][idx % len(state_info["districts"])]
            comp_score = round(random.uniform(88.0, 99.5), 1)
            ver_score = round(random.uniform(85.0, 98.0), 1)
            col = College(
                id=college_id_counter,
                aicte_code=aicte_code,
                name=c_name,
                address=f"Campus Road, {district}, {state_name}",
                state=state_name,
                district=district,
                pin_code=f"{random.randint(400001, 700099)}",
                accreditation=random.choice(["NAAC A++", "NAAC A+", "NAAC A", "NBA Accredited"]),
                intake_capacity=random.choice([600, 840, 1020, 1200]),
                compliance_score=comp_score,
                verification_score=ver_score,
                status="Approved",
                phone=f"+91-{random.randint(20, 80)}-{random.randint(20000000, 99999999)}",
                email=f"info@{c_name.split()[0].lower()}.edu.in",
                website=f"https://www.{c_name.split()[0].lower()}.ac.in"
            )
            db.add(col)
            colleges_list.append(col)
            college_id_counter += 1
    db.commit()

    # Add standard departments & courses for each college
    for col in colleges_list:
        dept = Department(college_id=col.id, name="School of Engineering", code="ENG")
        db.add(dept)
        db.flush()
        for br in BRANCHES:
            c = Course(
                college_id=col.id,
                department_id=dept.id,
                name=f"B.Tech in {br}",
                branch=br,
                duration_years=4,
                degree_type="UG"
            )
            db.add(c)
    db.commit()

    # 2. Create Demo Users for all 8 Roles
    demo_users = [
        {
            "email": "superadmin@aicte.gov.in",
            "full_name": "Dr. Anil Sahasrabudhe (Super Admin)",
            "role": UserRole.SUPER_ADMIN.value,
            "password": "Admin@123"
        },
        {
            "email": "officer@aicte.gov.in",
            "full_name": "Smt. Mamta Rani Agarwal (AICTE Officer)",
            "role": UserRole.AICTE_OFFICER.value,
            "password": "Officer@123"
        },
        {
            "email": "regional.mumbai@aicte.gov.in",
            "full_name": "Shri R. K. Soni (Regional Officer - West)",
            "role": UserRole.REGIONAL_OFFICER.value,
            "password": "Regional@123"
        },
        {
            "email": "college.admin@vjti.ac.in",
            "full_name": "Prof. D. N. Patel (College Admin)",
            "role": UserRole.COLLEGE_ADMIN.value,
            "college_id": 1,
            "password": "College@123"
        },
        {
            "email": "staff.data@vjti.ac.in",
            "full_name": "Sunil Kamble (Data Entry Staff)",
            "role": UserRole.COLLEGE_STAFF.value,
            "college_id": 1,
            "password": "Staff@123"
        },
        {
            "email": "hr.verifier@tcs.com",
            "full_name": "Vikram Malhotra (Senior Verifier - TCS Talent)",
            "role": UserRole.VERIFIER.value,
            "password": "Verifier@123"
        },
        {
            "email": "student.aarav@student.aicte.gov.in",
            "full_name": "Aarav Sharma (Student)",
            "role": UserRole.STUDENT.value,
            "apaar_id": "100000000007",
            "password": "Student@123"
        },
        {
            "email": "auditor.cag@gov.in",
            "full_name": "R. Ramanathan (National CAG Auditor)",
            "role": UserRole.AUDITOR.value,
            "password": "Auditor@123"
        }
    ]

    for u in demo_users:
        user_rec = User(
            email=u["email"],
            password_hash=get_password_hash(u["password"]),
            full_name=u["full_name"],
            role=u["role"],
            college_id=u.get("college_id"),
            apaar_id=u.get("apaar_id"),
            phone="+91-9876543210",
            is_active=True
        )
        db.add(user_rec)
    db.commit()

    # 3. Seed 5,000 Students + Official DigiLocker records
    print("Generating 5,000 student records with academic performance and DigiLocker registry...")
    
    # Pre-reserve first student for demo student account
    demo_apaar = "100000000007"
    demo_student = Student(
        apaar_id=demo_apaar,
        name="Aarav Sharma",
        father_name="Rajesh Sharma",
        mother_name="Sunita Sharma",
        dob="2004-05-15",
        gender="Male",
        category="General",
        aadhaar_encrypted=encrypt_field("123456789012"),
        aadhaar_last4="9012",
        phone_encrypted=encrypt_field("9876543210"),
        phone_masked="+91-XXXXX-3210",
        email="aarav.sharma@student.aicte.gov.in",
        address="Flat 402, Green Avenue, Mumbai",
        state="Maharashtra",
        district="Mumbai",
        college_id=1,
        course_name="B.Tech in Computer Science & Engineering",
        branch="Computer Science & Engineering",
        admission_year=2022,
        id=1,
        current_semester=6,
        cgpa=8.95,
        enrollment_no="ENR2022VJTI001",
        status=StudentStatus.ACTIVE.value,
        verification_status=VerificationStatus.VERIFIED.value,
        trust_score=98.5,
        risk_score=1.5,
        anomaly_reasons="[]",
        consent_status="Granted"
    )
    db.add(demo_student)
    db.commit()
    
    # Official DigiLocker record for demo student
    db.add(ApaarRecord(
        apaar_id=demo_apaar,
        full_name="Aarav Sharma",
        dob="2004-05-15",
        gender="Male",
        father_name="Rajesh Sharma",
        mother_name="Sunita Sharma",
        aadhaar_last4="9012",
        state="Maharashtra",
        is_active=True
    ))

    # Academic records for demo student (6 semesters)
    for sem in range(1, 7):
        db.add(AcademicRecord(
            student_id=1,
            semester=sem,
            sgpa=round(8.5 + (sem * 0.1), 2),
            cgpa=round(8.6 + (sem * 0.05), 2),
            credits_earned=24,
            total_credits=24,
            backlogs=0,
            result_status="Pass",
            academic_year="2024-2025" if sem > 4 else "2023-2024",
            exam_session="May-June" if sem % 2 == 0 else "Nov-Dec"
        ))

    # Documents for demo student
    db.add(Document(
        student_id=1,
        doc_type="marksheet",
        file_name="Semester_5_GradeSheet.pdf",
        file_path="/uploads/docs/sem5_aarav.pdf",
        file_size=420100,
        mime_type="application/pdf",
        uploaded_by="Sunil Kamble"
    ))
    db.add(Document(
        student_id=1,
        doc_type="id_proof",
        file_name="Aadhaar_Verified_Card.pdf",
        file_path="/uploads/docs/aadhaar_aarav.pdf",
        file_size=312000,
        mime_type="application/pdf",
        uploaded_by="Sunil Kamble"
    ))

    # Generate remaining 4,999 students
    students_batch = []
    apaar_records_batch = []
    academic_batch = []
    
    # 150 Intentionally Bad / Flagged records indices
    # We will spread 150 anomalies across the dataset:
    # 30 invalid checksums
    # 30 age anomalies (<15 or >65)
    # 30 semester vs admission year mismatch
    # 30 name/DOB mismatch with DigiLocker
    # 30 duplicates
    bad_indices = set(range(50, 200))

    random.seed(1337)
    seen_apaar_records = {"100000000007"}
    
    for i in range(2, 5001):
        is_female = random.random() < 0.45
        gender = "Female" if is_female else "Male"
        first_name = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"
        father_name = f"{random.choice(FIRST_NAMES_MALE)} {last_name}"
        mother_name = f"{random.choice(FIRST_NAMES_FEMALE)} {last_name}"
        
        college = random.choice(colleges_list)
        branch = random.choice(BRANCHES)
        category = random.choice(["General", "OBC", "SC", "ST", "EWS"])
        
        adm_year = random.choice([2021, 2022, 2023, 2024, 2025])
        current_year = 2026
        elapsed = (current_year - adm_year) * 2
        semester = max(1, min(8, elapsed if elapsed > 0 else 1))

        # Default normal birth year: admission year - 18
        birth_year = adm_year - random.choice([18, 19])
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        dob = f"{birth_year:04d}-{birth_month:02d}-{birth_day:02d}"

        # APAAR ID Generation
        base_num = 10000000000 + i
        valid_apaar = make_valid_apaar(base_num)
        apaar_id = valid_apaar

        aadhaar_raw = f"{random.randint(100000000000, 999999999999)}"
        aadhaar_last4 = aadhaar_raw[-4:]
        phone_raw = f"9{random.randint(100000000, 999999999)}"

        cgpa = round(random.uniform(6.5, 9.8), 2)
        status = StudentStatus.ACTIVE.value
        verification_status = VerificationStatus.VERIFIED.value
        trust_score = round(random.uniform(88.0, 99.0), 1)
        risk_score = round(100.0 - trust_score, 1)
        reasons = []

        # Official record default values
        off_name = name
        off_dob = dob
        off_father = father_name

        # Inject 150 intentional anomalies
        if i in bad_indices:
            anomaly_type = i % 5
            if anomaly_type == 0:
                # Invalid Checksum
                # Invert last digit
                last_d = str((int(apaar_id[-1]) + 5) % 10)
                apaar_id = apaar_id[:-1] + last_d
                verification_status = VerificationStatus.REJECTED.value
                trust_score = 15.0
                risk_score = 85.0
                reasons.append("Invalid APAAR ID checksum (failed Luhn algorithm check)")
            elif anomaly_type == 1:
                # Age mismatch (underage 14 years old or overage 68 years old)
                if i % 2 == 0:
                    birth_year = adm_year - 14
                    reasons.append("Abnormal age at admission: 14 years (< 16 years)")
                else:
                    birth_year = adm_year - 68
                    reasons.append("Abnormal age at admission: 68 years (> 60 years)")
                dob = f"{birth_year:04d}-06-15"
                off_dob = dob
                verification_status = VerificationStatus.FLAGGED.value
                trust_score = 45.0
                risk_score = 55.0
            elif anomaly_type == 2:
                # Semester vs admission year impossible
                semester = 8
                adm_year = 2025 # Joined recently but in sem 8
                reasons.append("Current semester (8) is mathematically impossible for admission year (2025)")
                verification_status = VerificationStatus.FLAGGED.value
                trust_score = 40.0
                risk_score = 60.0
            elif anomaly_type == 3:
                # Name & DOB mismatch with DigiLocker registry
                off_name = f"Official_{first_name} {random.choice(LAST_NAMES)}"
                off_dob = f"{birth_year-1:04d}-01-01"
                reasons.append(f"Name mismatch with DigiLocker registry: '{name}' vs official '{off_name}'")
                verification_status = VerificationStatus.FLAGGED.value
                trust_score = 35.0
                risk_score = 65.0
            elif anomaly_type == 4:
                # Duplicate APAAR with another college
                apaar_id = "100000000007" # duplicates demo student!
                reasons.append("Duplicate APAAR ID detected in another student record (ID #1)")
                verification_status = VerificationStatus.REJECTED.value
                trust_score = 10.0
                risk_score = 90.0

        stu = Student(
            id=i,
            apaar_id=apaar_id,
            name=name,
            father_name=father_name,
            mother_name=mother_name,
            dob=dob,
            gender=gender,
            category=category,
            aadhaar_encrypted=encrypt_field(aadhaar_raw),
            aadhaar_last4=aadhaar_last4,
            phone_encrypted=encrypt_field(phone_raw),
            phone_masked=mask_phone(phone_raw),
            email=f"{first_name.lower()}.{last_name.lower()}{i}@college.edu.in",
            address=f"Plot {random.randint(1, 200)}, Sector {random.randint(1, 40)}, {college.district}",
            state=college.state,
            district=college.district,
            college_id=college.id,
            course_name=f"B.Tech in {branch}",
            branch=branch,
            admission_year=adm_year,
            current_semester=semester,
            cgpa=cgpa,
            enrollment_no=f"ENR{adm_year}{college.id:02d}{i:04d}",
            status=status,
            verification_status=verification_status,
            trust_score=trust_score,
            risk_score=risk_score,
            anomaly_reasons=json.dumps(reasons),
            consent_status="Granted"
        )
        students_batch.append(stu)

        # Official DigiLocker mock registry (only unique apaar_ids)
        if apaar_id not in seen_apaar_records:
            seen_apaar_records.add(apaar_id)
            apaar_records_batch.append(ApaarRecord(
                apaar_id=apaar_id,
                full_name=off_name,
                dob=off_dob,
                gender=gender,
                father_name=off_father,
                mother_name=mother_name,
                aadhaar_last4=aadhaar_last4,
                state=college.state,
                is_active=True
            ))

        # 3 Semesters of academic records per student
        for sem_idx in range(1, min(4, semester + 1)):
            academic_batch.append(AcademicRecord(
                student_id=i,
                semester=sem_idx,
                sgpa=round(min(10.0, max(4.0, cgpa + random.uniform(-0.4, 0.4))), 2),
                cgpa=round(cgpa, 2),
                credits_earned=22,
                total_credits=22,
                backlogs=0,
                result_status="Pass",
                academic_year=f"{adm_year + ((sem_idx-1)//2)}-{adm_year + ((sem_idx-1)//2) + 1}",
                exam_session="May-June" if sem_idx % 2 == 0 else "Nov-Dec"
            ))

        # Commit in chunks of 1000 for fast bulk insertion
        if len(students_batch) >= 1000:
            db.bulk_save_objects(students_batch)
            db.commit()
            db.bulk_save_objects(apaar_records_batch)
            db.bulk_save_objects(academic_batch)
            db.commit()
            students_batch = []
            apaar_records_batch = []
            academic_batch = []

    if students_batch:
        db.bulk_save_objects(students_batch)
        db.commit()
        db.bulk_save_objects(apaar_records_batch)
        db.bulk_save_objects(academic_batch)
        db.commit()

    # 4. Generate Flags for the flagged/rejected records
    print("Seeding active flags, comments, and duplicate groups...")
    flagged_students = db.query(Student).filter(
        Student.verification_status.in_([VerificationStatus.FLAGGED.value, VerificationStatus.REJECTED.value])
    ).limit(60).all()

    for idx, stu in enumerate(flagged_students):
        reasons_list = json.loads(stu.anomaly_reasons or "[]")
        flag_desc = reasons_list[0] if reasons_list else "Data inconsistency flagged by automated rule check."
        severity = FlagSeverity.CRITICAL.value if stu.verification_status == VerificationStatus.REJECTED.value else FlagSeverity.HIGH.value
        
        flag = Flag(
            student_id=stu.id,
            college_id=stu.college_id,
            flag_type="ANOMALY_DETECTED",
            severity=severity,
            description=flag_desc,
            status=FlagStatus.OPEN.value if idx % 3 != 0 else FlagStatus.ESCALATED.value,
            sla_deadline=datetime.now(timezone.utc) + timedelta(days=random.randint(1, 5)),
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 10))
        )
        db.add(flag)
        db.flush()

        # Add comment
        db.add(FlagComment(
            flag_id=flag.id,
            user_id=2, # Officer
            user_name="Smt. Mamta Rani Agarwal",
            comment=f"Automated verification engine raised discrepancy: '{flag_desc}'. Requested institutional explanation."
        ))

    # 5. Duplicate Groups
    db.add(DuplicateGroup(
        group_identifier="DUP-GRP-2026-001",
        status="DETECTED",
        confidence_score=98.5,
        reasons=json.dumps(["Identical APAAR ID detected in two different colleges", "High name similarity"]),
        primary_student_id=1,
        secondary_student_id=54 # one of the duplicate anomalies
    ))

    # 6. Sample Verification Requests from Employers (TCS, Infosys, SBI)
    ver_orgs = [
        ("Tata Consultancy Services", "Background check for Graduate Engineer Trainee 2026"),
        ("Infosys Limited", "Pre-onboarding academic credential verification"),
        ("State Bank of India", "Student Education Loan Subsidy Verification")
    ]
    for idx, (org, purpose) in enumerate(ver_orgs):
        db.add(VerificationRequest(
            request_code=f"VER-REQ-2026-00{idx+1}",
            student_id=1,
            requested_by_user_id=6, # Verifier
            organization_name=org,
            purpose=purpose,
            status="APPROVED" if idx == 0 else "PENDING",
            requested_fields="apaar_id,name,dob,college,course,cgpa",
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            responded_at=datetime.now(timezone.utc) if idx == 0 else None
        ))

    # 7. Sample Consent Records
    db.add(ConsentRecord(
        student_id=1,
        verifier_user_id=6,
        verifier_org="Tata Consultancy Services",
        fields_granted=json.dumps(["apaar_id", "name", "dob", "college", "course", "cgpa"]),
        status="ACTIVE",
        expires_at=datetime.now(timezone.utc) + timedelta(days=90)
    ))

    # 8. Sample Notifications
    notifications_data = [
        ("System Verification Completed", "National batch verification for 5,000 students completed with 97.2% overall accuracy.", "SYSTEM"),
        ("Action Required: 150 Discrepancies", "150 flagged and anomalous records require review across 15 states.", "ALERT"),
        ("Compliance Update", "AICTE Approval norms compliance window is open for academic session 2026-27.", "COMPLIANCE"),
        ("DigiLocker Gateway Status", "DigiLocker real-time sync gateway operating normally at 120 requests/minute.", "SYSTEM")
    ]
    for title, msg, cat in notifications_data:
        db.add(Notification(
            title=title,
            message=msg,
            category=cat,
            is_read=False
        ))

    # 9. Broadcast Announcements
    db.add(Announcement(
        title="Mandatory APAAR ID Integration Deadline Notice",
        content="All AICTE-approved colleges must ensure 100% student enrollment under the APAAR framework by November 30, 2026. Non-compliant institutions risk accreditation grading penalties.",
        target_role="ALL",
        target_state="ALL"
    ))
    db.add(Announcement(
        title="DPDP Act 2023 Digital Privacy Protocol Enacted",
        content="Strict purpose limitation and masking of sensitive Aadhaar / Contact identifiers is now enforced across all verification endpoints.",
        target_role="VERIFIER",
        target_state="ALL"
    ))

    # 10. Sample Support Tickets
    db.add(SupportTicket(
        ticket_number="TCK-2026-8901",
        student_id=1,
        college_id=1,
        reported_by_user_id=7, # Student
        subject="Discrepancy in Mother's Middle Name",
        category="Data Correction",
        priority="LOW",
        status="IN_PROGRESS"
    ))

    # 11. Initial Tamper-Evident Audit Log Hash Chain
    print("Generating tamper-evident cryptographic audit log chain...")
    prev_hash = "GENESIS_BLOCK_AICTE_APAAR"
    audit_events = [
        ("SYSTEM", "INITIALIZE", "DATABASE", "0", None, "System initialized with 60 colleges and 5,000 students"),
        ("SUPER_ADMIN", "CREATE_USER", "USER", "1", None, "Super Admin account created"),
        ("AICTE_OFFICER", "POLICY_UPDATE", "SETTING", "DPDP_ACT", "OLD_PRIVACY_V1", "DPDP_ACT_2023_COMPLIANCE_V2"),
        ("COLLEGE_ADMIN", "UPLOAD", "STUDENT_BATCH", "BATCH_01", None, "Bulk admission upload completed"),
        ("VERIFICATION_ENGINE", "VERIFY", "STUDENT", "1", "PENDING", "VERIFIED_TRUST_98.5")
    ]
    
    for idx, (role, action, res, res_id, old_v, new_v) in enumerate(audit_events):
        t_dt = datetime.now(timezone.utc) - timedelta(hours=10 - idx)
        h = compute_audit_hash(
            prev_hash=prev_hash,
            user_id=1,
            action=action,
            resource=res,
            resource_id=res_id,
            old_value=old_v,
            new_value=new_v,
            timestamp=t_dt.isoformat()
        )
        entry = AuditLog(
            user_id=1,
            user_email="superadmin@aicte.gov.in",
            role=role,
            action=action,
            resource=res,
            resource_id=res_id,
            ip_address="127.0.0.1",
            old_value=old_v,
            new_value=new_v,
            previous_hash=prev_hash,
            hash=h,
            timestamp_str=t_dt.isoformat(),
            timestamp=t_dt
        )
        db.add(entry)
        prev_hash = h

    db.commit()
    print("Database seed completed successfully! 60 colleges, 5,000 students, demo users, flags, and audit chain are ready.")
    db.close()

if __name__ == "__main__":
    seed_database()
