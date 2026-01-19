# Analytics Pipeline Diagnosis Guide

**Problem**: Analytics لا تظهر إطلاقاً في صفحة التحليلات

---

## 🔍 Diagnostic Steps

### 1. Check Database - Events with ai_module

```sql
-- Check total events
SELECT COUNT(*) as total_events FROM events;

-- Check events with ai_module
SELECT COUNT(*) as events_with_module FROM events WHERE ai_module IS NOT NULL;

-- Check analytics events
SELECT COUNT(*) as analytics_events FROM events WHERE event_type = 'analytics';

-- Check module breakdown
SELECT ai_module, COUNT(*) as count 
FROM events 
WHERE ai_module IS NOT NULL 
GROUP BY ai_module 
ORDER BY count DESC;

-- Recent analytics events (last 24 hours)
SELECT id, event_type, ai_module, camera_id, occurred_at, meta 
FROM events 
WHERE event_type = 'analytics' 
AND occurred_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY occurred_at DESC 
LIMIT 20;
```

### 2. Check Edge Server Logs

```bash
# Edge Server logs should show:
# - "Analytics sent: Camera X - N analytics event(s)"
# - "Analytics event sent to Cloud: module=X, event_id=Y"

# Check Edge Server logs for analytics sending
grep -i "analytics" /path/to/edge-server/logs/*.log
```

### 3. Check Cloud Logs

```bash
# Cloud logs should show:
# - "Analytics event created" with ai_module value
# - Warning if "Analytics event created without ai_module"

# Check Cloud logs
grep -i "analytics event" /path/to/cloud/storage/logs/laravel.log
```

### 4. Test API Endpoints

```bash
# Test module activity endpoint
curl -X GET "http://your-cloud/api/v1/analytics/module-activity?organization_id=1&start_date=2025-01-01&end_date=2025-01-19" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test debug endpoint
curl -X GET "http://your-cloud/api/v1/analytics/debug/pipeline-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Check Frontend Console

Open browser DevTools → Console and look for:
- API errors from `/analytics/module-activity`
- Network tab: Check response from `GET /api/v1/analytics/module-activity`

---

## 🐛 Common Issues & Fixes

### Issue 1: No Events in Database

**Symptoms**: Database query returns 0 events with `ai_module`

**Causes**:
1. Edge Server not processing video
2. Analytics events not being sent from Edge
3. Cloud rejecting events (module disabled, authentication failed)

**Fix**:
- Check Edge Server is running and processing cameras
- Verify cameras have `enabled_modules` configured
- Check Edge Server logs for "Analytics sent" messages
- Verify module is enabled in license

### Issue 2: ai_module is NULL

**Symptoms**: Events exist but `ai_module` column is NULL

**Causes**:
1. Edge not sending `module` in `meta` field
2. Cloud not extracting `module` from `meta` correctly

**Fix**:
- Check Edge `main.py` line 264 - `module` must be in top-level of `analytics_data`
- Check Edge `database.py` line 615-616 - `module` must be copied to `meta`
- Check Cloud `EventController.php` line 61 - `$aiModule = $meta['module'] ?? null`

### Issue 3: Cache Issues

**Symptoms**: Old data showing, new events not appearing

**Fix**:
```php
// Clear analytics cache
Cache::flush(); // Or specific cache keys

// Or via API (if endpoint exists)
GET /api/v1/analytics/clear-cache
```

### Issue 4: Frontend Not Fetching

**Symptoms**: API returns data but Frontend shows empty

**Fix**:
- Check browser console for errors
- Verify `analyticsApi.getModuleActivity()` is called
- Check response format matches expected: `[{module: string, count: number}]`

---

## ✅ Verification Checklist

- [ ] Database has events with `ai_module IS NOT NULL`
- [ ] Edge Server logs show "Analytics sent" messages
- [ ] Cloud logs show "Analytics event created" with `ai_module` value
- [ ] API endpoint `/api/v1/analytics/module-activity` returns data
- [ ] Frontend `fetchAnalyticsData()` is called
- [ ] Frontend `moduleActivityRes` has data
- [ ] Frontend `alertsByModule` is populated
- [ ] Chart displays data (not empty message)

---

## 🔧 Quick Fixes

### Fix 1: Clear Cache and Refresh

```bash
# Cloud: Clear cache
php artisan cache:clear

# Frontend: Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
```

### Fix 2: Verify Edge Sending

Add debug logging in Edge `main.py`:
```python
logger.info(f"Analytics data: {analytics_data}")
await state.db.submit_analytics(analytics_data)
logger.info(f"Analytics submitted for module: {module_id}")
```

### Fix 3: Verify Cloud Receiving

Check `EventController.php` logs:
```php
Log::info('Event received', [
    'event_type' => $request->event_type,
    'meta' => $meta,
    'ai_module_extracted' => $aiModule,
]);
```

---

**Next Steps**: If data still doesn't appear, check each step in the pipeline systematically.
