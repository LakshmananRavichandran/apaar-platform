import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, get_db
from app.models.models import Student, College, Flag
from app.core.websocket import ws_manager
from app.seed.seed_data import seed_database

# Routers
from app.routers import (
    auth, students, colleges, verification, flags, duplicates,
    uploads, verifier, student_portal, audit, reports, tickets,
    announcements, ai_assistant, approvals, settings_health
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AICTE SIH26263 APAAR ID-Based Student Data Management & Verification Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist and mount static paths
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CERTIFICATE_DIR, exist_ok=True)

# Include all API v1 Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(students.router, prefix=api_v1)
app.include_router(colleges.router, prefix=api_v1)
app.include_router(verification.router, prefix=api_v1)
app.include_router(flags.router, prefix=api_v1)
app.include_router(duplicates.router, prefix=api_v1)
app.include_router(uploads.router, prefix=api_v1)
app.include_router(verifier.router, prefix=api_v1)
app.include_router(student_portal.router, prefix=api_v1)
app.include_router(audit.router, prefix=api_v1)
app.include_router(reports.router, prefix=api_v1)
app.include_router(tickets.router, prefix=api_v1)
app.include_router(announcements.router, prefix=api_v1)
app.include_router(ai_assistant.router, prefix=api_v1)
app.include_router(approvals.router, prefix=api_v1)
app.include_router(settings_health.router, prefix=api_v1)

# Global Spotify-Style Search Endpoint
@app.get(f"{api_v1}/global-search")
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    term = f"%{q.strip()}%"
    
    # Students
    students_res = db.query(Student).filter(
        (Student.name.ilike(term)) | (Student.apaar_id.ilike(term)) | (Student.enrollment_no.ilike(term)),
        Student.is_deleted == False
    ).limit(5).all()

    # Colleges
    colleges_res = db.query(College).filter(
        (College.name.ilike(term)) | (College.aicte_code.ilike(term)) | (College.district.ilike(term))
    ).limit(5).all()

    # Flags
    flags_res = db.query(Flag).filter(
        (Flag.description.ilike(term)) | (Flag.flag_type.ilike(term))
    ).limit(5).all()

    return {
        "query": q,
        "students": [
            {
                "id": s.id,
                "name": s.name,
                "apaar_id": s.apaar_id,
                "college": s.college.name if s.college else "College",
                "verification_status": s.verification_status,
                "trust_score": s.trust_score
            }
            for s in students_res
        ],
        "colleges": [
            {
                "id": c.id,
                "name": c.name,
                "aicte_code": c.aicte_code,
                "state": c.state,
                "verification_score": c.verification_score
            }
            for c in colleges_res
        ],
        "flags": [
            {
                "id": f.id,
                "student_id": f.student_id,
                "student_name": f.student.name if f.student else "Student",
                "flag_type": f.flag_type,
                "severity": f.severity,
                "status": f.status
            }
            for f in flags_res
        ]
    }

# Live WebSocket Hub for Realtime Notifications
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: int = None):
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client heartbeats or pings
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
    except Exception:
        ws_manager.disconnect(websocket, user_id)

@app.on_event("startup")
def on_startup():
    print("APAAR Verify API Server starting...")
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")

from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json", "ws"]:
            return {"detail": "Not Found"}
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "app": "APAAR Verify API",
            "version": "1.0.0",
            "status": "online",
            "docs": "/docs",
            "redoc": "/redoc"
        }

