@echo off
REM STC Edge Server Uninstall Script

echo ========================================
echo STC Edge Server Uninstallation
echo ========================================
echo.

set /p confirm="Are you sure you want to uninstall Edge Server? (y/n): "
if /i not "%confirm%"=="y" (
    echo Uninstallation cancelled.
    pause
    exit /b 0
)

echo [1/4] Stopping Edge Server...
call stop.bat

echo [2/4] Removing scheduled task...
schtasks /delete /tn "STC_EDGE_SERVER" /f >nul 2>&1

echo [3/4] Removing files...
REM Optionally archive logs
set /p archive="Archive logs before deletion? (y/n): "
if /i "%archive%"=="y" (
    if exist "logs" (
        set "ARCHIVE_DIR=%~dp0edge_logs_archive_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
        set "ARCHIVE_DIR=%ARCHIVE_DIR: =0%"
        mkdir "%ARCHIVE_DIR%" >nul 2>&1
        xcopy /E /I /Y logs "%ARCHIVE_DIR%\logs" >nul 2>&1
        echo Logs archived to: %ARCHIVE_DIR%
    )
)

REM Remove virtual environment
if exist "venv" (
    echo Removing virtual environment...
    rmdir /s /q venv
)

REM Note: We keep config and data directories for safety
echo.
echo ========================================
echo Uninstallation completed!
echo ========================================
echo.
echo Note: Configuration and data directories were preserved.
echo To completely remove, manually delete:
echo   - config/
echo   - data/
echo   - logs/
echo.
pause
