# Edge Server HMAC Implementation - CRITICAL SECURITY FIX

**Date**: 2025-01-30  
**Priority**: 🔴 **CRITICAL SECURITY BLOCKER**

---

## Problem

Edge Server is currently using Bearer token authentication (`CLOUD_API_KEY`) instead of HMAC signing for Edge endpoints. This is a **CRITICAL SECURITY VULNERABILITY** because:

1. Edge endpoints are now protected with HMAC middleware
2. Edge Server cannot authenticate without HMAC signatures
3. All Edge Server requests will fail with 401 Unauthorized

---

## Solution

Update Edge Server's `CloudDatabase` class to:
1. Store `edge_key` and `edge_secret` after successful heartbeat
2. Use HMAC signing for ALL requests to `/edges/*` endpoints
3. Use existing `HMACSigner` class from `edge/app/signer.py`

---

## Implementation Steps

### 1. Update CloudDatabase to Store Edge Credentials

After successful heartbeat, Cloud returns `edge_key` and `edge_secret`. Store these in:
- Local file: `data/edge_credentials.json`
- Or in `state.edge_credentials`

### 2. Update `_request` Method

Modify `CloudDatabase._request()` to:
- Check if endpoint starts with `/api/v1/edges/`
- If yes, use HMAC signing instead of Bearer token
- Load `edge_key` and `edge_secret` from storage
- Use `HMACSigner` to generate signature headers

### 3. Update Heartbeat Method

After successful heartbeat:
- Extract `edge_key` and `edge_secret` from response
- Store them locally
- Use them for subsequent requests

---

## Code Changes Required

### File: `apps/edge-server/app/core/database.py`

1. **Add HMAC signing import**:
```python
import sys
from pathlib import Path
# Add edge directory to path
edge_dir = Path(__file__).parent.parent.parent / "edge" / "app"
if str(edge_dir) not in sys.path:
    sys.path.insert(0, str(edge_dir))
from signer import HMACSigner
```

2. **Add credential storage**:
```python
def _load_edge_credentials(self) -> Tuple[Optional[str], Optional[str]]:
    """Load edge_key and edge_secret from storage"""
    creds_file = Path(settings.DATA_DIR) / "edge_credentials.json"
    if creds_file.exists():
        try:
            with creds_file.open('r') as f:
                data = json.load(f)
                return data.get('edge_key'), data.get('edge_secret')
        except:
            pass
    return None, None

def _save_edge_credentials(self, edge_key: str, edge_secret: str):
    """Save edge_key and edge_secret to storage"""
    creds_file = Path(settings.DATA_DIR) / "edge_credentials.json"
    creds_file.parent.mkdir(parents=True, exist_ok=True)
    with creds_file.open('w') as f:
        json.dump({'edge_key': edge_key, 'edge_secret': edge_secret}, f)
```

3. **Update `_request` method** to use HMAC for Edge endpoints:
```python
async def _request(self, method: str, endpoint: str, retry: bool = True, **kwargs):
    """Make HTTP request with retry logic and HMAC signing for Edge endpoints"""
    if not self.client:
        return False, "Not connected"
    
    # Check if this is an Edge endpoint requiring HMAC
    is_edge_endpoint = endpoint.startswith('/api/v1/edges/')
    
    # Prepare headers
    headers = dict(self._headers)
    
    if is_edge_endpoint:
        # Use HMAC signing for Edge endpoints
        edge_key, edge_secret = self._load_edge_credentials()
        if not edge_key or not edge_secret:
            logger.error("Edge credentials not found - cannot sign request")
            return False, "Edge credentials not configured"
        
        # Prepare body for signing
        body_bytes = b""
        if 'json' in kwargs:
            import json
            body_bytes = json.dumps(kwargs['json']).encode('utf-8')
        elif 'data' in kwargs:
            body_bytes = str(kwargs['data']).encode('utf-8')
        
        # Generate HMAC signature
        signer = HMACSigner(edge_key, edge_secret)
        path = endpoint  # Full path including /api/v1/edges/...
        sig_headers = signer.generate_signature(method, path, body_bytes)
        
        # Add HMAC headers (remove Bearer token)
        headers.update(sig_headers)
        headers.pop('Authorization', None)  # Remove Bearer token
    # else: Use existing Bearer token for non-Edge endpoints
    
    # Rest of the method...
```

4. **Update `heartbeat` method** to store credentials:
```python
async def heartbeat(...):
    # ... existing code ...
    
    success, result = await self._request(...)
    
    if success and isinstance(result, dict):
        # Extract and store edge credentials
        edge_key = result.get('edge_key')
        edge_secret = result.get('edge_secret')
        if edge_key and edge_secret:
            self._save_edge_credentials(edge_key, edge_secret)
            logger.info("Edge credentials stored successfully")
    
    return success
```

---

## Verification

After implementation:

1. **Unsigned request** → Should return 401
2. **Invalid signature** → Should return 401
3. **Valid signature** → Should return 200
4. **Heartbeat stores credentials** → Check `data/edge_credentials.json`
5. **Subsequent requests use HMAC** → Check logs for HMAC headers

---

## Status

⚠️ **PENDING IMPLEMENTATION**

This must be completed before Edge Server can communicate with Cloud API.
