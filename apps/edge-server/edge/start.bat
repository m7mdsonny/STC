@echo off
REM STC Edge Server Start Script

echo Starting STC Edge Server...

REM Check if virtual environment exists
if not exist "venv" (
    echo ERROR: Virtual environment not found
    echo Please run install.bat first
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if already running
netstat -an | findstr ":8090" >nul
if not errorlevel 1 (
    echo Edge Server is already running on port 8090
    echo Opening browser...
    start http://localhost:8090
    exit /b 0
)

REM Start Edge Server
echo Starting Edge Server...
cd /d "%~dp0"
start "STC Edge Server" /min venv\Scripts\python.exe app\main.py

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:8090

echo Edge Server started!
echo Web UI: http://localhost:8090
