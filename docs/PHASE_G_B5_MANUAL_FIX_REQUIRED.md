# PHASE G - B5: Manual Fix Required

## Issue

The file `apps/web-portal/src/pages/Settings.tsx` could not be automatically updated due to file content differences.

## Required Manual Changes

### 1. Remove Fake syncConfig Call from testServerConnection()

**Location**: Line ~160 in `testServerConnection()` function

**Change**:
- ❌ **Remove**: `await edgeServersApi.syncConfig(server.id);`
- ✅ **Update comment**: Change "but we can trigger a sync if needed" to "Status update is handled automatically by Edge Server via heartbeat"

### 2. Remove Fake syncConfig Call from forceSync()

**Location**: Line ~182 in `forceSync()` function

**Change**:
- ❌ **Remove**: `await edgeServersApi.syncConfig(server.id);`
- ✅ **Update**: Add proper success/error handling:
  ```typescript
  const success = await edgeServerService.forceSync();
  if (success) {
    showSuccess('مزامنة ناجحة', `تم تشغيل مزامنة فورية لسيرفر ${server.name}`);
  } else {
    showError('فشل المزامنة', `فشل تشغيل المزامنة لسيرفر ${server.name}`);
  }
  ```
- ✅ **Add**: Proper error handling with `getDetailedErrorMessage`

## Verification

After changes:
1. Search for `edgeServersApi.syncConfig` in Settings.tsx - should return 0 results
2. Verify forceSync shows success/error messages
3. Test connection button should work without fake calls

## Status

⚠️ **Manual fix required** - Cannot auto-update due to file content differences
