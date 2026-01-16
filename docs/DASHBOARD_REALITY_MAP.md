# Dashboard Reality Map

## Overview
This document maps the current dashboard implementation to the actual database state and API endpoints.

## Current Dashboard Endpoints

### Admin Dashboard (`/api/v1/dashboard/admin`)
**Controller:** `DashboardController::admin()`
**Data Sources:**
- `Organization::count()` - Total organizations
- `Organization::where('is_active', true)->count()` - Active organizations
- `EdgeServer::count()` - Total edge servers
- `EdgeServer::where('online', true)->count()` - Online servers
- `Camera::count()` - Total cameras
- `Event::whereDate('occurred_at', now()->toDateString())->count()` - Today's alerts
- `User::count()` - Total users
- `License::where('status', 'active')->count()` - Active licenses
- Revenue calculation from active licenses with subscription plans

**Missing/Incomplete Data:**
- Module status (Active/Disabled/Broken) - NOT IMPLEMENTED
- Last activity timestamps - PARTIAL (only events)
- Error/warning summary from logs - NOT IMPLEMENTED
- Health status per service - NOT IMPLEMENTED
- Revenue previous month/year - NOT IMPLEMENTED

### Organization Dashboard (`/api/v1/dashboard`)
**Controller:** `DashboardController::organization()`
**Data Sources:**
- `Organization::find($organizationId)` - Organization name
- `EdgeServer::where('organization_id', $organizationId)->get()` - Edge servers
- `Camera::where('organization_id', $organizationId)->get()` - Cameras
- `AnalyticsService::getTodayAlertsCount($organizationId)` - Today's alerts
- `Event::where('organization_id', $organizationId)->whereNull('resolved_at')->count()` - Unresolved alerts
- `Event::where('organization_id', $organizationId)->orderByDesc('occurred_at')->limit(10)->get()` - Recent alerts
- `Event::where('organization_id', $organizationId)->whereDate('occurred_at', ...)` - Visitors count

**Missing/Incomplete Data:**
- Module status per organization - NOT IMPLEMENTED
- Last activity per module - NOT IMPLEMENTED
- Error/warning summary - NOT IMPLEMENTED
- Health status - NOT IMPLEMENTED
- Attendance tracking - TODO (hardcoded to 0)

## Database Tables Referenced

1. **organizations** - Organization data
2. **edge_servers** - Edge server status and info
3. **cameras** - Camera status and info
4. **events** - Alerts and activity
5. **users** - User count
6. **licenses** - License status and limits
7. **subscription_plans** - Plan details for revenue calculation
8. **ai_modules** - AI module definitions (NOT USED in dashboard)
9. **ai_module_configs** - Module configurations per camera (NOT USED in dashboard)

## Frontend Components

### Admin Dashboard (`AdminDashboard.tsx`)
- Displays: Organizations, Edge Servers, Cameras, Alerts, Revenue
- Missing: Module status, Health, Error summary

### Organization Dashboard (`Dashboard.tsx`)
- Displays: Cameras, Servers, Alerts, Visitors, Weekly stats, AI Policy
- Missing: Module status, Last activity, Error summary, Health

## Gaps Identified

1. **Module Status Tracking:**
   - No endpoint to check if modules are active/disabled/broken
   - No tracking of module failures or errors
   - No last activity timestamp per module

2. **Error/Warning Summary:**
   - No aggregation of errors from logs
   - No warning count
   - No error categorization

3. **Health Status:**
   - No service health monitoring
   - No database connection status
   - No API response time tracking
   - No cache status

4. **Activity Timestamps:**
   - Only event timestamps available
   - No last login per user
   - No last sync per edge server
   - No last update per module

5. **Revenue Tracking:**
   - Only current month revenue
   - No previous month comparison
   - No year-to-date total

## Recommendations

1. Add `ModuleStatusService` to track module health
2. Add `HealthCheckService` for system health monitoring
3. Add `ErrorAggregationService` to summarize errors from logs
4. Extend `DashboardController` with new endpoints for missing data
5. Update frontend to display new metrics
