# PowerShell script to run Laravel tests
# Usage: .\run-tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Laravel Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "artisan")) {
    Write-Host "ERROR: artisan file not found" -ForegroundColor Red
    Write-Host "Please run this script from apps/cloud-laravel directory" -ForegroundColor Red
    exit 1
}

# Try to find PHP
$phpPath = $null

# Check common PHP locations
$commonPaths = @(
    "C:\xampp\php\php.exe",
    "C:\laragon\bin\php\php-8.2\php.exe",
    "C:\laragon\bin\php\php-8.1\php.exe",
    "C:\laragon\bin\php\php-8.0\php.exe",
    "C:\Program Files\PHP\php.exe",
    "C:\php\php.exe"
)

foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        $phpPath = $path
        Write-Host "Found PHP at: $phpPath" -ForegroundColor Green
        break
    }
}

# Check PATH
if (-not $phpPath) {
    try {
        $phpVersion = & php --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $phpPath = "php"
            Write-Host "Found PHP in PATH" -ForegroundColor Green
        }
    } catch {
        # PHP not in PATH
    }
}

if (-not $phpPath) {
    Write-Host "ERROR: PHP is not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure PHP is installed and either:" -ForegroundColor Yellow
    Write-Host "1. Added to system PATH, or" -ForegroundColor Yellow
    Write-Host "2. Located in one of these common locations:" -ForegroundColor Yellow
    foreach ($path in $commonPaths) {
        Write-Host "   - $path" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "After installing PHP, restart your terminal and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Running tests..." -ForegroundColor Cyan
Write-Host ""

# Run tests
if ($phpPath -eq "php") {
    & php artisan test
} else {
    & $phpPath artisan test
}

$testResult = $LASTEXITCODE

if ($testResult -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "TESTS FAILED - DO NOT COMMIT" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the failing tests before committing." -ForegroundColor Yellow
    Write-Host ""
    exit 1
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "ALL TESTS PASSED - Safe to commit" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    exit 0
}
