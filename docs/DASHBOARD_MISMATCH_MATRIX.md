# Dashboard Mismatch Matrix

## Comparison: Expected vs Actual

| Metric | Expected Source | Actual Source | Status | Notes |
|--------|----------------|---------------|--------|-------|
| **Users Count** | `users` table | `User::count()` | ✅ Match | Correct |
| **Organizations Count** | `organizations` table | `Organization::count()` | ✅ Match | Correct |
| **Active Organizations** | `organizations.is_active = 1` | `Organization::where('is_active', true)->count()` | ✅ Match | Correct |
| **Edge Servers Total** | `edge_servers` table | `EdgeServer::count()` | ✅ Match | Correct |
| **Edge Servers Online** | `edge_servers.online = 1` | `EdgeServer::where('online', true)->count()` | ✅ Match | Correct |
| **Cameras Total** | `cameras` table | `Camera::count()` | ✅ Match | Correct |
| **Cameras Online** | `cameras.status = 'online'` | `Camera::where('status', 'online')->count()` | ⚠️ Partial | Uses `status` field, not `online` |
| **Licenses Active** | `licenses.status = 'active'` | `License::where('status', 'active')->count()` | ✅ Match | Correct |
| **Alerts Today** | `events` table with date filter | `Event::whereDate('occurred_at', now())->count()` | ✅ Match | Correct |
| **Revenue This Month** | Calculated from licenses | `License::with('subscriptionPlan')->sum(...)` | ✅ Match | Correct |
| **Module Status** | `ai_modules` + `ai_module_configs` | ❌ NOT IMPLEMENTED | ❌ Missing | No endpoint exists |
| **Last Activity** | Various tables (last_login_at, last_seen_at, etc.) | ⚠️ Partial | Only events timestamps | Missing user login, server sync |
| **Error Summary** | Log files or error table | ❌ NOT IMPLEMENTED | ❌ Missing | No aggregation |
| **Health Status** | System checks | ❌ NOT IMPLEMENTED | ❌ Missing | No health endpoint |
| **Attendance** | Attendance table | ❌ NOT IMPLEMENTED | ❌ Missing | Hardcoded to 0 |

## Frontend vs Backend Mismatches

| Frontend Expectation | Backend Provides | Status |
|---------------------|-------------------|--------|
| `revenue_previous_month` | ❌ Not provided | ❌ Missing |
| `revenue_year_total` | ❌ Not provided | ❌ Missing |
| `module_status` | ❌ Not provided | ❌ Missing |
| `system_health` | ❌ Not provided | ❌ Missing |
| `error_summary` | ❌ Not provided | ❌ Missing |
| `last_activity` | ⚠️ Partial (only events) | ⚠️ Incomplete |
| `attendance.today` | ❌ Hardcoded to 0 | ❌ Missing |

## Data Type Mismatches

| Field | Expected Type | Actual Type | Issue |
|-------|--------------|-------------|-------|
| `cameras.online` | boolean | string ('online'/'offline') | Type inconsistency |
| `edge_servers.online` | boolean | boolean | ✅ Correct |
| `visitors.today` | number | number | ✅ Correct |
| `visitors.trend` | number (percentage) | number (percentage) | ✅ Correct |

## Permission Mismatches

| Endpoint | Expected Permission | Actual Permission | Status |
|----------|-------------------|-------------------|--------|
| `/dashboard/admin` | Super Admin only | `ensureSuperAdmin()` | ✅ Correct |
| `/dashboard` | Organization member | User with `organization_id` | ✅ Correct |

## Response Structure Mismatches

### Admin Dashboard Response
```json
{
  "total_organizations": 10,
  "active_organizations": 8,
  "total_edge_servers": 25,
  "online_edge_servers": 20,
  "total_cameras": 100,
  "alerts_today": 15,
  "revenue_this_month": 50000,
  "total_users": 50,
  "active_licenses": 8,
  "organizations_by_plan": [...]
}
```
**Missing Fields:**
- `revenue_previous_month`
- `revenue_year_total`
- `module_status`
- `system_health`
- `error_summary`
- `last_activity`

### Organization Dashboard Response
```json
{
  "organization_name": "Example Org",
  "edge_servers": { "online": 2, "total": 3 },
  "cameras": { "online": 10, "total": 15 },
  "alerts": { "today": 5, "unresolved": 12 },
  "attendance": { "today": 0, "late": 0 },
  "visitors": { "today": 150, "trend": 5.2 },
  "recent_alerts": [...],
  "weekly_stats": [...]
}
```
**Missing Fields:**
- `module_status` (per module)
- `last_activity` (per module/service)
- `error_summary`
- `health_status`

## Recommendations

1. **Implement Missing Endpoints:**
   - Add module status tracking
   - Add health check endpoint
   - Add error aggregation
   - Add activity tracking

2. **Fix Data Type Inconsistencies:**
   - Standardize camera status (use boolean or enum)
   - Ensure consistent date formats

3. **Complete Revenue Data:**
   - Calculate previous month revenue
   - Calculate year-to-date total

4. **Add Attendance Tracking:**
   - Implement attendance table/model
   - Add attendance endpoints
   - Update dashboard to show real data

5. **Add Caching:**
   - Cache dashboard responses
   - Invalidate on data changes
   - Use Redis for distributed caching
