import json
from datetime import datetime, timezone
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session

from app.models.models import (
    Student, Flag, FlagSeverity, FlagStatus, VerificationResult,
    VerificationStatus, ApaarRecord
)
from app.core.security import validate_apaar_id

def calculate_levenshtein(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return calculate_levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def name_similarity_ratio(name1: str, name2: str) -> float:
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    if n1 == n2:
        return 1.0
    dist = calculate_levenshtein(n1, n2)
    max_len = max(len(n1), len(n2))
    if max_len == 0:
        return 1.0
    return max(0.0, 1.0 - (dist / max_len))

class VerificationEngine:
    def __init__(self):
        # Isolation Forest baseline for academic anomaly detection
        # Features: [age_at_admission, admission_year, current_semester, cgpa]
        # Train on a synthetic reasonable cohort
        np.random.seed(42)
        normal_age = np.random.normal(18.5, 1.2, 500)
        normal_adm = np.random.choice([2021, 2022, 2023, 2024, 2025], 500)
        normal_sem = np.random.randint(1, 9, 500)
        normal_cgpa = np.random.normal(7.8, 1.1, 500).clip(4.0, 10.0)
        
        X_train = np.column_stack([normal_age, normal_adm, normal_sem, normal_cgpa])
        self.iso_forest = IsolationForest(contamination=0.04, random_state=42)
        self.iso_forest.fit(X_train)

    def run_all_checks(self, student: Student, db: Session) -> Dict[str, Any]:
        """
        Executes rule-based checks, fuzzy matching, anomaly detection,
        and computes risk score + trust score.
        """
        reasons: List[str] = []
        rule_results: Dict[str, bool] = {}
        flags_to_create: List[Dict[str, Any]] = []
        
        # 1. APAAR Checksum & Format Check
        apaar_valid = validate_apaar_id(student.apaar_id)
        rule_results["checksum_valid"] = apaar_valid
        if not apaar_valid:
            reasons.append("Invalid APAAR ID checksum (failed Luhn algorithm check)")
            flags_to_create.append({
                "type": "CHECKSUM_FAIL",
                "severity": FlagSeverity.CRITICAL.value,
                "desc": f"APAAR ID {student.apaar_id} failed checksum validation."
            })

        # 2. DOB and Age Validation
        current_year = datetime.now().year
        birth_year = current_year - 20
        try:
            dob_parts = student.dob.split("-")
            birth_year = int(dob_parts[0])
            age_at_admission = student.admission_year - birth_year
            
            if age_at_admission < 16:
                reasons.append(f"Abnormal age at admission: {age_at_admission} years (< 16 years)")
                rule_results["age_valid"] = False
                flags_to_create.append({
                    "type": "AGE_MISMATCH",
                    "severity": FlagSeverity.HIGH.value,
                    "desc": f"Student age at admission was {age_at_admission} years, which violates AICTE minimum age norms."
                })
            elif age_at_admission > 60:
                reasons.append(f"Abnormal age at admission: {age_at_admission} years (> 60 years)")
                rule_results["age_valid"] = False
                flags_to_create.append({
                    "type": "AGE_MISMATCH",
                    "severity": FlagSeverity.MEDIUM.value,
                    "desc": f"Student age at admission was {age_at_admission} years, requiring verification."
                })
            else:
                rule_results["age_valid"] = True
        except Exception:
            rule_results["age_valid"] = False
            reasons.append("Invalid DOB format (expected YYYY-MM-DD)")

        # 3. CGPA Range Check
        if student.cgpa < 0.0 or student.cgpa > 10.0:
            rule_results["cgpa_valid"] = False
            reasons.append(f"Impossible CGPA {student.cgpa} (must be between 0.0 and 10.0)")
            flags_to_create.append({
                "type": "DATA_ANOMALY",
                "severity": FlagSeverity.HIGH.value,
                "desc": f"CGPA value {student.cgpa} is outside valid 0.0-10.0 scale."
            })
        else:
            rule_results["cgpa_valid"] = True

        # 4. Semester vs Admission Year Consistency
        max_possible_sem = (current_year - student.admission_year + 1) * 2
        if student.current_semester > max_possible_sem + 2:
            rule_results["semester_valid"] = False
            reasons.append(f"Current semester ({student.current_semester}) is mathematically impossible for admission year ({student.admission_year})")
            flags_to_create.append({
                "type": "SEMESTER_MISMATCH",
                "severity": FlagSeverity.HIGH.value,
                "desc": f"Semester {student.current_semester} exceeds elapsed academic terms for admission year {student.admission_year}."
            })
        else:
            rule_results["semester_valid"] = True

        # 5. Duplicate APAAR ID Check across other colleges
        dup_apaar = db.query(Student).filter(
            Student.apaar_id == student.apaar_id,
            Student.id != student.id,
            Student.is_deleted == False
        ).first()
        if dup_apaar:
            rule_results["unique_apaar"] = False
            reasons.append(f"Duplicate APAAR ID detected in another student record (ID #{dup_apaar.id}, College #{dup_apaar.college_id})")
            flags_to_create.append({
                "type": "DUPLICATE_ID",
                "severity": FlagSeverity.CRITICAL.value,
                "desc": f"Same APAAR ID {student.apaar_id} is registered at another institution."
            })
        else:
            rule_results["unique_apaar"] = True

        # 6. Cross-Match against APAAR / DigiLocker Registry
        apaar_official = db.query(ApaarRecord).filter(ApaarRecord.apaar_id == student.apaar_id).first()
        if apaar_official:
            rule_results["digilocker_found"] = True
            sim = name_similarity_ratio(student.name, apaar_official.full_name)
            if sim < 0.8:
                reasons.append(f"Name mismatch with DigiLocker registry: '{student.name}' vs official '{apaar_official.full_name}' (similarity {int(sim*100)}%)")
                flags_to_create.append({
                    "type": "NAME_MISMATCH",
                    "severity": FlagSeverity.HIGH.value,
                    "desc": f"Name mismatch with official DigiLocker APAAR record ({int(sim*100)}% match)."
                })
            
            if student.dob != apaar_official.dob:
                reasons.append(f"DOB mismatch with DigiLocker: '{student.dob}' vs official '{apaar_official.dob}'")
                flags_to_create.append({
                    "type": "DOB_MISMATCH",
                    "severity": FlagSeverity.HIGH.value,
                    "desc": f"Date of Birth '{student.dob}' does not match official registry '{apaar_official.dob}'."
                })
        else:
            rule_results["digilocker_found"] = False

        # 7. Scikit-Learn Anomaly Detection (Isolation Forest)
        age_feature = max(15, min(70, current_year - birth_year))
        adm_feature = max(2015, min(2027, student.admission_year))
        sem_feature = max(1, min(12, student.current_semester))
        cgpa_feature = max(0.0, min(10.0, student.cgpa))
        
        sample = np.array([[age_feature, adm_feature, sem_feature, cgpa_feature]])
        score = self.iso_forest.decision_function(sample)[0]
        # score is roughly between -0.5 (very anomalous) and +0.3 (very normal)
        # Normalize to 0 (normal) to 100 (anomalous)
        anomaly_risk = float(np.clip((0.15 - score) * 160.0, 5.0, 95.0))
        
        # Calculate overall trust score and risk score
        trust_penalty = len(reasons) * 20.0 + (anomaly_risk * 0.3)
        trust_score = round(max(5.0, min(99.0, 100.0 - trust_penalty)), 1)
        risk_score = round(100.0 - trust_score, 1)

        # Determine Verification Status
        if len(flags_to_create) > 0:
            if any(f["severity"] == FlagSeverity.CRITICAL.value for f in flags_to_create):
                status = VerificationStatus.REJECTED.value
            else:
                status = VerificationStatus.FLAGGED.value
        elif trust_score >= 80.0:
            status = VerificationStatus.VERIFIED.value
        else:
            status = VerificationStatus.PENDING.value

        return {
            "status": status,
            "trust_score": trust_score,
            "risk_score": risk_score,
            "anomaly_reasons": reasons,
            "rule_results": rule_results,
            "flags_to_create": flags_to_create
        }

verification_engine = VerificationEngine()
