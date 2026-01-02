# PHASE G - Blocker Fixes Status

## B1: Edge ↔ Cloud Trust (CRITICAL) - IN PROGRESS

### Issues Found:
1. ✅ VerifyEdgeSignature middleware exists and is well-implemented
2. ❌ Middleware NOT registered in bootstrap/app.php
3. ❌ Edge endpoints NOT protected by middleware
4. ❌ heartbeat doesn't generate edge_key/edge_secret
5. ❌ heartbeat doesn't return edge_key/edge_secret
6. ❌ Bug: $edge variable used before definition in heartbeat (line 305)

### Fixes Required:
1. Register middleware in bootstrap/app.php
2. Protect /edges/events and /edges/cameras with HMAC middleware
3. Keep /edges/heartbeat public for first registration
4. Generate edge_key and edge_secret in heartbeat if missing
5. Return edge_key and edge_secret in heartbeat response
6. Fix $edge variable bug in heartbeat

---

## Status: IN PROGRESS - Starting fixes now
