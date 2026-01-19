# Analytics Quick Fix Guide

**Problem**: التحليلات لا تظهر إطلاقاً في صفحة التحليلات

---

## 🔧 Quick Diagnostic Steps

### Step 1: Check Database (CRITICAL)

```sql
-- Check if there are ANY events with ai_module
SELECT COUNT(*) as total 
FROM events 
WHERE ai_module IS NOT NULL 
AND organization_id = YOUR_ORG_ID;

-- If 0, Edge Server is not sending analytics events correctly
```

### Step 2: Check Edge Server Logs

Look for:
- `"Analytics sent: Camera X - N analytics event(s) sent to Cloud"`
- `"Analytics event sent to Cloud: module=X"`

**If missing**: Edge Server is not processing video or not sending analytics.

### Step 3: Check Cloud Logs

Look for:
- `"Analytics event created"` with `ai_module` value
- `"Analytics event created without ai_module"` (WARNING - means module not extracted)

**If missing**: Edge Server is not sending events or Cloud is rejecting them.

### Step 4: Test API Directly

```bash
# Test module activity endpoint
curl -X GET "http://your-cloud/api/v1/analytics/module-activity?organization_id=1&start_date=2025-01-01&end_date=2025-01-19" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected response**:
```json
[
  { "module": "fire_detection", "count": 10 },
  { "module": "face_detection", "count": 5 }
]
```

### Step 5: Check Frontend Console

Open browser DevTools → Console:
- Look for: `"Module activity data fetched: N modules"`
- Or: `"Module activity data is empty"`
- Check Network tab: `GET /api/v1/analytics/module-activity`

---

## 🐛 Most Likely Issues

### Issue 1: No Data in Database (90% of cases)

**Symptom**: `SELECT COUNT(*) FROM events WHERE ai_module IS NOT NULL` returns 0

**Root Cause**: Edge Server not sending analytics events

**Fix**:
1. Verify Edge Server is processing cameras
2. Check cameras have `enabled_modules` in config
3. Check Edge Server logs for "Analytics sent" messages
4. Verify module is enabled in license

### Issue 2: Module Not Extracted (10% of cases)

**Symptom**: Events exist but `ai_module` is NULL

**Root Cause**: Edge not sending `module` in `meta` field

**Fix**:
1. Check Edge `main.py` line 264 - `module` must be in top-level of `analytics_data`
2. Check Edge `database.py` line 615-616 - `module` must be copied to `meta`
3. Check Cloud logs for "Analytics event created without ai_module"

### Issue 3: Cache Issues (rare)

**Symptom**: Old data showing, new events not appearing

**Fix**:
```bash
php artisan cache:clear
```

---

## ✅ Verification

After fixes, verify:

1. ✅ Database has events: `SELECT COUNT(*) FROM events WHERE ai_module IS NOT NULL`
2. ✅ Edge logs show: `"Analytics sent: Camera X - N events"`
3. ✅ Cloud logs show: `"Analytics event created"` with `ai_module` value
4. ✅ API returns data: `GET /api/v1/analytics/module-activity` returns array
5. ✅ Frontend console shows: `"Module activity data fetched: N modules"`
6. ✅ Page displays chart (not "لا توجد تنبيهات")

---

## 🎯 Next Steps

1. **If database is empty**: Check Edge Server configuration and video processing
2. **If events exist but ai_module is NULL**: Check Edge data format
3. **If API returns data but Frontend doesn't show**: Check browser console for errors

---

**End of Quick Fix Guide**
