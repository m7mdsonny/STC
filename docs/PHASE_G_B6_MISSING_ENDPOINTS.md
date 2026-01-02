# PHASE G - B6: Missing API Endpoints in Mobile App

## Missing Endpoints

### 1. `/alerts/stats` ❌
**Called by**: `AlertRepository.getAlertStats()`
**Status**: ❌ **NOT FOUND** in routes
**Impact**: Mobile app will get 404 error when loading dashboard stats

### 2. `/cameras/stats` ❌
**Called by**: `CameraRepository.getCameraStats()`
**Status**: ❌ **NOT FOUND** in routes
**Impact**: Mobile app will get 404 error when loading dashboard stats

### 3. `/edge-servers/stats` ❌
**Called by**: `ServerRepository.getServerStats()`
**Status**: ❌ **NOT FOUND** in routes
**Impact**: Mobile app will get 404 error when loading dashboard stats

### 4. `/analytics` (direct endpoint)
**Called by**: Analytics screen (but shows placeholder)
**Status**: ⚠️ Analytics endpoints exist but with paths like `/analytics/summary`
**Impact**: Analytics screen shows placeholder text (low priority)

## Solutions

### Option 1: Add Missing Stats Endpoints (Recommended)
Add stats methods to controllers:
- `AlertController::stats()` → `/alerts/stats`
- `CameraController::stats()` → `/cameras/stats`
- `EdgeController::stats()` → `/edge-servers/stats`

### Option 2: Update Mobile App to Use Dashboard Endpoint
Use `/dashboard` endpoint which likely contains aggregated stats

### Option 3: Handle 404 Gracefully in Mobile App
Add error handling to return empty stats on 404

## Recommendation

**Option 1 + 3**: Add stats endpoints AND handle errors gracefully in mobile app for backward compatibility.
