# Edge Endpoints Security - FIXED ✅

**Date**: 2025-01-30  
**Status**: ✅ **CLOUD SIDE FIXED** | ⚠️ **EDGE SIDE PENDING**

---

## ✅ Cloud Side - COMPLETED

### 1. Routes Secured ✅
- **File**: `apps/cloud-laravel/routes/api.php`
- **Status**: All Edge endpoints now protected with HMAC middleware
- **Routes Protected**:
  - `POST /api/v1/edges/heartbeat` - HMAC required
  - `POST /api/v1/edges/events` - HMAC required  
  - `GET /api/v1/edges/cameras` - HMAC required

### 2. Middleware Registered ✅
- **File**: `apps/cloud-laravel/bootstrap/app.php`
- **Status**: `verify.edge.signature` middleware alias registered

### 3. Middleware Implementation ✅
- **File**: `apps/cloud-laravel/app/Http/Middleware/VerifyEdgeSignature.php`
- **Features**:
  - Validates X-EDGE-KEY header
  - Validates X-EDGE-TIMESTAMP (5-minute window)
  - Validates X-EDGE-SIGNATURE (HMAC-SHA256)
  - Rejects unsigned/invalid requests with 401
  - Attaches edge_server to request for controllers

### 4. Duplicate Routes Removed ✅
- Removed duplicate `/edges/events` route from `auth:sanctum` group
- All Edge endpoints now ONLY accessible via HMAC

---

## ⚠️ Edge Server Side - PENDING

### Problem
Edge Server is still using Bearer token (`CLOUD_API_KEY`) instead of HMAC signing. This means:
- All Edge Server requests to `/edges/*` will fail with 401 Unauthorized
- Edge Server cannot communicate with Cloud API

### Required Changes

#### 1. Update `apps/edge-server/app/core/database.py`

**Add HMAC signing support**:
- Import `HMACSigner` from `edge/app/signer.py`
- Store `edge_key` and `edge_secret` after successful heartbeat
- Use HMAC signing for all `/api/v1/edges/*` endpoints
- Remove Bearer token for Edge endpoints

**Key Methods to Update**:
- `_request()` - Add HMAC signing logic
- `heartbeat()` - Store credentials from response
- `create_alert()` - Use HMAC for `/edges/events`
- `get_cameras()` - Use HMAC for `/edges/cameras`

#### 2. Heartbeat Response Must Include Credentials

**Update `EdgeController::heartbeat()`** to return `edge_key` and `edge_secret`:
```php
return response()->json([
    'ok' => true,
    'edge_id' => $edge->edge_id,
    'edge_key' => $edge->edge_key,  // ADD THIS
    'edge_secret' => $edge->edge_secret,  // ADD THIS (only on first heartbeat or if missing)
    'message' => 'Heartbeat received',
]);
```

**Security Note**: Only return `edge_secret` if:
- Edge Server doesn't have it stored locally, OR
- It's the first heartbeat after registration

---

## Verification Checklist

### Cloud Side ✅
- [x] Edge endpoints protected with HMAC middleware
- [x] Middleware validates signature correctly
- [x] No public Edge endpoints remain
- [x] Duplicate routes removed

### Edge Side ⚠️
- [ ] Edge Server stores edge_key and edge_secret
- [ ] Edge Server signs all `/edges/*` requests with HMAC
- [ ] Heartbeat response includes credentials
- [ ] Unsigned requests return 401
- [ ] Valid signed requests succeed

---

## Next Steps

1. **Update Edge Server `database.py`** to use HMAC signing
2. **Update `heartbeat()` response** to include credentials
3. **Test Edge Server connection** with HMAC
4. **Verify all Edge endpoints** work correctly

---

**Priority**: 🔴 **CRITICAL** - Edge Server cannot function until this is fixed.
