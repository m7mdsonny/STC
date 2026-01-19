# Nonce Collision - Alternative Solutions

**Date**: 2025-01-19  
**Problem**: Request nonce already used (replay attack detected)  
**Status**: Multiple solutions implemented

---

## 🔍 Problem Analysis

**Root Cause**: When sending multiple analytics events simultaneously (one per module), each request needs a unique nonce. Even with delays, race conditions can occur in Cloud middleware.

**Current Behavior**:
- Edge Server sends 9 separate analytics events (one per enabled module)
- Each event creates a new HTTP request with a new nonce
- Cloud middleware checks nonce uniqueness atomically
- Race conditions can still occur between concurrent requests

---

## ✅ Solutions Implemented

### Solution 1: Store Nonce Before Signature Check (Current)
**Status**: ✅ Implemented  
**Location**: `apps/cloud-laravel/app/Http/Middleware/VerifyEdgeSignature.php`

**How it works**:
- Store nonce in database FIRST (atomic insert)
- If duplicate key error → reject immediately
- Then verify signature
- If signature fails → delete nonce to allow retry

**Pros**:
- Atomic operation prevents race conditions
- Simple implementation

**Cons**:
- Still requires unique nonce for each request
- If fails, need to handle cleanup

---

### Solution 2: Batch Analytics Events (Recommended)
**Status**: ✅ Implemented  
**Location**: `apps/edge-server/main.py`

**How it works**:
- Collect all analytics events in array
- Send events sequentially (one after another)
- Each event gets unique nonce automatically (from `uuid.uuid4()`)

**Pros**:
- Reduces race condition window
- Events sent sequentially = no concurrent requests
- Each event has unique nonce from UUID generator

**Cons**:
- Still multiple requests (but sequential)
- Slightly slower (but more reliable)

---

## 🚀 Alternative Solutions (If Problem Persists)

### Solution 3: True Batch Endpoint (Best Long-term)

**Implementation**:
```php
// Cloud: POST /api/v1/edges/events/batch
public function batchEvents(Request $request) {
    $events = $request->input('events', []);
    foreach ($events as $event) {
        // Process each event
    }
    return response()->json(['ok' => true, 'count' => count($events)]);
}
```

```python
# Edge: Send all events in one request
analytics_batch = {
    'events': analytics_events
}
await state.db._request("POST", "/api/v1/edges/events/batch", json=analytics_batch)
```

**Pros**:
- Single request = single nonce = zero collision risk
- More efficient (less network overhead)
- Better performance

**Cons**:
- Requires Cloud API endpoint change
- More complex error handling

---

### Solution 4: Increase Delay Further

**Implementation**:
```python
# Increase delay from 50ms to 200ms or 500ms
await asyncio.sleep(0.2)  # 200ms
# or
await asyncio.sleep(0.5)  # 500ms
```

**Pros**:
- Very simple change
- Ensures unique timestamps

**Cons**:
- Slower analytics sending
- Still potential for collision (very rare with UUID)

---

### Solution 5: Use Semaphore/Lock in Edge Server

**Implementation**:
```python
import asyncio

# Create semaphore with limit 1 (only one request at a time)
analytics_semaphore = asyncio.Semaphore(1)

async def submit_analytics_safe(analytics_data):
    async with analytics_semaphore:
        return await state.db.submit_analytics(analytics_data)
```

**Pros**:
- Guarantees sequential sending
- No race conditions

**Cons**:
- Still multiple requests
- More complex code

---

### Solution 6: Use Redis for Nonce Tracking

**Implementation**:
```php
// Cloud: Use Redis SET with expiry instead of database
if (Redis::exists("nonce:$nonce")) {
    return response()->json(['error' => 'nonce_reused'], 401);
}
Redis::setex("nonce:$nonce", 600, time()); // 10 min expiry
```

**Pros**:
- Very fast (Redis is in-memory)
- Atomic operations (SETNX)
- Auto-expiry (no cleanup needed)

**Cons**:
- Requires Redis infrastructure
- More complex deployment

---

## 🎯 Recommended Next Steps

### If Current Solution Fails:

1. **Immediate**: Try Solution 2 (already implemented - sequential sending)

2. **Short-term**: Implement Solution 3 (Batch Endpoint) - Best solution

3. **Long-term**: Consider Solution 6 (Redis) for better performance

---

## 📋 Testing Checklist

After implementing any solution:

- [ ] No "nonce already used" errors in Edge logs
- [ ] Analytics events received in Cloud logs
- [ ] Module activity appears in Dashboard
- [ ] No performance degradation
- [ ] Events sent reliably (no missing data)

---

## 🔧 Debug Commands

### Check Nonce Usage:
```sql
SELECT nonce, COUNT(*) as count, MAX(used_at) as last_used
FROM edge_nonces
WHERE used_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY nonce
HAVING count > 1;
```

### Check Duplicate Nonces:
```sql
SELECT nonce, edge_server_id, used_at
FROM edge_nonces
WHERE nonce IN (
    SELECT nonce FROM edge_nonces
    GROUP BY nonce
    HAVING COUNT(*) > 1
)
ORDER BY nonce, used_at;
```

### Clear Old Nonces:
```sql
DELETE FROM edge_nonces
WHERE used_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE);
```

---

**End of Solutions Documentation**
