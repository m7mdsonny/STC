# Local Server Gap Analysis

## Current Implementation vs Cloud API Contract

### ✅ Implemented Correctly

1. **HMAC Signature Generation**
   - ✅ Correct signature format: `method|path|timestamp|body_hash`
   - ✅ Uses HMAC-SHA256
   - ✅ Includes X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE headers

2. **Heartbeat Endpoint**
   - ✅ POST /api/v1/edges/heartbeat
   - ✅ Sends version, online status, system_info
   - ✅ No authentication required (as per contract)

3. **Event Sending**
   - ✅ POST /api/v1/edges/events
   - ✅ Includes required fields (event_type, severity, occurred_at)
   - ✅ Includes meta data

4. **Get Cameras**
   - ✅ GET /api/v1/edges/cameras
   - ✅ Uses HMAC authentication

### ❌ Missing/Incorrect

1. **X-EDGE-NONCE Header**
   - ❌ **CRITICAL**: Local Server does NOT send X-EDGE-NONCE header
   - ❌ Cloud API REQUIRES this header for replay protection
   - ❌ All authenticated requests will fail with 401 (nonce_required)

2. **Nonce Generation**
   - ❌ No nonce generation logic in `cloud_client.py`
   - ❌ No UUID or random string generation for nonce

3. **Error Handling**
   - ⚠️ Partial: Handles 401, but doesn't distinguish error types
   - ⚠️ No retry logic for network errors
   - ⚠️ No exponential backoff

4. **Request Path**
   - ⚠️ Local Server uses full path: `/api/v1/edges/events`
   - ✅ Cloud expects full path (correct)
   - ⚠️ But signature uses full path, which is correct

5. **Body Hash for GET Requests**
   - ✅ GET requests use empty body hash (correct)
   - ✅ POST requests hash the JSON body (correct)

6. **Timestamp Validation**
   - ✅ Local Server generates current timestamp
   - ✅ Cloud validates within 5 minutes (correct)

## Required Fixes

### Priority 1: CRITICAL (Breaks Authentication)

1. **Add X-EDGE-NONCE Header**
   - Generate UUID or random string for each request
   - Include in signature generation? (NO - nonce is NOT part of signature)
   - Send in headers

2. **Update HMAC Signer**
   - Add nonce generation method
   - Update `generate_signature()` to accept nonce (but don't include in signature calculation)

3. **Update Cloud Client**
   - Generate nonce for each request
   - Add X-EDGE-NONCE to headers

### Priority 2: Important (Improves Reliability)

4. **Error Handling**
   - Distinguish between authentication errors (401) and network errors
   - Implement retry logic for network errors only
   - Add exponential backoff

5. **Response Parsing**
   - Better error message extraction from Cloud API responses
   - Log specific error codes (nonce_required, invalid_signature, etc.)

### Priority 3: Nice to Have

6. **Connection Pooling**
   - Reuse HTTP client connection
   - Already implemented (httpx.AsyncClient)

7. **Health Check**
   - Add connection test endpoint
   - Already implemented (`test_connection()`)

## Code Changes Required

### File: `edge/app/signer.py`
```python
import uuid

def generate_nonce(self) -> str:
    """Generate unique nonce for replay protection"""
    return str(uuid.uuid4())

def generate_signature(self, method: str, path: str, body: bytes = b"", timestamp: Optional[int] = None) -> Tuple[Dict[str, str], str]:
    """
    Generate HMAC signature and nonce
    
    Returns:
        Tuple of (headers_dict, nonce)
    """
    nonce = self.generate_nonce()
    # ... rest of signature generation (nonce NOT in signature)
    headers = {
        "X-EDGE-KEY": self.edge_key,
        "X-EDGE-TIMESTAMP": str(timestamp),
        "X-EDGE-SIGNATURE": signature,
        "X-EDGE-NONCE": nonce,  # ADD THIS
    }
    return headers, nonce
```

### File: `edge/app/cloud_client.py`
```python
async def _request(self, ...):
    # Generate signature and nonce
    headers, nonce = self.signer.generate_signature(method, path, body)
    headers["Content-Type"] = "application/json"
    headers["Accept"] = "application/json"
    # X-EDGE-NONCE is already in headers from signer
    # ... rest of request
```

## Testing Checklist

- [ ] Heartbeat works without authentication
- [ ] Event sending includes X-EDGE-NONCE header
- [ ] Get cameras includes X-EDGE-NONCE header
- [ ] Cloud API accepts requests with nonce
- [ ] Replay attack prevented (same nonce rejected)
- [ ] Timestamp validation works (old/future timestamps rejected)
- [ ] Signature validation works (wrong signature rejected)

## Migration Notes

- **Breaking Change**: Yes - Local Server MUST send X-EDGE-NONCE or requests will fail
- **Backward Compatibility**: No - Cloud API already requires nonce
- **Deployment**: Update Local Server code, then test with Cloud API
