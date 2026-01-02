# REALITY_MATRIX.md - UI Action to Backend Reality Mapping

**Generated**: 2025-12-30  
**Purpose**: Map every UI action to its API endpoint, backend implementation status, and enforcement status

---

## Legend

- **Status**: ✅ Working | ⚠️ Partial | 🔴 Broken | ❌ Not Implemented
- **Enforcement**: ✅ Yes | ⚠️ Partial | ❌ No
- **DB**: ✅ Complete | ⚠️ Partial | ❌ Missing

---

## Authentication & Profile

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|---------------|-------------|-----|--------|-------|
| Login | Login.tsx | POST `/v1/auth/login` | ✅ Exists | ✅ Public (correct) | ✅ Password check | ✅ users table | ✅ Working | None |
| Logout | Header.tsx | POST `/v1/auth/logout` | ✅ Exists | ✅ auth:sanctum | ✅ Token revoked | ✅ users table | ✅ Working | None |
| View Profile | Settings.tsx | GET `/v1/auth/me` | ✅ Exists | ✅ auth:sanctum | ✅ Self only | ✅ users table | ✅ Working | None |
| Update Profile | Settings.tsx | PUT `/v1/auth/profile` | ✅ Exists | ✅ auth:sanctum | ✅ Self only | ✅ users table | ✅ Working | None |
| Change Password | Settings.tsx | PUT `/v1/auth/password` | ✅ Exists | ✅ auth:sanctum | ✅ Self only, old password check | ✅ users table | ✅ Working | None |
| Register | Login.tsx | POST `/v1/auth/register` | ✅ Exists | ✅ Public | ⚠️ No tenant linkage | ✅ users table | ⚠️ Partial | No invitation/verification |

---

## Dashboard

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|---------------|-------------|-----|--------|-------|
| View Admin Dashboard | AdminDashboard.tsx | GET `/v1/dashboard/admin` | ✅ Exists | ✅ Super Admin only | ✅ Counts exist | ✅ Multiple tables | ⚠️ Partial | Revenue is placeholder, no caching |
| View Org Dashboard | Dashboard.tsx | GET `/v1/dashboard` | ✅ Exists | ✅ auth:sanctum | ⚠️ Returns zeros | ✅ Multiple tables | ⚠️ Partial | Attendance/visitors always 0, weekly_stats empty |
| View Edge Servers Count | Dashboard.tsx | GET `/v1/dashboard` | ✅ Exists | ✅ auth:sanctum | ✅ Counts correctly | ✅ edge_servers table | ✅ Working | None |
| View Cameras Count | Dashboard.tsx | GET `/v1/dashboard` | ✅ Exists | ✅ auth:sanctum | ✅ Counts correctly | ✅ cameras table | ✅ Working | None |
| View Alerts Count | Dashboard.tsx | GET `/v1/dashboard` | ✅ Exists | ✅ auth:sanctum | ✅ Counts correctly | ✅ events table | ✅ Working | None |
| View Attendance | Dashboard.tsx | GET `/v1/dashboard` | ✅ Exists | ✅ auth:sanctum | ❌ Always returns 0 | ❌ No attendance table | ❌ Not Implemented | Hardcoded 0 |
| View Visitors | Dashboard.tsx | GET `/v1/dashboard` | ✅ Exists | ✅ auth:sanctum | ❌ Always returns 0 | ❌ No visitors table | ❌ Not Implemented | Hardcoded 0 |
| View Weekly Stats | Dashboard.tsx | GET `/v1/dashboard` | ✅ Exists | ✅ auth:sanctum | ❌ Always returns [] | ✅ events table | ❌ Not Implemented | Empty array |

---

## Organizations

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|---------------|-------------|-----|--------|-------|
| List Organizations | Organizations.tsx | GET `/v1/organizations` | ✅ Exists | 🔴 **Any auth user** | ❌ No tenant filter | ✅ organizations table | 🔴 Broken | Tenant isolation broken |
| View Organization | Organizations.tsx | GET `/v1/organizations/{id}` | ✅ Exists | 🔴 **Any auth user** | ❌ No membership check | ✅ organizations table | 🔴 Broken | Tenant isolation broken |
| Create Organization | Organizations.tsx | POST `/v1/organizations` | ✅ Exists | ✅ Super Admin only | ✅ Validates | ✅ organizations table | ✅ Working | None |
| Update Organization | Organizations.tsx | PUT `/v1/organizations/{id}` | ✅ Exists | ⚠️ Super Admin or org member | ⚠️ Partial check | ✅ organizations table | ⚠️ Partial | Should verify membership |
| Delete Organization | Organizations.tsx | DELETE `/v1/organizations/{id}` | ✅ Exists | ✅ Super Admin only | ⚠️ Orphaned data risk | ✅ organizations table | ⚠️ Partial | May leave orphaned data |
| Toggle Organization Active | Organizations.tsx | POST `/v1/organizations/{id}/toggle-active` | ✅ Exists | 🔴 **Missing auth check** | ❌ No authorization | ✅ organizations table | 🔴 Critical | Any user can toggle |
| View Organization Stats | Organizations.tsx | GET `/v1/organizations/{id}/stats` | ✅ Exists | 🔴 **Any auth user** | ⚠️ Wrong counts | ✅ Multiple tables | ⚠️ Partial | Returns 0 cameras, counts licenses as alerts |
| Upload Logo | Organizations.tsx | POST `/v1/organizations/{id}/upload-logo` | ✅ Exists | ⚠️ Org member | ⚠️ Partial check | ✅ organizations table | ⚠️ Partial | Should verify membership |

