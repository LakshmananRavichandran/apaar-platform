import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import validate_apaar_id, generate_apaar_check_digit

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    if response.headers.get("content-type", "").startswith("application/json"):
        assert response.json()["app"] == "APAAR Verify API"
    else:
        assert "<!doctype html>" in response.text.lower()

def test_demo_logins_endpoint():
    response = client.get("/api/v1/auth/demo-logins")
    assert response.status_code == 200
    logins = response.json()
    assert len(logins) == 8
    roles = [l["role"] for l in logins]
    assert "SUPER_ADMIN" in roles
    assert "STUDENT" in roles
    assert "VERIFIER" in roles

def test_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "superadmin@aicte.gov.in",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "SUPER_ADMIN"

def test_login_failure():
    response = client.post("/api/v1/auth/login", json={
        "email": "superadmin@aicte.gov.in",
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401

def test_apaar_checksum_algorithm():
    # Valid 11 digit seed
    seed = "10000000000"
    check_digit = generate_apaar_check_digit(seed)
    valid_apaar = seed + check_digit
    assert validate_apaar_id(valid_apaar) is True
    
    # Tampered last digit
    bad_apaar = seed + str((int(check_digit) + 1) % 10)
    assert validate_apaar_id(bad_apaar) is False

def test_national_dashboard_metrics():
    response = client.get("/api/v1/reports/national-dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert data["metrics"]["total_colleges"] == 60
    assert data["metrics"]["total_students"] >= 5000

def test_public_verification():
    # Verify using demo student APAAR ID
    response = client.get("/api/v1/verification/public-verify?apaar=100000000007")
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["student_name"] == "Aarav Sharma"
    assert "trust_score" in data

def test_audit_integrity():
    # Login as Super Admin
    login_res = client.post("/api/v1/auth/login", json={
        "email": "superadmin@aicte.gov.in",
        "password": "Admin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/audit/verify-integrity", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_intact"] is True
    assert data["total_records"] > 0

def test_ai_assistant_query():
    # Login as Officer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "officer@aicte.gov.in",
        "password": "Officer@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/ai-assistant/query",
        json={"query": "How many flagged students in Maharashtra?"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "chart_data" in data

def test_document_authenticity_verification():
    sample_pdf = b'%PDF-1.4\n1 0 obj\n<< /Producer (AICTE Cert Engine) /Type /Catalog >>\nendobj\n%%EOF\n'
    response = client.post(
        "/api/v1/verification/analyze-document-authenticity",
        files={"file": ("certificate.pdf", sample_pdf, "application/pdf")},
        data={"apaar_id": "100000000007"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "composite_security_score" in data
    assert "verdict" in data
    assert "hologram_analysis" in data
    assert "watermark_analysis" in data
    assert "tamper_forensics" in data
