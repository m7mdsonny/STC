# PHASE G - B1: Edge ↔ Cloud Trust - Final Status

## Summary

**Status**: ⚠️ **PARTIALLY COMPLETE - Manual Review Required**

### ✅ Completed:
1. **Middleware Registered**: `verify.edge.signature` is registered in `bootstrap/app.php` (line 25)
2. **Routes Protected**: 
   - `/edges/heartbeat` - Public route (for first registration)
   - `/edges/events` - Protected by HMAC middleware ✅
   - `/edges/cameras` - Protected by HMAC middleware ✅
3. **Duplicate Route Removed**: `/edges/events` duplicate removed from auth:sanctum group

### ⚠️ Issues Identified:
1. **Heartbeat Method**: There appear to be TWO different heartbeat implementations in the file:
   - One at line ~257 (old implementation - uses edge_id lookup)
   - One at line ~338 (new implementation - expects edge_server from middleware)
   - **Problem**: The route is public, but new implementation expects middleware authentication

2. **Bug Still Present**: Line 305 uses `$edge->id` before `$edge` is defined (defined at line 330)

3. **Missing Features**:
   - edge_key/edge_secret generation NOT implemented
   - edge_key/edge_secret NOT returned in response

### Required Manual Fixes:

**File**: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`

1. **Fix $edge bug** (line 305):
   - Move license linking logic AFTER `updateOrCreate` (after line 333)

2. **Add key generation** (after line 333):
   ```php
   // Generate edge_key and edge_secret if they don't exist
   if (!$edge->edge_key || !$edge->edge_secret) {
       $edge->edge_key = 'edge_' . Str::random(32);
       $edge->edge_secret = Str::random(64);
       $edge->save();
   }
   ```

3. **Return keys in response** (line 388-398):
   ```php
   return response()->json([
       'ok' => true,
       'edge' => [...],
       'edge_key' => $edge->edge_key,
       'edge_secret' => $edge->edge_secret,
   ]);
   ```

---

**Next Step**: Manual code review and fix required due to file state issues preventing automated fixes.
