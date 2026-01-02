# PHASE G - Complete Fix Required

## Current Status

### ✅ Completed:
1. Routes updated - heartbeat is public, other Edge endpoints protected with HMAC
2. Duplicate /edges/events route removed

### ❌ Still Required for B1:

**1. bootstrap/app.php** - Middleware IS already registered! (line 25)
   - `verify.edge.signature` middleware alias exists
   - ✅ This is ALREADY DONE

**2. EdgeController::heartbeat()** - NEEDS FIX:
   - Current: heartbeat expects edge_server from middleware (line 342)
   - Problem: heartbeat route is PUBLIC (no middleware)
   - Solution: heartbeat must handle BOTH cases:
     - First registration: find by edge_id, generate keys
     - Subsequent: use HMAC middleware OR optional HMAC

**3. edge_key/edge_secret generation** - NOT implemented
   - Must generate in heartbeat if missing
   - Must return in response

---

## Required Fix:

The heartbeat method currently expects middleware authentication (line 342), but the route is public. We need to:

1. Handle first-time registration (no HMAC) - find by edge_id, generate keys
2. Handle subsequent heartbeats (optional HMAC) - if HMAC provided, verify; otherwise use edge_id lookup
3. Generate and return edge_key/edge_secret

**Note**: The current implementation won't work because heartbeat route is public but method expects authenticated edge_server.
