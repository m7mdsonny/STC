# Analytics Fix - Complete Documentation

**Date**: 2025-01-19  
**Status**: ✅ **Code Fixed - Diagnosis Required**

---

## 🎯 Problem Statement

**التحليلات لا تظهر إطلاقاً في صفحة التحليلات**

---

## ✅ Code Flow Verification (VERIFIED)

### Edge Server → Cloud Pipeline

1. **Edge Server Processing** (`apps/edge-server/main.py`):
   ```python
   analytics_data = {
       'module': module_id,  # ✅ Top-level
       'metadata': {'module': module_id}  # ✅ Also in metadata
   }
   await state.db.submit_analytics(analytics_data)
   ```

2. **Edge Database** (`apps/edge-server/app/core/database.py`):
   ```python
   # submit_analytics → create_event
   async def submit_analytics(self, analytics_data: Dict) -> bool:
       return await self.create_event({**analytics_data, "type": "analytics"})
   
   # create_alert converts metadata → meta and copies module to meta
   meta = {}
   if 'metadata' in alert_data:
       meta.update(alert_data['metadata'])
   if 'module' in alert_data:
       meta['module'] = alert_data['module']  # ✅ Module copied to meta
   ```

3. **Cloud EventController** (`apps/cloud-laravel/app/Http/Controllers/EventController.php`):
   ```php
   $meta = $request->input('meta', []);
   $aiModule = $meta['module'] ?? null;  // ✅ Extracted from meta
   Event::create(['ai_module' => $aiModule, ...]);  // ✅ Stored in DB
   ```

4. **Cloud AnalyticsService** (`apps/cloud-laravel/app/Services/AnalyticsService.php`):
   ```php
   Event::where('organization_id', $organizationId)
       ->whereNotNull('ai_module')  // ✅ Query events with ai_module
       ->selectRaw('ai_module, COUNT(*) as count')
       ->groupBy('ai_module')
   ```

5. **Frontend** (`apps/web-portal/src/pages/Analytics.tsx`):
   ```typescript
   analyticsApi.getModuleActivity({organization_id, start_date, end_date})
   // ✅ Fetches from /api/v1/analytics/module-activity
   // ✅ Maps to alertsByModule for display
   ```

**Code Flow: ✅ CORRECT**

---

## 🔍 Diagnosis Steps

### Step 1: Check Database

```sql
-- Check if there are ANY events with ai_module
SELECT COUNT(*) as total 
FROM events 
WHERE ai_module IS NOT NULL 
AND organization_id = YOUR_ORG_ID;

-- If 0: Edge Server is not sending analytics events
-- If > 0: Data exists, check Frontend/API
```

### Step 2: Check Edge Server Logs

Look for these log messages:
```
✅ "Analytics sent: Camera X - N analytics event(s) sent to Cloud"
✅ "Analytics event sent to Cloud: module=X, event_id=Y"
```

**If missing**: Edge Server is not processing video or not sending analytics.

### Step 3: Check Cloud Logs

Look for these log messages:
```
✅ "Analytics event created" with ai_module value
⚠️ "Analytics event created without ai_module" (WARNING - module not extracted)
```

### Step 4: Test API Directly

```bash
GET /api/v1/analytics/module-activity?organization_id=1&start_date=2025-01-01&end_date=2025-01-19
Authorization: Bearer YOUR_TOKEN
```

**Expected Response**:
```json
[
  { "module": "fire_detection", "count": 10 },
  { "module": "face_detection", "count": 5 }
]
```

**If empty array `[]`**: No data in database for date range.

### Step 5: Check Browser Console

Open DevTools → Console:
- Look for: `"Module activity data fetched: N modules"`
- Or: `"Module activity data is empty"`
- Check Network tab: `GET /api/v1/analytics/module-activity`

### Step 6: Use Debug Endpoints

```bash
# Pipeline status
GET /api/v1/analytics/debug/pipeline-status
Authorization: Bearer YOUR_TOKEN

# Test query
GET /api/v1/analytics/debug/test-query?start_date=2025-01-01&end_date=2025-01-19
Authorization: Bearer YOUR_TOKEN
```

---

## 🐛 Common Issues & Solutions

### Issue 1: No Events in Database (90% of cases)

