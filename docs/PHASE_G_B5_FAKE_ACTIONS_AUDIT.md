# PHASE G - B5: UI Fake Actions Audit

## Found Fake Actions

### 1. Edge Server Restart Button ❌
**Location**: 
- UI: `apps/web-portal/src/lib/api/edgeServers.ts` - `restart(id)` method
- Backend: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php` - `restart()` method (line 228-238)

**Problem**:
- Backend only logs the request, doesn't actually restart Edge Server
- Returns fake success message: "Restart signal queued"
- No actual command sent to Edge Server

**Current Code**:
```php
public function restart(EdgeServer $edgeServer): JsonResponse
{
    EdgeServerLog::create([
        'edge_server_id' => $edgeServer->id,
        'level' => 'info',
        'message' => 'Restart requested from control panel',
        'meta' => ['requested_at' => now()->toIso8601String()],
    ]);

    return response()->json(['message' => 'Restart signal queued']);
}
```

**Solution Options**:
1. **Remove button from UI** (if restart should be manual via Windows service)
2. **Implement real restart** via Edge Server command system (if supported)
3. **Disable button with clear message** that restart must be done manually

---

### 2. Edge Server Sync Config Button ❌
**Location**:
- UI: `apps/web-portal/src/lib/api/edgeServers.ts` - `syncConfig(id)` method
- Backend: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php` - `syncConfig()` method (line 240-250)

**Problem**:
- Backend only logs the request, doesn't actually sync
- Returns fake success message: "Sync request recorded"
- Sync actually happens automatically via Edge Server's SyncService

**Current Code**:
```php
public function syncConfig(EdgeServer $edgeServer): JsonResponse
{
    EdgeServerLog::create([
        'edge_server_id' => $edgeServer->id,
        'level' => 'info',
        'message' => 'Configuration sync requested',
        'meta' => ['requested_at' => now()->toIso8601String()],
    ]);

    return response()->json(['message' => 'Sync request recorded']);
}
```

**Solution**:
- **Remove button from UI** - Sync happens automatically every SYNC_INTERVAL (30 seconds)
- Or keep button but make it trigger a force sync (if Edge Server supports it)

---

### 3. Test Camera Connection ✅
**Status**: REAL implementation exists
- Backend: `apps/cloud-laravel/app/Http/Controllers/CameraController.php` - `testConnection()` method
- UI: `apps/web-portal/src/lib/api/cameras.ts` - `testConnection()` method
- **This is NOT a fake action** - it actually tests RTSP connection

---

## Summary

**Fake Actions Found**: 2
1. ❌ Edge Server Restart (logs only)
2. ❌ Edge Server Sync Config (logs only)

**Real Actions**: 1
1. ✅ Test Camera Connection (real implementation)

---

## Recommended Fix

### Option 1: Remove Fake Buttons (Recommended)
- Remove restart and sync-config buttons from UI
- Add note that sync happens automatically
- Document that restart must be done via Windows service

### Option 2: Implement Real Actions
- Implement restart via Edge Server command queue (if supported)
- Implement force sync trigger (if Edge Server supports it)

---

**Decision**: Pending user input on preferred approach.
