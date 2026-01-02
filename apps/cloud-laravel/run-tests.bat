@echo off
REM Run Laravel tests before commit
REM This script must pass before any git commit

echo ========================================
echo Running Laravel Tests
echo ========================================
echo.

REM Check if PHP is available
php --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PHP is not found in PATH
    echo Please ensure PHP is installed and added to PATH
    echo.
    echo To install PHP:
    echo 1. Download from https://www.php.net/downloads.php
    echo 2. Add PHP to your system PATH
    echo 3. Restart your terminal
    echo.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "artisan" (
    echo ERROR: artisan file not found
    echo Please run this script from apps/cloud-laravel directory
    pause
    exit /b 1
)

echo Running tests...
echo.

php artisan test

if errorlevel 1 (
    echo.
    echo ========================================
    echo TESTS FAILED - DO NOT COMMIT
    echo ========================================
    echo.
    echo Please fix the failing tests before committing.
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo ALL TESTS PASSED - Safe to commit
    echo ========================================
    echo.
    pause
    exit /b 0
)
