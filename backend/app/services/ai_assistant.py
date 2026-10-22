import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Student, College, Flag, VerificationStatus

class AskApaarAssistant:
    def process_query(self, query: str, db: Session) -> Dict[str, Any]:
        q = query.lower().strip()

        # 1. Flagged students in a specific state
        state_match = re.search(r'(?:flagged|flags|issues|anomalies).*?(?:in|for)\s+([a-zA-Z\s]+)', q)
        if state_match or "flagged in" in q:
            state_target = state_match.group(1).strip().title() if state_match else "Maharashtra"
            count = db.query(Student).filter(
                Student.state.ilike(f"%{state_target}%"),
                Student.verification_status == VerificationStatus.FLAGGED.value,
                Student.is_deleted == False
            ).count()

            # Breakdown by branch
            branch_breakdown = db.query(
                Student.branch, func.count(Student.id)
            ).filter(
                Student.state.ilike(f"%{state_target}%"),
                Student.verification_status == VerificationStatus.FLAGGED.value,
                Student.is_deleted == False
            ).group_by(Student.branch).all()

            chart_data = [{"label": b[0], "value": b[1]} for b in branch_breakdown[:6]]

            return {
                "answer": f"There are currently **{count} flagged students** registered across AICTE institutions in **{state_target}**.",
                "chart_type": "bar",
                "chart_title": f"Flagged Students by Branch in {state_target}",
                "chart_data": chart_data,
                "follow_ups": [
                    f"Show top colleges in {state_target}",
                    "What are the most common flag reasons?",
                    "Export flagged students report"
                ]
            }

        # 2. National Verification Overview / Totals
        if any(w in q for w in ["how many students", "total students", "verification status", "overview"]):
            stats = db.query(Student.verification_status, func.count(Student.id)).filter(
                Student.is_deleted == False
            ).group_by(Student.verification_status).all()

            chart_data = [{"label": s[0], "value": s[1]} for s in stats]
            total = sum(s[1] for s in stats)
            verified = next((s[1] for s in stats if s[0] == VerificationStatus.VERIFIED.value), 0)
            verified_pct = round((verified / total * 100), 1) if total > 0 else 0

            return {
                "answer": f"Across the nation, there are **{total:,} students** indexed in the APAAR platform. **{verified:,} ({verified_pct}%)** have been completely verified with trusted credentials.",
                "chart_type": "pie",
                "chart_title": "National Student Verification Status",
                "chart_data": chart_data,
                "follow_ups": [
                    "Show state-wise verification rates",
                    "Which colleges have compliance issues?",
                    "List unresolved duplicate student groups"
                ]
            }

        # 3. Top colleges / ranking
        if any(w in q for w in ["top college", "best college", "college ranking", "highest score"]):
            colleges = db.query(College).order_by(College.verification_score.desc()).limit(7).all()
            chart_data = [{"label": c.name[:25], "value": round(c.verification_score, 1)} for c in colleges]

            return {
                "answer": f"Here are the top {len(colleges)} AICTE-approved institutions ranked by APAAR verification score.",
                "chart_type": "bar",
                "chart_title": "Top AICTE Institutions by Verification Score",
                "chart_data": chart_data,
                "follow_ups": [
                    "Show compliance monitor",
                    "Filter colleges below 90% score",
                    "How is verification score calculated?"
                ]
            }

        # 4. Gender distribution
        if any(w in q for w in ["gender", "female", "male", "ratio"]):
            genders = db.query(Student.gender, func.count(Student.id)).filter(
                Student.is_deleted == False
            ).group_by(Student.gender).all()
            chart_data = [{"label": g[0], "value": g[1]} for g in genders]

            return {
                "answer": f"Gender distribution analysis indicates **{chart_data[0]['label']}: {chart_data[0]['value']}** and **{chart_data[1]['label'] if len(chart_data) > 1 else 'Others'}: {chart_data[1]['value'] if len(chart_data) > 1 else 0}**.",
                "chart_type": "pie",
                "chart_title": "Student Gender Ratio",
                "chart_data": chart_data,
                "follow_ups": [
                    "Category-wise student breakdown",
                    "Enrollment by engineering branch",
                    "View national dashboard"
                ]
            }

        # 5. Category breakdown
        if any(w in q for w in ["category", "caste", "obc", "sc", "st", "general", "ews"]):
            categories = db.query(Student.category, func.count(Student.id)).filter(
                Student.is_deleted == False
            ).group_by(Student.category).all()
            chart_data = [{"label": c[0], "value": c[1]} for c in categories]

            return {
                "answer": "Here is the national category-wise enrollment distribution across all enrolled students.",
                "chart_type": "bar",
                "chart_title": "Students by Category (General/OBC/SC/ST/EWS)",
                "chart_data": chart_data,
                "follow_ups": [
                    "Gender breakdown by category",
                    "State-wise enrollment metrics"
                ]
            }

        # 6. Branch enrollment
        if any(w in q for w in ["branch", "course", "stream", "computer science"]):
            branches = db.query(Student.branch, func.count(Student.id)).filter(
                Student.is_deleted == False
            ).group_by(Student.branch).order_by(func.count(Student.id).desc()).limit(6).all()
            chart_data = [{"label": b[0], "value": b[1]} for b in branches]

            return {
                "answer": "Computer Science and allied IT branches lead student admissions across AICTE institutions.",
                "chart_type": "bar",
                "chart_title": "Top Engineering Branches by Enrollment",
                "chart_data": chart_data,
                "follow_ups": [
                    "Show academic performance by branch",
                    "View national verification stats"
                ]
            }

        # Default fallback intelligent answer
        total_students = db.query(Student).filter(Student.is_deleted == False).count()
        total_colleges = db.query(College).count()
        flagged_count = db.query(Flag).filter(Flag.status != "RESOLVED").count()

        return {
            "answer": (
                f"**Ask APAAR Assistant**: I am analyzing live records across **{total_colleges} institutions** and **{total_students:,} student records**. "
                f"Currently there are **{flagged_count} active flags** under review. You can ask me specific questions like:\n\n"
                "- *'How many flagged students in Maharashtra?'*\n"
                "- *'Show top colleges by verification score'*\n"
                "- *'What is the gender ratio of students?'*\n"
                "- *'How many students are verified?'*"
            ),
            "chart_type": "metric",
            "chart_title": "Key Platform Metrics",
            "chart_data": [
                {"label": "Total Students", "value": total_students},
                {"label": "Colleges", "value": total_colleges},
                {"label": "Active Flags", "value": flagged_count}
            ],
            "follow_ups": [
                "How many flagged students in Tamil Nadu?",
                "Top colleges by verification score",
                "Gender ratio of students"
            ]
        }

ai_assistant = AskApaarAssistant()
