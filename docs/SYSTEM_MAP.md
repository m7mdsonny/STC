# SYSTEM_MAP.md - Complete Route to Database Mapping

**Generated**: 2025-12-30  
**Purpose**: Map all API routes to their controllers, models, and database tables

---

## Route Structure Overview

All routes are under `/api/v1` prefix.

### Authentication Layer
- **Middleware**: `auth:sanctum` (Laravel Sanctum)
- **Public Routes**: Login, Register, Public Content, Edge Server endpoints (heartbeat, validate license, ingest events, get cameras)
- **Protected Routes**: Everything else requires `auth:sanctum`

---

## Public Endpoints (No Authentication Required)

| Route | Method | Controller | Method | Purpose | Security Risk |
|-------|--------|------------|--------|---------|---------------|
| `/v1/public/landing` | GET | PublicContentController | landing | Public landing page content | ✅ Safe |
| `/v1/public/contact` | POST | PublicContentController | submitContact | Submit contact form | ✅ Safe |
| `/v1/public/updates` | GET | UpdateAnnouncementController | publicIndex | Public update announcements | ✅ Safe |
| `/v1/branding` | GET | BrandingController | showPublic | Public branding settings | ✅ Safe |
| `/v1/auth/login` | POST | AuthController | login | User login | ✅ Safe |
| `/v1/auth/register` | POST | AuthController | register | User registration | ⚠️ No tenant linkage |
| `/v1/licensing/validate` | POST | LicenseController | validateKey | Validate license key | 🔴 **CRITICAL: Exposes org_id, modules, expiry** |
| `/v1/edges/heartbeat` | POST | EdgeController | heartbeat | Edge server heartbeat | 🔴 **CRITICAL: No auth, accepts org_id from request** |
| `/v1/edges/events` | POST | EventController | ingest | Ingest events from edge | 🔴 **CRITICAL: No auth, no rate limiting** |
| `/v1/edges/cameras` | GET | EdgeController | getCamerasForEdge | Get cameras for edge | 🔴 **CRITICAL: No auth, accepts org_id from request** |

---

## Protected Endpoints (auth:sanctum Required)

### Authentication & Profile

| Route | Method | Controller | Method | Model | DB Table | Authorization |
|-------|--------|------------|--------|-------|----------|---------------|
| `/v1/auth/logout` | POST | AuthController | logout | User | users | Self |
| `/v1/auth/me` | GET | AuthController | me | User | users | Self |
| `/v1/auth/profile` | PUT | AuthController | updateProfile | User | users | Self |
| `/v1/auth/password` | PUT | AuthController | changePassword | User | users | Self |

---

### Organizations

| Route | Method | Controller | Method | Model | DB Table | Authorization | Issues |
|-------|--------|------------|--------|-------|----------|---------------|--------|
| `/v1/organizations` | GET | OrganizationController | index | Organization | organizations | 🔴 **Any auth user can list ALL orgs** | ⚠️ Tenant isolation broken |
| `/v1/organizations` | POST | OrganizationController | store | Organization | organizations | Super Admin only | ✅ |
| `/v1/organizations/{id}` | GET | OrganizationController | show | Organization | organizations | 🔴 **Any auth user can view ANY org** | ⚠️ Tenant isolation broken |
| `/v1/organizations/{id}` | PUT | OrganizationController | update | Organization | organizations | Super Admin or org member | ⚠️ Partial check |
| `/v1/organizations/{id}` | DELETE | OrganizationController | destroy | Organization | organizations | Super Admin only | ⚠️ Orphaned data risk |
| `/v1/organizations/{id}/toggle-active` | POST | OrganizationController | toggleActive | Organization | organizations | 🔴 **Missing authorization check** | 🔴 Critical |
| `/v1/organizations/{id}/plan` | PUT | OrganizationController | updatePlan | Organization | organizations | Super Admin only | ✅ |
| `/v1/organizations/{id}/stats` | GET | OrganizationController | stats | Organization | organizations | Any auth user | ⚠️ Wrong counts |
| `/v1/organizations/{id}/upload-logo` | POST | OrganizationController | uploadLogo | Organization | organizations | Org member | ⚠️ Partial check |
| `/v1/organizations/{id}/sms-quota/consume` | POST | SmsQuotaController | consume | SMSQuota | sms_quotas | Any auth user | ⚠️ No org check |

