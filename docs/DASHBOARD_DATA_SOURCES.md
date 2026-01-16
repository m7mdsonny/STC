# Dashboard Data Sources

## Direct Database Queries

### Admin Dashboard

```sql
-- Total Organizations
SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL;

-- Active Organizations
SELECT COUNT(*) FROM organizations WHERE is_active = 1 AND deleted_at IS NULL;

-- Total Edge Servers
SELECT COUNT(*) FROM edge_servers WHERE deleted_at IS NULL;

-- Online Edge Servers
SELECT COUNT(*) FROM edge_servers WHERE online = 1 AND deleted_at IS NULL;

-- Total Cameras
SELECT COUNT(*) FROM cameras WHERE deleted_at IS NULL;

-- Today's Alerts
SELECT COUNT(*) FROM events 
WHERE DATE(occurred_at) = CURDATE() AND deleted_at IS NULL;

-- Total Users
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;

-- Active Licenses
SELECT COUNT(*) FROM licenses 
WHERE status = 'active' AND deleted_at IS NULL;

-- Revenue This Month (from active licenses)
SELECT SUM(sp.price_monthly) 
FROM licenses l
JOIN subscription_plans sp ON l.subscription_plan_id = sp.id
WHERE l.status = 'active' 
  AND l.deleted_at IS NULL
  AND sp.deleted_at IS NULL;
```

### Organization Dashboard

```sql
-- Organization Name
SELECT name FROM organizations WHERE id = ? AND deleted_at IS NULL;

-- Edge Servers (per organization)
SELECT COUNT(*) as total, 
       SUM(CASE WHEN online = 1 THEN 1 ELSE 0 END) as online
FROM edge_servers 
WHERE organization_id = ? AND deleted_at IS NULL;

-- Cameras (per organization)
SELECT COUNT(*) as total,
       SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online
FROM cameras
WHERE organization_id = ? AND deleted_at IS NULL;

-- Today's Alerts (per organization)
SELECT COUNT(*) FROM events
WHERE organization_id = ?
  AND DATE(occurred_at) = CURDATE()
  AND deleted_at IS NULL;

-- Unresolved Alerts (per organization)
SELECT COUNT(*) FROM events
WHERE organization_id = ?
  AND resolved_at IS NULL
  AND deleted_at IS NULL;

-- Recent Alerts (per organization)
SELECT id, event_type, severity, title, occurred_at, resolved_at, acknowledged_at, meta
FROM events
WHERE organization_id = ?
  AND deleted_at IS NULL
ORDER BY occurred_at DESC
LIMIT 10;

-- Visitors Today (per organization)
SELECT COUNT(*) FROM events
WHERE organization_id = ?
  AND DATE(occurred_at) = CURDATE()
  AND (
    event_type = 'people_detected' 
    OR ai_module = 'people_counter'
    OR JSON_CONTAINS(meta, '"people_counter"', '$.module')
  )
  AND deleted_at IS NULL;
```

## API Endpoints

### Current Endpoints

1. `GET /api/v1/dashboard/admin` - Admin dashboard data
2. `GET /api/v1/dashboard` - Organization dashboard data

### Missing Endpoints (Recommended)

1. `GET /api/v1/dashboard/modules` - Module status per organization
2. `GET /api/v1/dashboard/health` - System health status
3. `GET /api/v1/dashboard/errors` - Error/warning summary
4. `GET /api/v1/dashboard/activity` - Last activity timestamps
5. `GET /api/v1/dashboard/revenue` - Extended revenue data

## Data Flow

```
Frontend (Dashboard.tsx / AdminDashboard.tsx)
    ↓
API Client (dashboard.ts)
    ↓
Backend Controller (DashboardController.php)
    ↓
Eloquent Models / Services
    ↓
Database (MySQL)
```

## Caching Strategy

Currently: **NO CACHING**

Recommended:
- Cache dashboard data for 30 seconds
- Invalidate on data changes (events, servers, cameras)
- Use Redis for distributed caching

## Performance Considerations

1. **N+1 Query Problem:**
   - Current: Multiple separate queries
   - Risk: High for large datasets
   - Solution: Use eager loading with `with()`

2. **Aggregation Queries:**
   - Current: Some aggregations done in PHP
   - Better: Use SQL aggregations (COUNT, SUM, GROUP BY)

3. **Real-time Updates:**
   - Current: Polling on frontend
   - Better: WebSocket or Server-Sent Events

## Data Validation

All dashboard queries should:
1. Filter by `deleted_at IS NULL` (soft deletes)
2. Check organization access permissions
3. Handle missing data gracefully
4. Return consistent JSON structure