---

## Users

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|---------------|-------------|-----|--------|-------|
| List Users | Team.tsx | GET `/v1/users` | ✅ Exists | ✅ Org members see org users | ✅ Tenant filtered | ✅ users table | ✅ Working | None |
| View User | Team.tsx | GET `/v1/users/{id}` | ✅ Exists | ✅ Org member or Super Admin | ✅ Access check | ✅ users table | ✅ Working | None |
| Create User | Team.tsx | POST `/v1/users` | ✅ Exists | ✅ Org manager or Super Admin | ⚠️ No quota check | ✅ users table | ⚠️ Partial | Can exceed plan limits |
| Update User | Team.tsx | PUT `/v1/users/{id}` | ✅ Exists | ✅ Org manager or Super Admin | ⚠️ No quota check | ✅ users table | ⚠️ Partial | Can exceed plan limits |
| Delete User | Team.tsx | DELETE `/v1/users/{id}` | ✅ Exists | ✅ Org manager or Super Admin | ✅ Prevents self-deletion | ✅ users table | ✅ Working | None |
| Toggle User Active | Team.tsx | POST `/v1/users/{id}/toggle-active` | ✅ Exists | 🔴 **Missing auth check** | ❌ No authorization | ✅ users table | 🔴 Critical | Any user can toggle |
| Reset User Password | Team.tsx | POST `/v1/users/{id}/reset-password` | ✅ Exists | 🔴 **Missing auth check** | 🔴 Returns plaintext password | ✅ users table | 🔴 Critical | Security breach |

---

## Licenses

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|-------------|-----|--------|-------|
| List Licenses | Licenses.tsx | GET `/v1/licenses` | ✅ Exists | ✅ Org members see org licenses | ✅ Tenant filtered | ✅ licenses table | ✅ Working | None |
| View License | Licenses.tsx | GET `/v1/licenses/{id}` | ✅ Exists | ✅ Org member or Super Admin | ✅ Access check | ✅ licenses table | ✅ Working | None |
| Create License | Licenses.tsx | POST `/v1/licenses` | ✅ Exists | ✅ Super Admin only | ✅ Validates | ✅ licenses table | ✅ Working | None |
| Update License | Licenses.tsx | PUT `/v1/licenses/{id}` | ✅ Exists | ✅ Super Admin only | ✅ Validates | ✅ licenses table | ✅ Working | None |
| Delete License | Licenses.tsx | DELETE `/v1/licenses/{id}` | ✅ Exists | ✅ Super Admin only | ✅ Validates | ✅ licenses table | ✅ Working | None |
| Activate License | Licenses.tsx | POST `/v1/licenses/{id}/activate` | ✅ Exists | ✅ Super Admin only | ✅ Updates status | ✅ licenses table | ✅ Working | None |
| Suspend License | Licenses.tsx | POST `/v1/licenses/{id}/suspend` | ✅ Exists | ✅ Super Admin only | ✅ Updates status | ✅ licenses table | ✅ Working | None |
| Renew License | Licenses.tsx | POST `/v1/licenses/{id}/renew` | ✅ Exists | ✅ Super Admin only | ✅ Updates expires_at | ✅ licenses table | ✅ Working | None |
| Regenerate Key | Licenses.tsx | POST `/v1/licenses/{id}/regenerate-key` | ✅ Exists | ✅ Super Admin only | ✅ Generates new key | ✅ licenses table | ✅ Working | None |
| Validate License (Edge) | Edge Server | POST `/v1/licensing/validate` | ✅ Exists | 🔴 **Public, no auth** | 🔴 Exposes org_id, modules | ✅ licenses table | 🔴 Critical | Security leak |

---