---

### Users

| Route | Method | Controller | Method | Model | DB Table | Authorization | Issues |
|-------|--------|------------|--------|-------|----------|---------------|--------|
| `/v1/users` | GET | UserController | index | User | users | Org members see org users | ✅ |
| `/v1/users` | POST | UserController | store | User | users | Org manager or Super Admin | ⚠️ No quota check |
| `/v1/users/{id}` | GET | UserController | show | User | users | Org member or Super Admin | ✅ |
| `/v1/users/{id}` | PUT | UserController | update | User | users | Org manager or Super Admin | ⚠️ No quota check |
| `/v1/users/{id}` | DELETE | UserController | destroy | User | users | Org manager or Super Admin | ✅ |
| `/v1/users/{id}/reset-password` | POST | UserController | resetPassword | User | users | 🔴 **Missing authorization, returns plaintext password** | 🔴 Critical |
| `/v1/users/{id}/toggle-active` | POST | UserController | toggleActive | User | users | 🔴 **Missing authorization check** | 🔴 Critical |

---

### Licenses

| Route | Method | Controller | Method | Model | DB Table | Authorization | Issues |
|-------|--------|------------|--------|-------|----------|---------------|--------|
| `/v1/licenses` | GET | LicenseController | index | License | licenses | Org members see org licenses | ✅ |
| `/v1/licenses` | POST | LicenseController | store | License | licenses | Super Admin only | ✅ |
| `/v1/licenses/{id}` | GET | LicenseController | show | License | licenses | Org member or Super Admin | ✅ |
| `/v1/licenses/{id}` | PUT | LicenseController | update | License | licenses | Super Admin only | ✅ |
| `/v1/licenses/{id}` | DELETE | LicenseController | destroy | License | licenses | Super Admin only | ✅ |
| `/v1/licenses/{id}/activate` | POST | LicenseController | activate | License | licenses | Super Admin only | ✅ |
| `/v1/licenses/{id}/suspend` | POST | LicenseController | suspend | License | licenses | Super Admin only | ✅ |
| `/v1/licenses/{id}/renew` | POST | LicenseController | renew | License | licenses | Super Admin only | ✅ |
| `/v1/licenses/{id}/regenerate-key` | POST | LicenseController | regenerateKey | License | licenses | Super Admin only | ✅ |

---

### Edge Servers

| Route | Method | Controller | Method | Model | DB Table | Authorization | Issues |
|-------|--------|------------|--------|-------|----------|---------------|--------|
| `/v1/edge-servers` | GET | EdgeController | index | EdgeServer | edge_servers | Org members see org edges | ✅ |
| `/v1/edge-servers` | POST | EdgeController | store | EdgeServer | edge_servers | Org manager or Super Admin | ⚠️ No quota check |
| `/v1/edge-servers/{id}` | GET | EdgeController | show | EdgeServer | edge_servers | Org member or Super Admin | ✅ |
| `/v1/edge-servers/{id}` | PUT | EdgeController | update | EdgeServer | edge_servers | Org manager or Super Admin | ⚠️ No quota check |
| `/v1/edge-servers/{id}` | DELETE | EdgeController | destroy | EdgeServer | edge_servers | Org manager or Super Admin | ✅ |
| `/v1/edge-servers/{id}/logs` | GET | EdgeController | logs | EdgeServerLog | edge_server_logs | 🔴 **Missing authorization** | 🔴 Critical |
| `/v1/edge-servers/{id}/restart` | POST | EdgeController | restart | EdgeServer | edge_servers | 🔴 **UI-only: Only logs, no real command** | 🔴 Critical |
| `/v1/edge-servers/{id}/sync-config` | POST | EdgeController | syncConfig | EdgeServer | edge_servers | 🔴 **UI-only: Only logs, no real command** | 🔴 Critical |
| `/v1/edge-servers/{id}/config` | GET | EdgeController | config | EdgeServer | edge_servers | 🔴 **Missing authorization** | 🔴 Critical |

---

### Cameras

