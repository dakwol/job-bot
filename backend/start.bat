@echo off
setlocal

REM Путь к виртуальному окружению
call ..\.venv\Scripts\activate.bat

REM Установка зависимостей, если надо
pip show fastapi >nul 2>&1 || (
    echo [INFO] Устанавливаю зависимости...
    pip install fastapi uvicorn pymorphy2 nltk scikit-learn pdfplumber
)

REM Запуск FastAPI сервера
echo [INFO] Запуск FastAPI...
python -m uvicorn main:app --reload

pause