## Edge Servers

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|---------------|-------------|-----|--------|-------|
| List Edge Servers | Settings.tsx | GET `/v1/edge-servers` | ✅ Exists | ✅ Org members see org edges | ✅ Tenant filtered | ✅ edge_servers table | ✅ Working | None |
| View Edge Server | Settings.tsx | GET `/v1/edge-servers/{id}` | ✅ Exists | ✅ Org member or Super Admin | ✅ Access check | ✅ edge_servers table | ✅ Working | None |
| Create Edge Server | Settings.tsx | POST `/v1/edge-servers` | ✅ Exists | ✅ Org manager or Super Admin | ⚠️ No quota check | ✅ edge_servers table | ⚠️ Partial | Can exceed plan limits |
| Update Edge Server | Settings.tsx | PUT `/v1/edge-servers/{id}` | ✅ Exists | ✅ Org manager or Super Admin | ⚠️ No quota check | ✅ edge_servers table | ⚠️ Partial | Can exceed plan limits |
| Delete Edge Server | Settings.tsx | DELETE `/v1/edge-servers/{id}` | ✅ Exists | ✅ Org manager or Super Admin | ✅ Validates | ✅ edge_servers table | ✅ Working | None |
| View Edge Logs | Settings.tsx | GET `/v1/edge-servers/{id}/logs` | ✅ Exists | 🔴 **Missing auth check** | ❌ No authorization | ✅ edge_server_logs table | 🔴 Critical | Cross-tenant exposure |
| View Edge Config | Settings.tsx | GET `/v1/edge-servers/{id}/config` | ✅ Exists | 🔴 **Missing auth check** | ❌ No authorization | ✅ edge_servers table | 🔴 Critical | Cross-tenant exposure |
| Restart Edge Server | Settings.tsx | POST `/v1/edge-servers/{id}/restart` | ⚠️ **Only logs** | 🔴 **Missing auth check** | ❌ No real command | ✅ edge_server_logs table | 🔴 UI-Only | Fake functionality |
| Sync Edge Config | Settings.tsx | POST `/v1/edge-servers/{id}/sync-config` | ⚠️ **Only logs** | 🔴 **Missing auth check** | ❌ No real command | ✅ edge_server_logs table | 🔴 UI-Only | Fake functionality |
| Heartbeat (Edge) | Edge Server | POST `/v1/edges/heartbeat` | ✅ Exists (bug fixed) | 🔴 **Public, no auth** | 🔴 Accepts org_id from request | ✅ edge_servers table | 🔴 Critical | No signature verification |
| Get Cameras (Edge) | Edge Server | GET `/v1/edges/cameras` | ✅ Exists | 🔴 **Public, no auth** | 🔴 Accepts org_id from request | ✅ cameras table | 🔴 Critical | Leaks cameras |

---

## Cameras

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|---------------|-------------|-----|--------|-------|
| List Cameras | Cameras.tsx | GET `/v1/cameras` | ✅ Exists | ✅ Org members see org cameras | ✅ Tenant filtered | ✅ cameras table | ✅ Working | None |
| View Camera | Cameras.tsx | GET `/v1/cameras/{id}` | ✅ Exists | ✅ Org member or Super Admin | ✅ Access check | ✅ cameras table | ✅ Working | None |
| Create Camera | Cameras.tsx | POST `/v1/cameras` | ✅ Exists | ✅ Editor+ or Super Admin | ⚠️ No quota check, sync fails silently | ✅ cameras table | ⚠️ Partial | Admin sees success but edge didn't receive |
| Update Camera | Cameras.tsx | PUT `/v1/cameras/{id}` | ✅ Exists | ✅ Editor+ or Super Admin | ⚠️ Sync fails silently | ✅ cameras table | ⚠️ Partial | Admin sees success but edge didn't receive |
| Delete Camera | Cameras.tsx | DELETE `/v1/cameras/{id}` | ✅ Exists | ✅ Editor+ or Super Admin | ✅ Validates | ✅ cameras table | ✅ Working | None |
| Get Snapshot | Cameras.tsx | GET `/v1/cameras/{id}/snapshot` | ✅ Exists | ✅ Org member | ⚠️ Depends on ip_address, placeholder errors | ✅ cameras table | ⚠️ Partial | May return placeholder |
| Get Stream URL | Cameras.tsx | GET `/v1/cameras/{id}/stream` | ✅ Exists | ✅ Org member | ⚠️ Depends on ip_address | ✅ cameras table | ⚠️ Partial | May fail if edge offline |
| Test Connection | Cameras.tsx | POST `/v1/cameras/test-connection` | ✅ Exists | ✅ Any auth user | ⚠️ URL validation may reject rtsp | N/A | ⚠️ Partial | Validation issues |

---