| Route | Method | Controller | Method | Model | DB Table | Authorization | Issues |
|-------|--------|------------|--------|-------|----------|---------------|--------|
| `/v1/cameras` | GET | CameraController | index | Camera | cameras | Org members see org cameras | ✅ |
| `/v1/cameras` | POST | CameraController | store | Camera | cameras | Editor+ or Super Admin | ⚠️ No quota check, sync fails silently |
| `/v1/cameras/{id}` | GET | CameraController | show | Camera | cameras | Org member or Super Admin | ✅ |
| `/v1/cameras/{id}` | PUT | CameraController | update | Camera | cameras | Editor+ or Super Admin | ⚠️ Sync fails silently |
| `/v1/cameras/{id}` | DELETE | CameraController | destroy | Camera | cameras | Editor+ or Super Admin | ✅ |
| `/v1/cameras/{id}/snapshot` | GET | CameraController | getSnapshot | Camera | cameras | Org member | ⚠️ Depends on ip_address, placeholder errors |
| `/v1/cameras/{id}/stream` | GET | CameraController | getStreamUrl | Camera | cameras | Org member | ⚠️ Depends on ip_address |
| `/v1/cameras/test-connection` | POST | CameraController | testConnection | Camera | cameras | Any auth user | ⚠️ URL validation may reject rtsp |

---

### Events & Analytics

| Route | Method | Controller | Method | Model | DB Table | Authorization | Issues |
|-------|--------|------------|--------|-------|----------|---------------|--------|
| `/v1/edges/events` | POST | EventController | ingest | Event | events | 🔴 **Public endpoint, no auth, no rate limiting** | 🔴 Critical |
| `/v1/analytics/summary` | GET | AnalyticsController | summary | Event | events | Org member | ⚠️ Mostly placeholder |
| `/v1/analytics/time-series` | GET | AnalyticsController | timeSeries | Event | events | Org member | ⚠️ Mostly placeholder |
| `/v1/analytics/by-location` | GET | AnalyticsController | byLocation | Event | events | Org member | ⚠️ Mostly placeholder |
| `/v1/analytics/by-module` | GET | AnalyticsController | byModule | Event | events | Org member | ⚠️ Mostly placeholder |

---

### Dashboard

| Route | Method | Controller | Method | Model | DB Table | Authorization | Issues |
|-------|--------|------------|--------|-------|----------|---------------|--------|
| `/v1/dashboard/admin` | GET | DashboardController | admin | Multiple | Multiple | Super Admin only | ⚠️ Revenue placeholder, no caching |
| `/v1/dashboard` | GET | DashboardController | organization | Multiple | Multiple | Org member | ⚠️ Returns zeros, incomplete analytics |

---

## Database Tables & Relationships

### Core Tables

| Table | Primary Key | Foreign Keys | Tenant Isolation | Notes |
|-------|-------------|--------------|------------------|-------|
| `users` | id | organization_id → organizations.id (nullable) | ✅ organization_id | Super admins have null org_id |
| `organizations` | id | distributor_id, reseller_id | N/A (root entity) | Has max_cameras, max_edge_servers |
| `licenses` | id | organization_id → organizations.id (cascade), edge_server_id → edge_servers.id (nullable) | ✅ organization_id NOT NULL | status, expires_at, max_cameras |
| `edge_servers` | id | organization_id → organizations.id (cascade), license_id → licenses.id (nullable) | ✅ organization_id NOT NULL | edge_id unique, online, last_seen_at |
| `cameras` | id | organization_id → organizations.id (cascade), edge_server_id → edge_servers.id (nullable) | ✅ organization_id NOT NULL | camera_id unique, status |
| `events` | id | organization_id → organizations.id (nullable), edge_server_id → edge_servers.id (nullable) | ⚠️ organization_id nullable | Should derive from edge_server |
| `edge_server_logs` | id | edge_server_id → edge_servers.id (cascade) | ⚠️ No org_id | Should have org_id for tenant isolation |
| `subscription_plans` | id | None | N/A | max_cameras, max_edge_servers, sms_quota |
| `sms_quotas` | id | organization_id → organizations.id | ✅ organization_id | monthly_limit, used_this_month |

### Missing Tables/Columns

- ❌ `organization_user` pivot table (if many-to-many membership needed)
- ⚠️ `edge_servers.edge_key` and `edge_servers.edge_secret` (for HMAC auth) - **MISSING**
- ⚠️ `edge_servers.internal_ip`, `edge_servers.public_ip`, `edge_servers.hostname` - **ADDED in recent migration**
- ⚠️ `licenses.edge_server_id` is `string` not `foreignId` - **FIXED in recent migration**

