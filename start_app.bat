@echo off
title APAAR Verify - AICTE Platform
cd /d "c:\Users\Laksh\Downloads\lk\apaar-platform\backend"
echo ========================================================
echo   Starting APAAR Verify Platform (AICTE SIH26263)
echo ========================================================
echo.
echo Launching your browser at http://localhost:8000 ...
start "" "http://localhost:8000"
"..\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
