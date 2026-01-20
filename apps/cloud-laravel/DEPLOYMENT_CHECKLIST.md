# 🚀 Edge → Cloud Analytics Integration - Deployment Checklist

## ✅ PRE-DEPLOYMENT VERIFICATION

### Phase 1: Code Fixes (COMPLETED)
- [x] **EventController.php** - Fixed PHP syntax error (catch block alignment)
- [x] **EventController.php** - Changed HTTP 500 → 403 for configuration errors
- [x] **EventController.php** - Added success logging for analytics tracking
- [x] **DomainActionService.php** - Added defensive check for missing role property
- [x] **DomainActionService.php** - Changed crash → HTTP 403 with proper logging

### Phase 2: Validation (COMPLETED)
- [x] Run validation script: `.\validate-fixes.ps1`
- [x] Verify all fixes are in place
- [x] Route `/api/v1/edges/events/batch` confirmed

## 🔧 DEPLOYMENT STEPS

### Step 1: Pre-Deployment Commands

**On Development/Staging:**
```bash
cd apps/cloud-laravel

# 1. PHP Syntax Validation (REQUIRED)
php -l app/Http/Controllers/EventController.php
php -l app/Services/DomainActionService.php

# Expected Output:
# No syntax errors detected in app/Http/Controllers/EventController.php
# No syntax errors detected in app/Services/DomainActionService.php

# 2. Clear All Laravel Caches (REQUIRED)
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# 3. Run Tests (RECOMMENDED)
php artisan test --testsuite=Feature --filter=EventController
```

### Step 2: Production Deployment

**1. Backup Current Version:**
```bash
# Backup database
php artisan backup:run

# Backup code (if using version control)
git tag v1.0.x-fixes-$(date +%Y%m%d)
git push origin v1.0.x-fixes-$(date +%Y%m%d)
```

**2. Deploy Code:**
- Push changes to production repository
- Pull latest code on production server
- Run composer install (if dependencies changed)

**3. Post-Deployment Commands:**
```bash
cd apps/cloud-laravel

# Clear caches (CRITICAL)
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Rebuild caches (OPTIONAL - for performance)
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Verify routes are loaded
php artisan route:list | grep "edges/events/batch"
```

### Step 3: Smoke Tests (MANDATORY)

**Test 1: Invalid Payload → 422**
```bash
curl -X POST https://your-domain/api/v1/edges/events/batch \
  -H "Content-Type: application/json" \
  -H "X-Edge-Key: test-key" \
  -d '{"events": [{"invalid": "data"}]}' \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 422 (NOT 500)

**Test 2: No Authentication → 401/403**
```bash
curl -X POST https://your-domain/api/v1/edges/events/batch \
  -H "Content-Type: application/json" \
  -d '{"events": [{"event_type": "analytics", "severity": "info", "occurred_at": "2024-01-01T00:00:00Z"}]}' \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 401 or 403 (NOT 500)

**Test 3: Valid Request → 200**
```bash
# Get valid edge credentials first
EDGE_KEY="your-valid-edge-key"
TIMESTAMP=$(date +%s)
BODY='{"events": [{"event_type": "analytics", "severity": "info", "occurred_at": "2024-01-01T00:00:00Z", "camera_id": "cam-001", "meta": {"module": "face"}}]}'

# Calculate HMAC signature (implementation depends on your edge server)
SIGNATURE=$(echo -n "POST|/api/v1/edges/events/batch|$TIMESTAMP|$(echo -n "$BODY" | sha256sum | cut -d' ' -f1)" | openssl dgst -sha256 -hmac "$EDGE_SECRET" | cut -d' ' -f2)

curl -X POST https://your-domain/api/v1/edges/events/batch \
  -H "Content-Type: application/json" \
  -H "X-Edge-Key: $EDGE_KEY" \
  -H "X-Edge-Signature: $SIGNATURE" \
  -H "X-Edge-Timestamp: $TIMESTAMP" \
  -d "$BODY" \
  -w "\nHTTP Status: %{http_code}\n"
```
**Expected:** HTTP 200 with `{"ok": true, "created": 1, ...}`

### Step 4: Monitor Logs

**Check Laravel Logs:**
```bash
# Real-time log monitoring
tail -f storage/logs/laravel.log | grep -E "(Batch ingest|EventController|DomainActionService)"

# Check for errors
grep -E "(ERROR|CRITICAL|FatalError|ParseError)" storage/logs/laravel.log | tail -50

# Check for successful batch ingestion
grep "Batch ingest completed successfully" storage/logs/laravel.log | tail -20
```

**Expected Log Patterns:**
- ✅ `Batch ingest completed successfully` with edge_id, organization_id, counts
- ✅ `Event created successfully` for each event
- ❌ NO `FatalError` or `ParseError`
- ❌ NO `Undefined property: stdClass::$role`
- ❌ NO unexpected HTTP 500 errors

### Step 5: Verify Edge Server Integration

**1. Check Edge Server Logs:**
- Edge server should stop retry loop
- Analytics batches should report as "sent successfully"
- No more HTTP 500 errors in edge logs

**2. Verify Database:**
```sql
-- Check recent events
SELECT COUNT(*) as total_events, 
       DATE(created_at) as date,
       event_type,
       severity
FROM events
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY DATE(created_at), event_type, severity
ORDER BY date DESC, total_events DESC;

-- Check for failed batch ingestions (should be minimal)
SELECT * FROM events 
WHERE meta->'$.error' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

## 🔍 POST-DEPLOYMENT MONITORING

### Metrics to Monitor (First 24 Hours)

1. **Success Rate:**
   - Target: >95% successful batch ingestions
   - Monitor: `/api/v1/edges/events/batch` response codes

2. **Error Rate:**
   - Target: <5% errors
   - Alert if: HTTP 500 errors > 1% of requests

3. **Response Time:**
   - Target: <2 seconds for batch ingestion
   - Alert if: P95 > 5 seconds

4. **Edge Server Health:**
   - Monitor edge server retry patterns
   - Should see reduced retry attempts

### Alerts to Configure

1. **High Error Rate:**
   - Alert if: HTTP 500 > 1% of requests in 5 minutes

2. **Syntax Errors:**
   - Alert on: Any FatalError or ParseError in logs

3. **Missing Role Property:**
   - Alert on: Any "Undefined property: role" errors

4. **Failed Batch Ingestions:**
   - Alert if: >10% batch ingestions fail in 15 minutes

## 📋 ROLLBACK PLAN

If issues are detected:

**1. Immediate Rollback:**
```bash
# Revert to previous git tag
git checkout v1.0.x-previous
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

**2. Database Rollback (if needed):**
- Restore from backup taken before deployment
- Verify data integrity

**3. Post-Rollback Verification:**
- Re-run smoke tests
- Verify edge server can connect
- Check logs for errors

## ✅ FINAL VERIFICATION CHECKLIST

Before marking deployment as complete:

- [ ] All smoke tests pass (422, 401/403, 200)
- [ ] No syntax errors in logs (FatalError, ParseError)
- [ ] No undefined property errors (role)
- [ ] Edge server successfully sending analytics
- [ ] Database events being created correctly
- [ ] Success logs appearing in Laravel logs
- [ ] Error rate < 5%
- [ ] Response time within acceptable range
- [ ] Edge server retry loop stopped

## 📞 SUPPORT CONTACTS

If issues arise:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check edge server logs
3. Review deployment checklist above
4. Contact development team if issues persist

---

**Deployment Date:** ___________
**Deployed By:** ___________
**Status:** ☐ Ready | ☐ Completed | ☐ Rolled Back

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