---

## Model → Controller → Route Mapping

### User Model
- **Controller**: `UserController`
- **Routes**: `/v1/users/*`
- **DB Table**: `users`
- **Relations**: `belongsTo(Organization)`
- **Mass Assignment**: ⚠️ Inherits `$guarded = []` from BaseModel

### Organization Model
- **Controller**: `OrganizationController`
- **Routes**: `/v1/organizations/*`
- **DB Table**: `organizations`
- **Relations**: `hasMany(User)`, `hasMany(License)`, `hasMany(EdgeServer)`, `hasMany(Camera)`
- **Mass Assignment**: ⚠️ Inherits `$guarded = []` from BaseModel

### License Model
- **Controller**: `LicenseController`
- **Routes**: `/v1/licenses/*`, `/v1/licensing/validate` (public)
- **DB Table**: `licenses`
- **Relations**: `belongsTo(Organization)`, `belongsTo(EdgeServer)`
- **Mass Assignment**: ⚠️ Inherits `$guarded = []` from BaseModel

### EdgeServer Model
- **Controller**: `EdgeController`
- **Routes**: `/v1/edge-servers/*`, `/v1/edges/heartbeat` (public), `/v1/edges/cameras` (public)
- **DB Table**: `edge_servers`
- **Relations**: `belongsTo(Organization)`, `belongsTo(License)`, `hasMany(Camera)`, `hasMany(EdgeServerLog)`
- **Mass Assignment**: ✅ Has `$fillable` array (recently added)

### Camera Model
- **Controller**: `CameraController`
- **Routes**: `/v1/cameras/*`
- **DB Table**: `cameras`
- **Relations**: `belongsTo(Organization)`, `belongsTo(EdgeServer)`
- **Mass Assignment**: ⚠️ Inherits `$guarded = []` from BaseModel

### Event Model
- **Controller**: `EventController`
- **Routes**: `/v1/edges/events` (public)
- **DB Table**: `events`
- **Relations**: `belongsTo(Organization)`, `belongsTo(EdgeServer)`
- **Mass Assignment**: ⚠️ Inherits `$guarded = []` from BaseModel

---

## Security Vulnerabilities Summary

### 🔴 CRITICAL (Must Fix Immediately)

1. **Public Endpoints Without Auth**:
   - `/v1/licensing/validate` - Exposes org_id, modules, expiry
   - `/v1/edges/heartbeat` - Accepts org_id from request, no verification
   - `/v1/edges/events` - No auth, no rate limiting, can inject fake events
   - `/v1/edges/cameras` - Accepts org_id from request, leaks cameras

2. **Missing Authorization**:
   - `UserController::toggleActive()` - No auth check
   - `UserController::resetPassword()` - No auth check, returns plaintext password
   - `OrganizationController::toggleActive()` - No auth check
   - `EdgeController::logs()` - No auth check
   - `EdgeController::config()` - No auth check

3. **Mass Assignment Vulnerability**:
   - `BaseModel` has `$guarded = []` - All models vulnerable
   - Attackers can set `is_super_admin`, `role`, `is_active`, `organization_id`, etc.

4. **UI-Only Features (Fake Functionality)**:
   - `EdgeController::restart()` - Only logs, no real command
   - `EdgeController::syncConfig()` - Only logs, no real command

### ⚠️ HIGH PRIORITY

1. **Tenant Isolation Broken**:
   - `OrganizationController::index()` - Any user can list all orgs
   - `OrganizationController::show()` - Any user can view any org
   - Controllers accept `organization_id` from request without membership verification

2. **No Plan Quota Enforcement**:
   - No checks before creating users, cameras, or edge servers
   - Revenue model broken

3. **Orphaned Data Risk**:
   - Deleting organization may leave orphaned data
   - Foreign keys have `nullOnDelete` instead of `cascadeOnDelete` in some cases

---

## Next Steps

1. **PHASE DB**: Complete database schema (add missing columns, fix foreign keys)
2. **PHASE B**: Fix all security vulnerabilities
3. **PHASE C**: Align UI with backend reality
4. **PHASE D**: Implement plan quota enforcement
5. **PHASE E**: Secure edge integration with HMAC

---

**End of SYSTEM_MAP.md**