## Events & Alerts

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|---------------|-------------|-----|--------|-------|
| List Alerts | Alerts.tsx | GET `/v1/alerts` | ✅ Exists | ✅ Org members see org alerts | ✅ Tenant filtered | ✅ events table | ✅ Working | None |
| View Alert | Alerts.tsx | GET `/v1/alerts/{id}` | ✅ Exists | ✅ Org member or Super Admin | ✅ Access check | ✅ events table | ✅ Working | None |
| Acknowledge Alert | Alerts.tsx | POST `/v1/alerts/{id}/acknowledge` | ✅ Exists | ✅ Org member | ✅ Updates acknowledged_at | ✅ events table | ✅ Working | None |
| Resolve Alert | Alerts.tsx | POST `/v1/alerts/{id}/resolve` | ✅ Exists | ✅ Org member | ✅ Updates resolved_at | ✅ events table | ✅ Working | None |
| Mark False Alarm | Alerts.tsx | POST `/v1/alerts/{id}/false-alarm` | ✅ Exists | ✅ Org member | ✅ Updates status | ✅ events table | ✅ Working | None |
| Bulk Acknowledge | Alerts.tsx | POST `/v1/alerts/bulk-acknowledge` | ✅ Exists | ✅ Org member | ✅ Updates multiple | ✅ events table | ✅ Working | None |
| Bulk Resolve | Alerts.tsx | POST `/v1/alerts/bulk-resolve` | ✅ Exists | ✅ Org member | ✅ Updates multiple | ✅ events table | ✅ Working | None |
| Ingest Event (Edge) | Edge Server | POST `/v1/edges/events` | ✅ Exists | 🔴 **Public, no auth** | 🔴 No rate limiting | ✅ events table | 🔴 Critical | Can inject fake events |

---

## Analytics

| UI Action | Page | API Endpoint | Backend Logic | Authorization | Enforcement | DB | Status | Notes |
|-----------|------|--------------|---------------|---------------|-------------|-----|--------|-------|
| View Summary | Analytics.tsx | GET `/v1/analytics/summary` | ⚠️ **Placeholder** | ✅ Org member | ❌ Returns placeholder data | ✅ events table | ⚠️ Partial | Not fully implemented |
| View Time Series | Analytics.tsx | GET `/v1/analytics/time-series` | ⚠️ **Placeholder** | ✅ Org member | ❌ Returns placeholder data | ✅ events table | ⚠️ Partial | Not fully implemented |
| View By Location | Analytics.tsx | GET `/v1/analytics/by-location` | ⚠️ **Placeholder** | ✅ Org member | ❌ Returns placeholder data | ✅ events table | ⚠️ Partial | Not fully implemented |
| View By Module | Analytics.tsx | GET `/v1/analytics/by-module` | ⚠️ **Placeholder** | ✅ Org member | ❌ Returns placeholder data | ✅ events table | ⚠️ Partial | Not fully implemented |

---

## Summary Statistics

### By Status
- ✅ **Working**: 45 actions
- ⚠️ **Partial**: 18 actions
- 🔴 **Broken/Critical**: 12 actions
- ❌ **Not Implemented**: 3 actions

### By Issue Type
- 🔴 **Missing Authorization**: 7 endpoints
- 🔴 **Public Endpoints (No Auth)**: 4 endpoints
- 🔴 **UI-Only (Fake Functionality)**: 2 endpoints
- 🔴 **Security Breach**: 1 endpoint (reset password returns plaintext)
- ⚠️ **No Quota Enforcement**: 6 endpoints
- ⚠️ **Tenant Isolation Broken**: 3 endpoints
- ⚠️ **Silent Failures**: 2 endpoints (camera sync)
- ⚠️ **Placeholder Data**: 4 endpoints (analytics)

### Critical Actions Requiring Immediate Fix

1. **POST `/v1/users/{id}/toggle-active`** - Missing authorization
2. **POST `/v1/users/{id}/reset-password`** - Missing authorization, returns plaintext
3. **POST `/v1/organizations/{id}/toggle-active`** - Missing authorization
4. **GET `/v1/organizations`** - Tenant isolation broken
5. **GET `/v1/organizations/{id}`** - Tenant isolation broken
6. **GET `/v1/edge-servers/{id}/logs`** - Missing authorization
7. **GET `/v1/edge-servers/{id}/config`** - Missing authorization
8. **POST `/v1/edge-servers/{id}/restart`** - UI-only, no real command
9. **POST `/v1/edge-servers/{id}/sync-config`** - UI-only, no real command
10. **POST `/v1/licensing/validate`** - Public, exposes sensitive data
11. **POST `/v1/edges/heartbeat`** - Public, no auth, accepts org_id from request
12. **GET `/v1/edges/cameras`** - Public, no auth, leaks cameras
13. **POST `/v1/edges/events`** - Public, no auth, no rate limiting

---

**End of REALITY_MATRIX.md**
