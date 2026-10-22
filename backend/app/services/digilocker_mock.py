import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.models import ApaarRecord, Student
from app.services.verification_engine import name_similarity_ratio

# Global rate limit tracker for DigiLocker mock
_request_timestamps: List[float] = []
RATE_LIMIT_PER_MINUTE = 120

class DigiLockerMockService:
    def __init__(self):
        self.error_rate = 0.0  # Can be dynamically toggled in admin settings

    async def sync_with_official_registry(
        self,
        student: Student,
        db: Session,
        simulate_delay: bool = True,
        simulate_error: bool = False
    ) -> Dict[str, Any]:
        """
        Simulates authentic DigiLocker API response with real latency,
        rate limits, and comparison against college records.
        """
        current_time = time.time()
        
        # 1. Rate Limiting Check
        global _request_timestamps
        _request_timestamps = [t for t in _request_timestamps if current_time - t < 60]
        if len(_request_timestamps) >= RATE_LIMIT_PER_MINUTE:
            return {
                "success": False,
                "error_code": "RATE_LIMIT_EXCEEDED",
                "message": "DigiLocker API rate limit reached (120 req/min). Please try again shortly.",
                "rate_limit_reset_in": 60 - int(current_time - _request_timestamps[0])
            }
        _request_timestamps.append(current_time)

        # 2. Simulated Latency
        if simulate_delay:
            await asyncio.sleep(0.35)

        # 3. Simulated Network / Server Error
        if simulate_error:
            return {
                "success": False,
                "error_code": "DIGILOCKER_UNAVAILABLE",
                "message": "Upstream DigiLocker / APAAR National Gateway is experiencing elevated response times (HTTP 503)."
            }

        # 4. Lookup Official APAAR Record
        official = db.query(ApaarRecord).filter(ApaarRecord.apaar_id == student.apaar_id).first()
        
        if not official:
            return {
                "success": False,
                "error_code": "RECORD_NOT_FOUND",
                "message": f"No official citizen record found in DigiLocker for APAAR ID {student.apaar_id}.",
                "apaar_id": student.apaar_id
            }

        # 5. Field-by-Field Comparison Difference Matrix
        differences = []
        fields_to_compare = [
            ("name", student.name, official.full_name),
            ("dob", student.dob, official.dob),
            ("gender", student.gender, official.gender),
            ("father_name", student.father_name, official.father_name),
            ("mother_name", student.mother_name, official.mother_name),
            ("aadhaar_last4", student.aadhaar_last4, official.aadhaar_last4),
            ("state", student.state, official.state),
        ]

        all_matched = True
        for field, col_val, off_val in fields_to_compare:
            is_match = (str(col_val).strip().lower() == str(off_val).strip().lower())
            if not is_match:
                all_matched = False
            
            sim = 1.0 if is_match else name_similarity_ratio(str(col_val), str(off_val))
            differences.append({
                "field": field,
                "label": field.replace("_", " ").title(),
                "college_value": col_val,
                "official_value": off_val,
                "matches": is_match,
                "similarity_score": round(sim * 100, 1),
                "resolution": "ACCEPTED_OFFICIAL" if not is_match else "MATCHED"
            })

        return {
            "success": True,
            "apaar_id": official.apaar_id,
            "synced_at": datetime.now(timezone.utc).isoformat(),
            "official_record": {
                "full_name": official.full_name,
                "dob": official.dob,
                "gender": official.gender,
                "father_name": official.father_name,
                "mother_name": official.mother_name,
                "aadhaar_last4": official.aadhaar_last4,
                "state": official.state,
                "is_active": official.is_active
            },
            "differences": differences,
            "is_perfect_match": all_matched
        }

digilocker_service = DigiLockerMockService()
