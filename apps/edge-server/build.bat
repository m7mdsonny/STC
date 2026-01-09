@echo off
echo ==========================================
echo  STC AI-VAP Edge Server - Build Script
echo ==========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.10 or higher
    pause
    exit /b 1
)

REM Create virtual environment if not exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller pywin32

REM Build executable
echo.
echo Building executable...
pyinstaller edge_server.spec --clean

if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  Build completed successfully!
echo  Executable: dist\STCAIVAPEdgeServer.exe
echo ==========================================
echo.

REM Check if Inno Setup is installed
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    echo Building installer...
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\setup.iss

    if errorlevel 1 (
        echo WARNING: Installer build failed
    ) else (
        echo Installer created in dist\installer\
    )
) else (
    echo NOTE: Inno Setup not found. Skipping installer build.
    echo Download from: https://jrsoftware.org/isdl.php
)

echo.
echo Done!
pause
