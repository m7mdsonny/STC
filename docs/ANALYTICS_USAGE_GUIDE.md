# Analytics & Reporting Usage Guide

## Quick Start

### Backend API Endpoints

#### Analytics Endpoints

**Time Series**
```http
GET /api/v1/analytics/time-series?organization_id=1&group_by=day&start_date=2025-01-21&end_date=2025-01-28
```

**By Module**
```http
GET /api/v1/analytics/by-module?organization_id=1&start_date=2025-01-21&end_date=2025-01-28
```

**By Camera**
```http
GET /api/v1/analytics/by-camera?organization_id=1&start_date=2025-01-21&end_date=2025-01-28
```

**By Severity**
```http
GET /api/v1/analytics/by-severity?organization_id=1&start_date=2025-01-21&end_date=2025-01-28
```

**High Risk Events**
```http
GET /api/v1/analytics/high-risk?organization_id=1&threshold=80&start_date=2025-01-21&end_date=2025-01-28
```

**Top Cameras**
```http
GET /api/v1/analytics/top-cameras?organization_id=1&limit=10&start_date=2025-01-21&end_date=2025-01-28
```

**Module Activity**
```http
GET /api/v1/analytics/module-activity?organization_id=1&start_date=2025-01-21&end_date=2025-01-28
```

**Weekly Trend**
```http
GET /api/v1/analytics/weekly-trend?organization_id=1
```

**Today's Alerts**
```http
GET /api/v1/analytics/today-alerts?organization_id=1
```

#### Reporting Endpoints

**Daily Report**
```http
GET /api/v1/reports/daily?organization_id=1&date=2025-01-28
```

**Weekly Report**
```http
GET /api/v1/reports/weekly?organization_id=1&week_start=2025-01-21
```

**Monthly Report**
```http
GET /api/v1/reports/monthly?organization_id=1&month=2025-01
```

**Custom Date Range**
```http
GET /api/v1/reports/custom?organization_id=1&start_date=2025-01-21&end_date=2025-01-28
```

**CSV Export**
```http
GET /api/v1/reports/export/csv?organization_id=1&start_date=2025-01-21&end_date=2025-01-28&camera_id=cam_001&ai_module=fire_detection
```

**PDF Export**
```http
GET /api/v1/reports/export/pdf?organization_id=1&start_date=2025-01-21&end_date=2025-01-28
```

### Frontend Usage

#### Analytics API

```typescript
import { analyticsApi } from '../lib/api/analytics';

// Get time series
const timeSeries = await analyticsApi.getTimeSeries({
  organization_id: '1',
  group_by: 'day',
  start_date: '2025-01-21',
  end_date: '2025-01-28',
});

// Get by module
const byModule = await analyticsApi.getByModule({
  organization_id: '1',
  start_date: '2025-01-21',
  end_date: '2025-01-28',
});

// Get high risk events
const highRisk = await analyticsApi.getHighRisk({
  organization_id: '1',
  threshold: 80,
  start_date: '2025-01-21',
  end_date: '2025-01-28',
});

// Get today's alerts
const todayAlerts = await analyticsApi.getTodayAlerts({
  organization_id: '1',
});
```

#### Reports API

```typescript
import { reportsApi } from '../lib/api/reports';

// Get daily report
const dailyReport = await reportsApi.getDaily({
  organization_id: '1',
  date: '2025-01-28',
});

// Get weekly report
const weeklyReport = await reportsApi.getWeekly({
  organization_id: '1',
  week_start: '2025-01-21',
});

// Get monthly report
const monthlyReport = await reportsApi.getMonthly({
  organization_id: '1',
  month: '2025-01',
});

// Get custom date range report
const customReport = await reportsApi.getCustom({
  organization_id: '1',
  start_date: '2025-01-21',
  end_date: '2025-01-28',
  camera_id: 'cam_001', // Optional filter
  ai_module: 'fire_detection', // Optional filter
  severity: 'critical', // Optional filter
});

// Export CSV
await reportsApi.exportCsv({
  organization_id: '1',
  start_date: '2025-01-21',
  end_date: '2025-01-28',
  camera_id: 'cam_001', // Optional
});

// Export PDF
await reportsApi.exportPdf({
  organization_id: '1',
  start_date: '2025-01-21',
  end_date: '2025-01-28',
});
```

## Caching

All analytics queries are cached:
- **Heavy queries**: 5 minutes TTL
- **Today's data**: 1 minute TTL

Cache keys include:
- Organization ID
- Date range
- Filters (camera_id, ai_module, severity)

To clear cache (if needed):
```php
$analyticsService->clearCache($organizationId);
```

## Performance

### Indexes Used

All queries use optimized indexes:
- `organization_id` - Tenant isolation
- `ai_module` - Module-based queries
- `risk_score` - Risk-based filtering
- `camera_id` - Camera-based queries
- `occurred_at` - Time-based queries
- Composite: `(organization_id, ai_module, occurred_at)` - Common analytics queries

### Query Optimization

- Uses SQL aggregation (no in-memory processing)
- Limits results where appropriate (Top N queries)
- Uses indexes for fast lookups
- Caches heavy queries

## Event Normalization

When events are ingested, the system automatically:
1. Extracts `ai_module` from `meta->module`
2. Extracts `risk_score` from `meta->risk_score`
3. Stores in dedicated columns for fast queries

**Example Event Ingestion**:
```json
{
  "event_type": "fire_detection",
  "severity": "critical",
  "occurred_at": "2025-01-28T10:30:00Z",
  "camera_id": "cam_001",
  "meta": {
    "module": "fire_detection",
    "risk_score": 95,
    "temperature": 120,
    "location": "Warehouse A"
  }
}
```

After ingestion:
- `ai_module` = "fire_detection"
- `risk_score` = 95
- `meta` = full JSON (preserved)

## Dashboard Integration

The Dashboard automatically:
1. Fetches today's alerts count from analytics API
2. Displays module activity
3. Shows high risk events count
4. Updates weekly stats using optimized queries

**Loading States**:
- Shows "-" while loading
- Shows 0 when no data
- Falls back gracefully on errors

## Report Formats

### CSV Export
- UTF-8 encoding with BOM
- Includes: ID, Event Type, AI Module, Severity, Risk Score, Camera ID, Occurred At, Title, Description
- Filterable by date range, camera, module, severity

### PDF Export
- HTML-based (printable)
- Includes:
  - Organization branding
  - Summary statistics
  - Module breakdown table
  - Severity breakdown table
  - Time series data
  - Footer with timestamp
- RTL support for Arabic

## Filtering

All endpoints support filtering:
- `camera_id` - Filter by specific camera
- `ai_module` - Filter by AI module
- `severity` - Filter by severity level
- `start_date` - Start of date range
- `end_date` - End of date range

**Example**:
```http
GET /api/v1/analytics/time-series?organization_id=1&camera_id=cam_001&ai_module=fire_detection&severity=critical&start_date=2025-01-21&end_date=2025-01-28
```

## Error Handling

All endpoints:
- Return 400 if organization_id is missing
- Return 401 if not authenticated
- Return 403 if organization access denied
- Return 500 on server errors

Frontend:
- Catches errors gracefully
- Shows fallback values
- Logs errors to console

---

**Last Updated**: 2025-01-28
