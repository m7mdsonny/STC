@echo off
REM STC Edge Server Stop Script

echo Stopping STC Edge Server...

REM Stop scheduled task
schtasks /end /tn "STC_EDGE_SERVER" >nul 2>&1

REM Kill Python processes running main.py
taskkill /f /im python.exe /fi "WINDOWTITLE eq STC Edge Server*" >nul 2>&1
for /f "tokens=2" %%a in ('netstat -ano ^| findstr ":8090" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Edge Server stopped.
