# PHASE G - B6: Mobile App Compatibility - Complete Audit

## Missing Endpoints (3)

### 1. `/alerts/stats` ❌
**Mobile Call**: `AlertRepository.getAlertStats()`
**Expected Format**: `{'new': int, 'total': int, 'critical': int, 'high': int, 'today': int}`
**Solution**: Add `AlertController::stats()` method

### 2. `/cameras/stats` ❌
**Mobile Call**: `CameraRepository.getCameraStats()`
**Expected Format**: Likely camera counts/stats
**Solution**: Add `CameraController::stats()` method (or remove call - mobile calculates from cameras list)

### 3. `/edge-servers/stats` ❌
**Mobile Call**: `ServerRepository.getServerStats()`
**Expected Format**: Likely server counts/stats
**Solution**: Add `EdgeController::stats()` method (or remove call - mobile calculates from servers list)

## Solution Strategy

**Option 1**: Add stats endpoints (better for performance)
**Option 2**: Remove stats calls from mobile app (simpler - already calculates from lists)

**Recommendation**: Option 2 - Mobile app already calculates stats from lists, so stats endpoints are redundant. Just add error handling for graceful degradation.

## Implementation

1. **Add error handling** in mobile repositories to return empty stats on 404
2. **OR** Add stats endpoints (if performance is critical)

## Status

⏳ **Decision needed**: Add endpoints or handle errors gracefully?
