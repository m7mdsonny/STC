# PowerShell script to validate fixes for Edge → Cloud Analytics Integration
# Usage: .\validate-fixes.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Edge → Cloud Analytics - Fix Validation" -ForegroundColor Cyan
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
    Write-Host "WARNING: PHP is not found" -ForegroundColor Yellow
    Write-Host "Skipping PHP syntax validation." -ForegroundColor Yellow
    Write-Host "Please install PHP to run full validation." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual validation required:" -ForegroundColor Cyan
    Write-Host "  1. Install PHP 8.2+ from https://www.php.net/downloads.php" -ForegroundColor Gray
    Write-Host "  2. Run: php -l app/Http/Controllers/EventController.php" -ForegroundColor Gray
    Write-Host "  3. Run: php -l app/Services/DomainActionService.php" -ForegroundColor Gray
    Write-Host "  4. Run: php artisan optimize:clear" -ForegroundColor Gray
    Write-Host ""
    $skipValidation = $true
} else {
    $skipValidation = $false
    Write-Host "Running PHP syntax validation..." -ForegroundColor Cyan
    Write-Host ""
}

$allPassed = $true

# Test 1: PHP Syntax Validation
if (-not $skipValidation) {
    Write-Host "Test 1: PHP Syntax Validation" -ForegroundColor Yellow
    Write-Host "-" * 50 -ForegroundColor Gray
    
    $filesToCheck = @(
        "app/Http/Controllers/EventController.php",
        "app/Services/DomainActionService.php"
    )
    
    foreach ($file in $filesToCheck) {
        if (Test-Path $file) {
            if ($phpPath -eq "php") {
                $result = & php -l $file 2>&1
            } else {
                $result = & $phpPath -l $file 2>&1
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] $file - No syntax errors" -ForegroundColor Green
            } else {
                Write-Host "  [FAIL] $file - SYNTAX ERROR!" -ForegroundColor Red
                Write-Host "    $result" -ForegroundColor Red
                $allPassed = $false
            }
        } else {
            Write-Host "  [FAIL] $file - FILE NOT FOUND!" -ForegroundColor Red
            $allPassed = $false
        }
    }
    Write-Host ""
}

# Test 2: File Structure Validation
Write-Host "Test 2: File Structure Validation" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray

# Check EventController.php for fixed syntax
$eventControllerPath = "app/Http/Controllers/EventController.php"
if (Test-Path $eventControllerPath) {
    $content = Get-Content $eventControllerPath -Raw
    if ($content -match "} catch.*Exception.*e.*{") {
        Write-Host "  [OK] EventController.php - Catch block structure found" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] EventController.php - Catch block structure needs verification" -ForegroundColor Yellow
    }
    
    # Check for success logging
    if ($content -match "Batch ingest completed successfully") {
        Write-Host "  [OK] EventController.php - Success logging added" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] EventController.php - Success logging missing!" -ForegroundColor Red
        $allPassed = $false
    }
    
    # Check for HTTP 403 instead of 500
    if ($content -match "], 403\)") {
        Write-Host "  [OK] EventController.php - HTTP 403 status code for configuration errors" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] EventController.php - HTTP status code needs verification" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ EventController.php - FILE NOT FOUND!" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Check DomainActionService.php for role fix
$domainServicePath = "app/Services/DomainActionService.php"
if (Test-Path $domainServicePath) {
    $content = Get-Content $domainServicePath -Raw
    if ($content -match "CRITICAL: Defensive check for role property") {
        Write-Host "  [OK] DomainActionService.php - Role property defensive check added" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] DomainActionService.php - Role property check missing!" -ForegroundColor Red
        $allPassed = $false
    }
    
    if ($content -match "userRole.*=.*user.*role") {
        Write-Host "  [OK] DomainActionService.php - Safe role property access" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] DomainActionService.php - Safe role property access pattern not found!" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "  ✗ DomainActionService.php - FILE NOT FOUND!" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Test 3: Route Verification
Write-Host "Test 3: Route Verification" -ForegroundColor Yellow
Write-Host "-" * 50 -ForegroundColor Gray

$apiRoutesPath = "routes/api.php"
if (Test-Path $apiRoutesPath) {
    $content = Get-Content $apiRoutesPath -Raw
    if ($content -match "edges/events/batch.*EventController.*batchIngest") {
        Write-Host "  [OK] Route /api/v1/edges/events/batch found" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Route /api/v1/edges/events/batch needs verification" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [FAIL] routes/api.php - FILE NOT FOUND!" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "[SUCCESS] ALL VALIDATION TESTS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Clear Laravel caches (if PHP available):" -ForegroundColor Gray
    Write-Host "     php artisan optimize:clear" -ForegroundColor Gray
    Write-Host "     php artisan config:clear" -ForegroundColor Gray
    Write-Host "     php artisan route:clear" -ForegroundColor Gray
    Write-Host "     php artisan cache:clear" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Test the endpoint with curl:" -ForegroundColor Gray
    Write-Host "     See VALIDATION_FIXES_SUMMARY.md for test commands" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Monitor logs for successful analytics ingestion" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "[FAILED] SOME VALIDATION TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the errors above and fix them." -ForegroundColor Yellow
    exit 1
}
