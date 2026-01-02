# PHASE G - G1 Fixes Summary (Edge ↔ Cloud Trust)

## Status: PARTIALLY COMPLETE

### Completed:
1. ✅ Routes updated - heartbeat is public, other Edge endpoints protected
2. ✅ Duplicate /edges/events route removed from auth:sanctum group

### Still Required:
1. ❌ Register `verify.edge.signature` middleware in `bootstrap/app.php`
2. ❌ Fix `$edge` variable bug in `EdgeController::heartbeat()` (line 305)
3. ❌ Generate `edge_key` and `edge_secret` in heartbeat if missing
4. ❌ Return `edge_key` and `edge_secret` in heartbeat response

---

## Manual Fixes Required:

### 1. bootstrap/app.php
Add to middleware aliases:
```php
'verify.edge.signature' => \App\Http\Middleware\VerifyEdgeSignature::class,
```

### 2. EdgeController::heartbeat()
- Move license linking logic AFTER `updateOrCreate` (fix $edge bug)
- Generate edge_key/edge_secret if missing
- Return edge_key/edge_secret in response

---

**Note**: Some automatic fixes failed due to file state changes. Manual verification required.
