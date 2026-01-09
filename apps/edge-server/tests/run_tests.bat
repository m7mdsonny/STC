@echo off
echo ==========================================
echo  Edge Server Integration Tests
echo ==========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)

REM Run tests
echo Running integration tests...
echo.
python tests/test_integration.py

echo.
echo ==========================================
echo  Tests completed
echo ==========================================
pause