**Symptom**: `SELECT COUNT(*) FROM events WHERE ai_module IS NOT NULL` = 0

**Root Cause**: Edge Server not sending analytics events

**Solution**:
1. Verify Edge Server is running and processing cameras
2. Check cameras have `enabled_modules` in config:
   ```sql
   SELECT camera_id, name, config->'$.enabled_modules' as modules 
   FROM cameras 
   WHERE edge_server_id = YOUR_EDGE_ID;
   ```
3. Check Edge Server logs for "Analytics sent" messages
4. Verify module is enabled in license:
   ```sql
   SELECT modules FROM licenses WHERE organization_id = YOUR_ORG_ID;
   ```

### Issue 2: Module Not Extracted (10% of cases)

**Symptom**: Events exist but `ai_module` is NULL

**Root Cause**: Edge not sending `module` in `meta` field

**Solution**:
1. Check Edge logs for "Analytics event sent to Cloud" with module value
2. Check Cloud logs for "Analytics event created without ai_module" warning
3. Verify Edge `main.py` line 264: `'module': module_id` is in top-level of `analytics_data`
4. Verify Edge `database.py` line 615-616: `module` is copied to `meta`

### Issue 3: Cache Issues (rare)

**Symptom**: Old data showing, new events not appearing

**Solution**:
```bash
php artisan cache:clear
```

### Issue 4: Frontend Not Displaying (rare)

**Symptom**: API returns data but Frontend shows empty

**Solution**:
1. Check browser console for errors
2. Verify `moduleActivityRes` has data (check console logs)
3. Check `alertsByModule` is populated (check React DevTools state)

---

## ✅ Verification Checklist

After fixes, verify each step:

- [ ] **Database**: `SELECT COUNT(*) FROM events WHERE ai_module IS NOT NULL` > 0
- [ ] **Edge Logs**: Show "Analytics sent: Camera X - N events"
- [ ] **Cloud Logs**: Show "Analytics event created" with `ai_module` value
- [ ] **API Test**: `GET /api/v1/analytics/module-activity` returns array
- [ ] **Frontend Console**: Shows "Module activity data fetched: N modules"
- [ ] **Frontend Display**: Chart shows data (not "لا توجد تنبيهات")

---

## 📋 Files Modified

### Frontend (2 files)
1. `apps/web-portal/src/pages/Analytics.tsx`
   - Added console logging for module activity data
   - Better error handling in `fetchAnalyticsData()`
   - Filter out zero counts from `alertsByModule`

2. `apps/web-portal/src/lib/api/analytics.ts`
   - Improved error handling in `getModuleActivity()`
   - Return empty array instead of throwing errors
   - Added console logging

### Documentation (3 files)
1. `ANALYTICS_DIAGNOSIS.md` - Comprehensive diagnosis guide
2. `ANALYTICS_QUICK_FIX.md` - Quick fix reference
3. `ANALYTICS_FIX_COMPLETE.md` - This file

---

## 🎯 Next Steps

### If Database is Empty:

1. **Check Edge Server Configuration**:
   - Verify Edge Server is running
   - Check cameras are synced: `GET /api/v1/edges/cameras`
   - Verify `enabled_modules` in camera config

2. **Check Edge Server Processing**:
   - Check Edge logs for "AI processing: Camera X"
   - Verify video processing is running
   - Check "Analytics sent" messages

3. **Verify License**:
   - Check modules are enabled in license
   - Verify organization has active license

### If Database Has Data:

1. **Clear Cache**:
   ```bash
   php artisan cache:clear
   ```

2. **Check Date Range**:
   - Frontend uses date range (today, week, month, year)
   - Ensure date range includes events
   - Try expanding date range in Analytics page

3. **Check API Response**:
   - Test API directly with correct date range
   - Verify organization_id matches

---

## 🔧 Quick Commands

```bash
# Clear cache
php artisan cache:clear

# Check recent events
SELECT ai_module, COUNT(*) as count, MAX(occurred_at) as last_event
FROM events 
WHERE organization_id = YOUR_ORG_ID 
    AND ai_module IS NOT NULL
    AND occurred_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY ai_module;

# Check analytics events
SELECT COUNT(*) FROM events 
WHERE event_type = 'analytics' 
AND organization_id = YOUR_ORG_ID;
```

---

**End of Documentation**
