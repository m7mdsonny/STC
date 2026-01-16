# Local Server Patch Implementation

## Summary
This document describes the implementation of fixes to align Local Server with Cloud API contract.

## Changes Made

### 1. Add X-EDGE-NONCE Header Support

**File**: `edge/app/signer.py`

**Changes**:
- Added `uuid` import for nonce generation
- Added `generate_nonce()` method to create unique UUIDs
- Modified `generate_signature()` to return tuple `(headers, nonce)`
- Added `X-EDGE-NONCE` header to signature response
- **Important**: Nonce is NOT included in HMAC signature calculation (only in header)

**Code**:
```python
def generate_nonce(self) -> str:
    """Generate unique nonce for replay protection"""
    return str(uuid.uuid4())

def generate_signature(...) -> Tuple[Dict[str, str], str]:
    nonce = self.generate_nonce()
    # ... signature calculation (nonce NOT in message)
    headers = {
        "X-EDGE-KEY": self.edge_key,
        "X-EDGE-TIMESTAMP": str(timestamp),
        "X-EDGE-SIGNATURE": signature,
        "X-EDGE-NONCE": nonce,  # Added
    }
    return headers, nonce
```

### 2. Update Cloud Client to Use Nonce

**File**: `edge/app/cloud_client.py`

**Changes**:
- Updated `_request()` to handle tuple return from `generate_signature()`
- Nonce is automatically included in headers
- Improved error handling for 401 responses with specific error codes

**Code**:
```python
# Generate HMAC signature and nonce
headers, nonce = self.signer.generate_signature(method, path, body)
headers["Content-Type"] = "application/json"
headers["Accept"] = "application/json"
# X-EDGE-NONCE is already included in headers
```

### 3. Enhanced Error Handling

**File**: `edge/app/cloud_client.py`

**Changes**:
- Parse Cloud API error responses to extract error codes
- Map error codes to user-friendly messages
- Log specific error codes for debugging

**Error Codes Handled**:
- `authentication_required`: Missing headers
- `nonce_required`: Missing nonce (should not happen after fix)
- `invalid_credentials`: Edge server not found
- `configuration_error`: Edge server has no secret
- `timestamp_invalid`: Timestamp out of range
- `nonce_reused`: Replay attack detected
- `invalid_signature`: Signature mismatch

## Testing

### Manual Testing Steps

1. **Test Heartbeat (No Auth Required)**
   ```bash
   # Should work without HMAC headers
   curl -X POST https://api.stcsolutions.online/api/v1/edges/heartbeat \
     -H "Content-Type: application/json" \
     -d '{"version": "1.0.0", "online": true}'
   ```

2. **Test Event Sending (HMAC Required)**
   - Start Local Server
   - Verify X-EDGE-NONCE header is sent
   - Check Cloud API logs for successful authentication
   - Verify event is created in database

3. **Test Get Cameras (HMAC Required)**
   - Start Local Server
   - Verify cameras are fetched successfully
   - Check Cloud API logs for successful authentication

4. **Test Replay Protection**
   - Send same request twice with same nonce
   - Verify second request is rejected with `nonce_reused` error

5. **Test Timestamp Validation**
   - Send request with old timestamp (>5 minutes)
   - Verify request is rejected with `timestamp_invalid` error

## Deployment

### Pre-Deployment Checklist
- [ ] Code changes reviewed
- [ ] Unit tests pass (if any)
- [ ] Manual testing completed
- [ ] Cloud API is ready (already requires nonce)

### Deployment Steps
1. Update Local Server code
2. Restart Local Server service
3. Monitor logs for authentication errors
4. Verify heartbeat, events, and cameras endpoints work

### Rollback Plan
- Revert code changes
- Restart Local Server
- Note: Cloud API already requires nonce, so old code will fail until rolled back

## Compatibility

### Breaking Changes
- **Yes**: Local Server MUST send X-EDGE-NONCE or requests will fail
- Cloud API already requires nonce (no change needed)

### Backward Compatibility
- **No**: Old Local Server code will fail with Cloud API
- All Local Servers must be updated

## Performance Impact
- **Minimal**: UUID generation is fast
- **No**: Network overhead (nonce is small string)
- **No**: Database impact (nonce storage is handled by Cloud API)

## Security Improvements
1. **Replay Protection**: Nonces prevent request replay attacks
2. **Timestamp Validation**: Prevents old/future requests
3. **Signature Validation**: Ensures request integrity

## Future Enhancements
1. Retry logic for network errors (exponential backoff)
2. Connection pooling optimization
3. Health check endpoint improvements
4. Better error recovery mechanisms
