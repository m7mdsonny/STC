@echo off
REM ============================================
REM STC AI-VAP Cloud Laravel Deployment Script (Windows)
REM ============================================
REM This script deploys the latest code changes to the production server
REM Usage: deploy_cloud_laravel.bat

setlocal enabledelayedexpansion

echo ============================================
echo STC AI-VAP Cloud Laravel Deployment
echo ============================================
echo.

REM Configuration
set "PROJECT_PATH=D:\STC\STC AI"
set "LARAVEL_PATH=%PROJECT_PATH%\apps\cloud-laravel"
set "BRANCH=master"

REM Step 1: Navigate to project directory
echo [Step 1] Navigating to project directory...
if not exist "%LARAVEL_PATH%" (
    echo [ERROR] Laravel directory not found: %LARAVEL_PATH%
    exit /b 1
)

cd /d "%LARAVEL_PATH%"
echo [OK] Current directory: %CD%

REM Step 2: Check git status
echo [Step 2] Checking git status...
git status >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a git repository or git not available
    exit /b 1
)

for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i
echo [INFO] Current branch: !CURRENT_BRANCH!

if not "!CURRENT_BRANCH!"=="%BRANCH%" (
    echo [WARNING] Not on %BRANCH% branch. Switching...
    git checkout %BRANCH%
)

REM Step 3: Pull latest changes
echo [Step 3] Pulling latest changes from %BRANCH%...
git pull origin %BRANCH%
if errorlevel 1 (
    echo [ERROR] Failed to pull latest changes
    exit /b 1
)
echo [OK] Code updated successfully

REM Step 4: Install/Update dependencies
echo [Step 4] Installing/updating Composer dependencies...
where composer >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Composer not found. Please install Composer first.
    exit /b 1
)

composer install --no-dev --optimize-autoloader --no-interaction
if errorlevel 1 (
    echo [WARNING] Composer install had issues. Continuing anyway...
) else (
    echo [OK] Dependencies updated
)

REM Step 5: Run migrations (if any)
echo [Step 5] Checking for database migrations...
php artisan migrate:status >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Running migrations...
    php artisan migrate --force --no-interaction
    if errorlevel 1 (
        echo [WARNING] Migration had issues. Check manually.
    ) else (
        echo [OK] Migrations completed
    )
) else (
    echo [WARNING] Could not check migration status. Skipping migrations.
)

REM Step 6: Clear all caches
echo [Step 6] Clearing all caches...
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear
echo [OK] All caches cleared

REM Step 7: Optimize for production
echo [Step 7] Optimizing for production...
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo [OK] Optimization completed

REM Step 8: Verify deployment
echo [Step 8] Verifying deployment...
php artisan --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Laravel verification failed
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('php artisan --version') do set ARTISAN_VERSION=%%i
    echo [OK] Laravel is working: !ARTISAN_VERSION!
)

REM Summary
echo.
echo ============================================
echo [OK] Deployment completed successfully!
echo ============================================
echo.
echo [INFO] Next steps:
echo   1. Check application logs: storage\logs\laravel.log
echo   2. Test API endpoints
echo   3. Monitor for any errors
echo.

endlocal
