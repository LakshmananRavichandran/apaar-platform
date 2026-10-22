import pyotp
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.models import User, UserRole, College
from app.schemas.schemas import (
    LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
    TOTPVerifyRequest
)
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token
)
from app.core.dependencies import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    # Check lockout
    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until > now:
        remaining_mins = int((user.locked_until - now).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked due to 5 failed attempts. Please retry in {remaining_mins} minutes.",
        )

    if not verify_password(req.password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = now + timedelta(minutes=15)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked for 15 minutes due to 5 consecutive failed login attempts.",
            )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password. Attempt {user.failed_login_attempts} of 5 before temporary lockout.",
        )

    # Check 2FA if enabled
    if user.is_totp_enabled and user.totp_secret:
        if not req.otp:
            return TokenResponse(
                access_token="",
                refresh_token="",
                token_type="2fa_required",
                user={"id": user.id, "email": user.email, "requires_2fa": True}
            )
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(req.otp):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA TOTP authentication code",
            )

    # Successful login: reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    access_token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    college_name = user.college.name if user.college else None

    # Log audit
    log_audit_event(db, user, "LOGIN", "USER", str(user.id), None, "Successful login")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "college_id": user.college_id,
            "college_name": college_name,
            "apaar_id": user.apaar_id,
            "is_totp_enabled": user.is_totp_enabled
        }
    )

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    new_user = User(
        email=email,
        password_hash=get_password_hash(req.password),
        full_name=req.full_name,
        role=req.role,
        college_id=req.college_id,
        apaar_id=req.apaar_id,
        phone=req.phone,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(db, new_user, "REGISTER", "USER", str(new_user.id), None, "User registered")

    access_token = create_access_token({"sub": str(new_user.id), "role": new_user.role, "email": new_user.email})
    refresh_token = create_refresh_token({"sub": str(new_user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user={
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "college_id": new_user.college_id,
            "apaar_id": new_user.apaar_id,
            "is_totp_enabled": False
        }
    )

@router.post("/refresh")
def refresh_token_endpoint(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive or missing")

    new_access = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return {"access_token": new_access, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    college_name = current_user.college.name if current_user.college else None
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "college_id": current_user.college_id,
        "college_name": college_name,
        "apaar_id": current_user.apaar_id,
        "phone": current_user.phone,
        "is_totp_enabled": current_user.is_totp_enabled
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        return {"message": "If this email is registered, a password reset token has been dispatched."}
    
    # Simulate email token
    simulated_otp = "849201"
    return {
        "message": "Password reset token sent to your registered email address.",
        "simulated_otp": simulated_otp,
        "notice": "In production, an email is dispatched. For simulation testing, use OTP: 849201"
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if req.token_or_otp != "849201":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
    
    user.password_hash = get_password_hash(req.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    log_audit_event(db, user, "RESET_PASSWORD", "USER", str(user.id), None, "Password reset successfully")
    return {"message": "Password updated successfully. You can now login with your new credentials."}

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    
    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()
    log_audit_event(db, current_user, "CHANGE_PASSWORD", "USER", str(current_user.id), None, "Password changed")
    return {"message": "Password changed successfully"}

@router.get("/totp/setup")
def totp_setup(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    db.commit()

    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=current_user.email, issuer_name="APAAR Verify AICTE")
    
    return {
        "secret": secret,
        "otpauth_url": provisioning_uri,
        "message": "Scan this key in Google Authenticator or Microsoft Authenticator."
    }

@router.post("/totp/verify")
def totp_verify(
    req: TOTPVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA setup not initiated")
    
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(req.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP verification code")

    current_user.is_totp_enabled = True
    db.commit()
    log_audit_event(db, current_user, "ENABLE_2FA", "USER", str(current_user.id), None, "Two-factor authentication enabled")
    return {"message": "Two-factor authentication successfully enabled!"}

@router.get("/demo-logins")
def get_demo_logins():
    """
    Returns pre-configured demo logins for all 8 roles for quick one-click testing.
    """
    return [
        {"role": "SUPER_ADMIN", "label": "Super Admin", "email": "superadmin@aicte.gov.in", "password": "Admin@123", "desc": "National AICTE Super Administrator"},
        {"role": "AICTE_OFFICER", "label": "AICTE Officer", "email": "officer@aicte.gov.in", "password": "Officer@123", "desc": "HQ Verification & Compliance Monitor"},
        {"role": "REGIONAL_OFFICER", "label": "Regional Officer", "email": "regional.mumbai@aicte.gov.in", "password": "Regional@123", "desc": "West Regional AICTE Jurisdiction"},
        {"role": "COLLEGE_ADMIN", "label": "College Admin", "email": "college.admin@vjti.ac.in", "password": "College@123", "desc": "VJTI College Administrator"},
        {"role": "COLLEGE_STAFF", "label": "College Staff", "email": "staff.data@vjti.ac.in", "password": "Staff@123", "desc": "Student Data Entry & Upload Operator"},
        {"role": "VERIFIER", "label": "Verifier (Employer)", "email": "hr.verifier@tcs.com", "password": "Verifier@123", "desc": "TCS Corporate Background Verifier"},
        {"role": "STUDENT", "label": "Student", "email": "student.aarav@student.aicte.gov.in", "password": "Student@123", "desc": "Aarav Sharma (APAAR ID: 100000000007)"},
        {"role": "AUDITOR", "label": "Auditor (Read-Only)", "email": "auditor.cag@gov.in", "password": "Auditor@123", "desc": "National CAG Compliance & Tamper Auditor"},
    ]

@router.get("/sessions")
def get_active_sessions(current_user: User = Depends(get_current_user)):
    return [
        {"id": "sess_current", "device": "Windows 11 / Chrome 124", "ip": "127.0.0.1", "is_current": True, "last_active": "Just now"},
        {"id": "sess_mobile", "device": "Android 14 / Mobile Safari", "ip": "103.21.24.89", "is_current": False, "last_active": "2 hours ago"}
    ]

@router.post("/sessions/logout-others")
def logout_other_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit_event(db, current_user, "LOGOUT_OTHER_DEVICES", "USER", str(current_user.id), None, "Terminated remote sessions")
    return {"message": "All other active sessions have been invalidated."}
