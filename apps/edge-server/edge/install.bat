@echo off
REM STC Edge Server Installation Script
REM This script installs and configures the Edge Server

echo ========================================
echo STC Edge Server Installation
echo ========================================
echo.

REM Check Windows version
ver | findstr /i "10.0 11.0" >nul
if errorlevel 1 (
    echo ERROR: Windows 10 or 11 is required
    pause
    exit /b 1
)

REM Check admin privileges
net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: Administrator privileges required
    echo Please run this script as Administrator
    pause
    exit /b 1
)

echo [1/6] Checking Python installation...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Please install Python 3.10 or later from python.org
    echo After installation, run this script again.
    pause
    exit /b 1
)

python --version
python -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python 3.10 or later is required
    pause
    exit /b 1
)

echo [2/6] Checking port availability (8090)...
netstat -an | findstr ":8090" >nul
if not errorlevel 1 (
    echo WARNING: Port 8090 is already in use
    echo Please stop the service using port 8090 and run this script again
    pause
    exit /b 1
)

echo [3/6] Creating virtual environment...
if exist "venv" (
    echo Virtual environment already exists
) else (
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo [4/6] Installing dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [5/6] Creating directories...
if not exist "logs" mkdir logs
if not exist "data" mkdir data
if not exist "config" mkdir config

echo [6/6] Registering Windows Scheduled Task...
REM Remove existing task if exists
schtasks /delete /tn "STC_EDGE_SERVER" /f >nul 2>&1

REM Get current directory
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

REM Create scheduled task
schtasks /create ^
    /sc onstart ^
    /tn "STC_EDGE_SERVER" ^
    /tr "cmd /c \"cd /d %CURRENT_DIR% && %CURRENT_DIR%\venv\Scripts\python.exe %CURRENT_DIR%\app\main.py\"" ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f

if errorlevel 1 (
    echo ERROR: Failed to register scheduled task
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo Starting Edge Server...
echo.

REM Start the service
call start.bat

echo.
echo Edge Server is running!
echo Open your browser and visit: http://localhost:8090
echo.
pause
