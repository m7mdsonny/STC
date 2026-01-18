# Analytics Pipeline - Complete Flow Check

## Flow Analysis

### 1. Edge Server → Cloud (Event Creation)

**File**: `apps/edge-server/main.py` (line 260-271)
```python
analytics_data = {
    'camera_id': camera_id,
    'type': 'analytics',
    'severity': 'info',
    'module': module_id,  # ✅ Top level
    'metadata': {
        'module': module_id,  # ✅ Also in metadata
        ...
    },
}
await state.db.submit_analytics(analytics_data)
```

**File**: `apps/edge-server/app/core/database.py` (line 721-725)
```python
async def submit_analytics(self, analytics_data: Dict) -> bool:
    return await self.create_event({
        **analytics_data,  # ✅ Spreads module from top level
        "type": "analytics"
    })
```

**File**: `apps/edge-server/app/core/database.py` (line 615-616, 622-624)
```python
if 'module' in alert_data:
    meta['module'] = alert_data['module']  # ✅ Copies module to meta
    
for key in ['module', ...]:  # ✅ Also processes module
    if key in alert_data:
        meta[key] = alert_data[key]
```

**Payload sent to Cloud**:
```json
{
    "edge_id": "...",
    "event_type": "analytics",
    "severity": "info",
    "camera_id": "...",
    "meta": {
        "module": "fire",  // ✅ Module is in meta
        "detections": [...],
        ...
    }
}
```

### 2. Cloud → Database (Event Storage)

**File**: `apps/cloud-laravel/app/Http/Controllers/EventController.php` (line 60-61)
```php
$meta = $request->input('meta', []);
$aiModule = $meta['module'] ?? null;  // ✅ Extracts from meta.module
```

**File**: `apps/cloud-laravel/app/Http/Controllers/EventController.php` (line 100-105)
```php
Event::create([
    'event_type' => $request->event_type,  // ✅ "analytics"
    'ai_module' => $aiModule,  // ✅ Extracted from meta.module
    ...
]);
```

### 3. Cloud → Frontend (Data Query)

**File**: `apps/cloud-laravel/app/Http/Controllers/AnalyticsController.php` (line 277)
```php
$data = $this->analyticsService->getModuleActivity($organizationId, $startDate, $endDate);
```

**File**: `apps/cloud-laravel/app/Services/AnalyticsService.php` (line 551-553)
```php
return Cache::remember($cacheKey, 30, function () use (...) {
    return $this->getByModule($organizationId, $startDate, $endDate);
});
```

**File**: `apps/cloud-laravel/app/Services/AnalyticsService.php` (line 305-306)
```php
$query = Event::where('organization_id', $organizationId)
    ->whereNotNull('ai_module');  // ✅ Filters events with ai_module
```

## Potential Issues

### Issue 1: Events without ai_module
- **Cause**: `module` not in `meta` when sent from Edge Server
- **Check**: Look for "Analytics event created without ai_module" in logs

### Issue 2: No analytics events being created
- **Cause**: Cameras not processing video, or no detections
- **Check**: Edge Server logs for "Analytics sent: Camera X - N analytics event(s)"

### Issue 3: Cache issues
- **Cause**: Cache TTL (30 seconds) might be too short, or cache not clearing
- **Check**: Test with `/api/v1/analytics/debug/test-query`

### Issue 4: Frontend not displaying data
- **Cause**: API call fails, or data format mismatch
- **Check**: Browser console for errors, Network tab for API responses

## Diagnostic Steps

1. **Check Edge Server Logs**:
   - Look for "Analytics sent: Camera X - N analytics event(s)"
   - Look for "Analytics event sent to Cloud: module=X"

2. **Check Cloud Logs**:
   - Look for "Analytics event created" entries
   - Check for "Analytics event created without ai_module" warnings

3. **Check Database**:
   ```sql
   SELECT COUNT(*) FROM events WHERE event_type = 'analytics';
   SELECT COUNT(*) FROM events WHERE event_type = 'analytics' AND ai_module IS NOT NULL;
   SELECT ai_module, COUNT(*) FROM events WHERE event_type = 'analytics' GROUP BY ai_module;
   ```

4. **Use Debug Endpoints**:
   - `GET /api/v1/analytics/debug/pipeline-status`
   - `GET /api/v1/analytics/debug/test-query`

5. **Check Frontend**:
   - Browser console for errors
   - Network tab: Check `/api/v1/analytics/module-activity` response
