@echo off
REM STC Edge Server Update Script

echo ========================================
echo STC Edge Server Update
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo ERROR: Virtual environment not found
    echo Please run install.bat first
    pause
    exit /b 1
)

echo [1/4] Stopping Edge Server...
call stop.bat

echo [2/4] Updating dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt --upgrade

echo [3/4] Preserving configuration...
REM Configuration is preserved automatically (config/config.json)

echo [4/4] Restarting Edge Server...
call start.bat

echo.
echo ========================================
echo Update completed successfully!
echo ========================================
echo.
pause
