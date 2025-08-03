@echo off
setlocal

cd /d %~dp0

echo [*] Creating virtual environment if missing...
if not exist venv (
    python -m venv venv
)

echo [*] Activating environment...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo Failed to activate virtual environment.
    pause
    exit /b 1
)

echo [*] Installing dependencies...
pip install --upgrade pip
pip install fastapi uvicorn pdfplumber scikit-learn numpy requests python-multipart

echo [*] Starting FastAPI server...
python -m uvicorn main:app --reload --workers 1

pause
endlocal
