import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "APAAR Verify"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-key-for-apaar-verify-sih26263-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database - resolve robustly to backend directory
    _default_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apaar_verify.db").replace("\\", "/")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_default_db_path}")
    
    # AES Encryption Key for sensitive fields (32-bytes urlsafe base64 or hex)
    AES_SECRET_KEY: str = os.getenv("AES_SECRET_KEY", "0123456789abcdef0123456789abcdef")  # 32 bytes
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Upload and Certificates path
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"))
    CERTIFICATE_DIR: str = os.getenv("CERTIFICATE_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "certificates"))
    
    class Config:
        case_sensitive = True

settings = Settings()
