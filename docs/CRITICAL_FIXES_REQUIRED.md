# CRITICAL FIXES REQUIRED - Manual Intervention Needed

**Date**: 2025-01-30  
**Status**: ⚠️ **MANUAL FIX REQUIRED**

---

## Issue: Edge Endpoints Still Public

The file `apps/cloud-laravel/routes/api.php` still has Edge endpoints exposed as public routes without HMAC authentication.

### Current State (WRONG):
```php
// Lines 44-50
// Public Edge Server endpoints (must be accessible before authentication)
Route::post('/licensing/validate', [LicenseController::class, 'validateKey']);
Route::post('/edges/heartbeat', [EdgeController::class, 'heartbeat']);
Route::post('/edges/events', [EventController::class, 'ingest']);

// Public Edge Server data endpoints (for sync - requires organization_id in request)
Route::get('/edges/cameras', [EdgeController::class, 'getCamerasForEdge']);
```

### Required Fix:
```php
// Public licensing endpoint (with throttling)
Route::post('/licensing/validate', [LicenseController::class, 'validateKey'])->middleware('throttle:100,1');

// Edge Server endpoints with HMAC authentication (SECURITY: Must use HMAC, not public)
Route::middleware(['verify.edge.signature', 'throttle:100,1'])->group(function () {
    Route::post('/edges/heartbeat', [EdgeController::class, 'heartbeat']);
    Route::post('/edges/events', [EventController::class, 'ingest']);
    Route::get('/edges/cameras', [EdgeController::class, 'getCamerasForEdge']);
});
```

### Also Remove Duplicate Route:
Line 56 has a duplicate `/edges/events` route inside `auth:sanctum` group - **REMOVE IT**.

---

## Steps to Fix:

1. Open `apps/cloud-laravel/routes/api.php`
2. Replace lines 44-50 with the corrected code above
3. Remove line 56 (duplicate `/edges/events` route)
4. Verify `verify.edge.signature` middleware is registered in `bootstrap/app.php` (it should be)
5. Test Edge Server connection

---

**Priority**: 🔴 **CRITICAL - SECURITY VULNERABILITY**
