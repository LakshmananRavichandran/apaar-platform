import hashlib
import json
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict
import jwt
import bcrypt
from cryptography.fernet import Fernet
from app.config import settings

# Derive a consistent Fernet 32-byte urlsafe base64 key from settings.AES_SECRET_KEY
_raw_key = hashlib.sha256(settings.AES_SECRET_KEY.encode()).digest()
_fernet_key = base64.urlsafe_b64encode(_raw_key)
cipher_suite = Fernet(_fernet_key)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8')[:72], salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None

# Field-level AES Encryption
def encrypt_field(value: str) -> str:
    if not value:
        return ""
    encrypted_bytes = cipher_suite.encrypt(value.encode('utf-8'))
    return encrypted_bytes.decode('utf-8')

def decrypt_field(encrypted_value: str) -> str:
    if not encrypted_value:
        return ""
    try:
        decrypted_bytes = cipher_suite.decrypt(encrypted_value.encode('utf-8'))
        return decrypted_bytes.decode('utf-8')
    except Exception:
        return encrypted_value

# Masking Utilities
def mask_aadhaar(aadhaar_or_last4: str) -> str:
    clean = ''.join(c for c in aadhaar_or_last4 if c.isdigit())
    last4 = clean[-4:] if len(clean) >= 4 else "0000"
    return f"XXXX-XXXX-{last4}"

def mask_phone(phone: str) -> str:
    clean = ''.join(c for c in phone if c.isdigit())
    if len(clean) >= 4:
        return f"+91-XXXXX-{clean[-4:]}"
    return "+91-XXXXX-XXXX"

# Tamper-Evident Audit Log Hash Chain
def compute_audit_hash(
    prev_hash: Optional[str],
    user_id: Optional[int],
    action: str,
    resource: str,
    resource_id: Optional[str],
    old_value: Optional[str],
    new_value: Optional[str],
    timestamp: str
) -> str:
    payload = f"{prev_hash or 'GENESIS'}|{user_id}|{action}|{resource}|{resource_id}|{old_value}|{new_value}|{timestamp}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

# APAAR ID Luhn-style Checksum Rule
# APAAR is 12 numeric digits. The last digit is a check digit.
def validate_apaar_id(apaar_id: str) -> bool:
    if not apaar_id or len(apaar_id) != 12 or not apaar_id.isdigit():
        return False
    digits = [int(d) for d in apaar_id]
    check = 0
    for idx, d in enumerate(reversed(digits)):
        if idx % 2 == 1:
            d = d * 2
            if d > 9:
                d -= 9
        check += d
    return (check % 10) == 0

def generate_apaar_check_digit(base_11_digits: str) -> str:
    digits = [int(d) for d in base_11_digits]
    check = 0
    # Pos 0 will be idx 1 from right when 12th digit added
    for idx, d in enumerate(reversed(digits), start=1):
        if idx % 2 == 1:
            d = d * 2
            if d > 9:
                d -= 9
        check += d
    check_digit = (10 - (check % 10)) % 10
    return str(check_digit)
