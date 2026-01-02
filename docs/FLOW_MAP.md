# FLOW_MAP.md - Core Business Flows & Endpoints

**Generated**: 2025-12-30  
**Purpose**: Document each core business flow with all endpoints involved

---

## Flow F1: Login → Dashboard

### Description
User logs in and views organization dashboard with statistics.

### Endpoints Sequence

1. **POST `/v1/auth/login`** (Public)
   - **Input**: `{ email, password }`
   - **Output**: `{ token, user }`
   - **Status**: ✅ Working
   - **Issues**: None

2. **GET `/v1/auth/me`** (Protected: auth:sanctum)
   - **Input**: Bearer token in header
   - **Output**: `{ id, name, email, role, organization_id, ... }`
   - **Status**: ✅ Working
   - **Issues**: None

3. **GET `/v1/dashboard`** (Protected: auth:sanctum)
   - **Input**: Bearer token (org_id derived from user)
   - **Output**: 
     ```json
     {
       "edge_servers": { "online": 0, "total": 0 },
       "cameras": { "online": 0, "total": 0 },
       "alerts": { "today": 0, "unresolved": 0 },
       "attendance": { "today": 0, "late": 0 },
       "visitors": { "today": 0, "trend": 0 },
       "recent_alerts": [],
       "weekly_stats": []
     }
     ```
   - **Status**: ⚠️ **PARTIAL** - Returns zeros, attendance/visitors always 0, weekly_stats empty
   - **Issues**: 
     - Attendance/visitors not implemented (hardcoded 0)
     - Weekly stats not implemented (empty array)
     - No caching

### Frontend Flow
- `Login.tsx` → `apiClient.post('/auth/login')` → Store token → Redirect to Dashboard
- `Dashboard.tsx` → `dashboardApi.getOrganization()` → Display stats

### Database Queries
- `users` table: Find by email, verify password
- `edge_servers` table: Count by organization_id
- `cameras` table: Count by organization_id
- `events` table: Count by organization_id and date

---

## Flow F2: SuperAdmin Create Org → Assign License → Set Plan

### Description
Super admin creates organization, assigns license, and sets subscription plan.

### Endpoints Sequence

1. **POST `/v1/organizations`** (Protected: auth:sanctum, Super Admin only)
   - **Input**: 
     ```json
     {
       "name": "Org Name",
       "subscription_plan": "basic",
       "max_cameras": 50,
       "max_edge_servers": 5,
       ...
     }
     ```
   - **Output**: `{ id, name, subscription_plan, max_cameras, ... } }`
   - **Status**: ✅ Working
   - **Issues**: None

2. **POST `/v1/licenses`** (Protected: auth:sanctum, Super Admin only)
   - **Input**: 
     ```json
     {
       "organization_id": 1,
       "plan": "basic",
       "max_cameras": 50,
       "expires_at": "2026-12-30",
       "modules": ["fire", "face", "counter"]
     }
     ```
   - **Output**: `{ id, license_key, organization_id, ... }`
   - **Status**: ✅ Working
   - **Issues**: None

3. **PUT `/v1/organizations/{id}/plan`** (Protected: auth:sanctum, Super Admin only)
   - **Input**: `{ subscription_plan: "premium" }`
   - **Output**: Updated organization
   - **Status**: ✅ Working
   - **Issues**: None

### Frontend Flow
- `Organizations.tsx` → Create org → `Licenses.tsx` → Create license → Link to org

### Database Queries
- `organizations` table: INSERT
- `licenses` table: INSERT with organization_id
- `subscription_plans` table: SELECT to get plan limits

### Issues
- ⚠️ No quota enforcement when creating resources (users, cameras, edges)
- ⚠️ Plan limits stored in organization but not enforced

---

## Flow F3: OrgAdmin Create User → Assign Role

### Description
Organization admin creates user and assigns role within their organization.

### Endpoints Sequence

1. **POST `/v1/users`** (Protected: auth:sanctum, Org Manager or Super Admin)
   - **Input**: 
     ```json
     {
       "name": "User Name",
       "email": "user@org.local",
       "password": "password123",
       "role": "editor",
       "organization_id": 1
     }
     ```
   - **Output**: `{ id, name, email, role, organization_id, ... }`
   - **Status**: ✅ Working
   - **Issues**: 
     - ⚠️ No quota check (can exceed plan limits)
     - ⚠️ No verification that organization_id matches user's org (for non-super-admin)

2. **PUT `/v1/users/{id}`** (Protected: auth:sanctum, Org Manager or Super Admin)
   - **Input**: `{ role: "admin" }`
   - **Output**: Updated user
   - **Status**: ✅ Working
   - **Issues**: ⚠️ No quota check

### Frontend Flow
- `Team.tsx` → Create user form → `usersApi.createUser()` → Display in list

### Database Queries
- `users` table: INSERT with organization_id
- `organizations` table: SELECT to verify org exists

### Authorization
- ✅ Non-super-admin users can only create users for their organization
- ✅ Role validation exists
- ⚠️ Missing: Plan quota enforcement

---

## Flow F4: OrgAdmin Create Edge → Bind License

### Description
Organization admin creates edge server and binds it to a license.

### Endpoints Sequence

1. **POST `/v1/edge-servers`** (Protected: auth:sanctum, Org Manager or Super Admin)
   - **Input**: 
     ```json
     {
       "name": "Edge Server 1",
       "location": "Building A",
       "license_id": 1,
       "internal_ip": "192.168.1.100",
       "hostname": "edge-01"
     }
     ```
   - **Output**: `{ id, edge_id, name, license_id, organization_id, ... }`
   - **Status**: ✅ Working
   - **Issues**: 
     - ⚠️ No quota check (can exceed plan limits)
     - ✅ Auto-links available license if none specified

2. **PUT `/v1/edge-servers/{id}`** (Protected: auth:sanctum, Org Manager or Super Admin)
   - **Input**: `{ license_id: 2 }`
   - **Output**: Updated edge server
   - **Status**: ✅ Working
   - **Issues**: ⚠️ No quota check

### Frontend Flow
- `Settings.tsx` → Servers tab → Add server form → `edgeServersApi.createEdgeServer()` → Display in list

### Database Queries
- `edge_servers` table: INSERT with organization_id, license_id
- `licenses` table: UPDATE edge_server_id to link license

### Authorization
- ✅ Non-super-admin users can only create edges for their organization
- ✅ License must belong to organization
- ⚠️ Missing: Plan quota enforcement

---

## Flow F5: OrgAdmin Create Camera → Assign to Edge → Sync

### Description
Organization admin creates camera, assigns to edge server, and syncs configuration.

### Endpoints Sequence

1. **POST `/v1/cameras`** (Protected: auth:sanctum, Editor+ or Super Admin)
   - **Input**: 
     ```json
     {
       "name": "Camera 1",
       "edge_server_id": 1,
       "rtsp_url": "rtsp://...",
       "location": "Entrance",
       "username": "admin",
       "password": "password",
       "resolution": "1920x1080",
       "fps": 15,
       "enabled_modules": ["fire", "face"]
     }
     ```
   - **Output**: `{ id, camera_id, name, edge_server_id, ... }`
   - **Status**: ⚠️ **PARTIAL**
   - **Issues**: 
     - ⚠️ No quota check
     - 🔴 **Sync to edge fails silently** if edge offline or missing IP
     - ⚠️ Admin sees success but edge didn't receive config

2. **PUT `/v1/cameras/{id}`** (Protected: auth:sanctum, Editor+ or Super Admin)
   - **Input**: `{ rtsp_url: "rtsp://new..." }`
   - **Output**: Updated camera
   - **Status**: ⚠️ **PARTIAL**
   - **Issues**: 
     - 🔴 **Sync to edge fails silently** if edge offline or missing IP

### Frontend Flow
- `Cameras.tsx` → Create camera form → `camerasApi.createCamera()` → Display in list
- UI shows success even if sync fails

### Database Queries
- `cameras` table: INSERT with organization_id, edge_server_id
- `edge_servers` table: SELECT to verify edge belongs to org

### Edge Sync Logic
- `CameraController::store()` calls `EdgeServerService::syncCameraToEdge()`
- If edge offline or IP missing, sync fails but returns success
- ⚠️ **No error returned to frontend**

---

## Flow F6: Edge Heartbeat → Fetch Cameras → Ingest Events

### Description
Edge server sends heartbeat, fetches camera configurations, and ingests events.

### Endpoints Sequence

1. **POST `/v1/edges/heartbeat`** (🔴 **PUBLIC - No Auth**)
   - **Input**: 
     ```json
     {
       "edge_id": "uuid-here",
       "version": "2.0.0",
       "online": true,
       "organization_id": 1,
       "license_id": 1,
       "system_info": { "internal_ip": "192.168.1.100", "hostname": "edge-01" },
       "cameras_status": [{"camera_id": "cam-1", "status": "online"}]
     }
     ```
   - **Output**: `{ ok: true, edge: {...} }`
   - **Status**: ✅ Working (bug fixed: $edge variable issue resolved)
   - **Issues**: 
     - 🔴 **No authentication** - accepts organization_id from request
     - 🔴 **No signature verification** - can be spoofed
     - ⚠️ Accepts organization_id from request without verification

2. **GET `/v1/edges/cameras`** (🔴 **PUBLIC - No Auth**)
   - **Input**: Query params: `organization_id=1&edge_id=uuid`
   - **Output**: 
     ```json
     {
       "cameras": [
         {
           "id": 1,
           "camera_id": "cam-1",
           "name": "Camera 1",
           "rtsp_url": "rtsp://...",
           "config": { "username": "...", "password": "***", ... }
         }
       ],
       "count": 1
     }
     ```
   - **Status**: ✅ Working
   - **Issues**: 
     - 🔴 **No authentication** - accepts organization_id from request
     - 🔴 **Leaks cameras** if organization_id is guessed
     - ⚠️ No rate limiting

3. **POST `/v1/edges/events`** (🔴 **PUBLIC - No Auth**)
   - **Input**: 
     ```json
     {
       "edge_id": "uuid-here",
       "event_type": "fire_detected",
       "severity": "critical",
       "occurred_at": "2025-12-30T10:00:00Z",
       "camera_id": "cam-1",
       "meta": { "module": "fire", "confidence": 0.95 }
     }
     ```
   - **Output**: `{ ok: true, event_id: 123 }`
   - **Status**: ✅ Working
   - **Issues**: 
     - 🔴 **No authentication** - can inject fake events
     - 🔴 **No rate limiting** - can be abused
     - ⚠️ Accepts edge_id without verification

### Frontend Flow
- Edge server Python code → `database.py::heartbeat()` → Cloud API
- Edge server → `database.py::get_cameras()` → Cloud API
- Edge server → `database.py::ingest_event()` → Cloud API

### Database Queries
- `edge_servers` table: UPDATE or CREATE with edge_id
- `cameras` table: SELECT by organization_id and edge_server_id
- `events` table: INSERT with organization_id derived from edge

### Security Issues
- 🔴 **All three endpoints are public** - no authentication
- 🔴 **No cryptographic signature** - can be spoofed
- 🔴 **No rate limiting** - can be abused
- ⚠️ Organization_id accepted from request without verification

---

## Flow F7: View Alerts → Acknowledge → Resolve

### Description
User views alerts, acknowledges them, and resolves them.

### Endpoints Sequence

1. **GET `/v1/alerts`** (Protected: auth:sanctum)
   - **Input**: Query params: `per_page=15&status=new`
   - **Output**: Paginated list of alerts (events with status)
   - **Status**: ✅ Working
   - **Issues**: None

2. **POST `/v1/alerts/{id}/acknowledge`** (Protected: auth:sanctum)
   - **Input**: None
   - **Output**: `{ id, status: "acknowledged", acknowledged_at: "..." }`
   - **Status**: ✅ Working
   - **Issues**: None

3. **POST `/v1/alerts/{id}/resolve`** (Protected: auth:sanctum)
   - **Input**: None
   - **Output**: `{ id, status: "resolved", resolved_at: "..." }`
   - **Status**: ✅ Working
   - **Issues**: None

### Frontend Flow
- `Alerts.tsx` → `alertsApi.getAlerts()` → Display list → Click acknowledge/resolve

### Database Queries
- `events` table: SELECT by organization_id, UPDATE acknowledged_at/resolved_at

---

## Flow F8: SuperAdmin View All Organizations

### Description
Super admin views list of all organizations.

### Endpoints Sequence

1. **GET `/v1/organizations`** (Protected: auth:sanctum)
   - **Input**: Query params: `per_page=15`
   - **Output**: Paginated list of organizations
   - **Status**: ⚠️ **BROKEN - Tenant Isolation**
   - **Issues**: 
     - 🔴 **Any authenticated user can list ALL organizations**
     - ⚠️ Should be restricted to Super Admin only OR user's own org

2. **GET `/v1/organizations/{id}`** (Protected: auth:sanctum)
   - **Input**: Organization ID in URL
   - **Output**: Organization details
   - **Status**: ⚠️ **BROKEN - Tenant Isolation**
   - **Issues**: 
     - 🔴 **Any authenticated user can view ANY organization**
     - ⚠️ Should verify membership or Super Admin

3. **GET `/v1/organizations/{id}/stats`** (Protected: auth:sanctum)
   - **Input**: Organization ID in URL
   - **Output**: Organization statistics
   - **Status**: ⚠️ **PARTIAL**
   - **Issues**: 
     - ⚠️ Wrong counts (returns 0 cameras, counts licenses as alerts)
     - 🔴 **Any authenticated user can view ANY org's stats**

### Frontend Flow
- `Organizations.tsx` → `organizationsApi.getOrganizations()` → Display list

### Database Queries
- `organizations` table: SELECT all (no filtering by user org)
- `cameras` table: COUNT by organization_id
- `licenses` table: COUNT by organization_id (wrongly used as alerts)

---

## Flow F9: Toggle User Active Status

### Description
Admin toggles user active/inactive status.

### Endpoints Sequence

1. **POST `/v1/users/{id}/toggle-active`** (Protected: auth:sanctum)
   - **Input**: None
   - **Output**: `{ id, is_active: true/false }`
   - **Status**: 🔴 **CRITICAL - Missing Authorization**
   - **Issues**: 
     - 🔴 **No authorization check** - any authenticated user can toggle any user
     - 🔴 **No organization check** - can toggle users from other orgs
     - ⚠️ Should verify: Super Admin OR (Org Manager AND same org)

### Frontend Flow
- `Team.tsx` → Click toggle button → `usersApi.toggleActive()` → Update UI

### Database Queries
- `users` table: UPDATE is_active

---

## Flow F10: Reset User Password

### Description
Admin resets user password.

### Endpoints Sequence

1. **POST `/v1/users/{id}/reset-password`** (Protected: auth:sanctum)
   - **Input**: None
   - **Output**: `{ message: "Password reset", new_password: "plaintext-password" }`
   - **Status**: 🔴 **CRITICAL - Security Breach**
   - **Issues**: 
     - 🔴 **No authorization check** - any authenticated user can reset any user's password
     - 🔴 **Returns plaintext password** - severe security breach
     - 🔴 **No organization check** - can reset passwords for users from other orgs
     - ⚠️ Should use Laravel password reset workflow (token-based)

### Frontend Flow
- `Team.tsx` → Click reset password → `usersApi.resetPassword()` → Display new password (INSECURE)

### Database Queries
- `users` table: UPDATE password (hashed)

---

## Flow F11: Restart Edge Server

### Description
Admin restarts edge server from control panel.

### Endpoints Sequence

1. **POST `/v1/edge-servers/{id}/restart`** (Protected: auth:sanctum)
   - **Input**: None
   - **Output**: `{ message: "Restart signal queued" }`
   - **Status**: 🔴 **UI-ONLY - Fake Functionality**
   - **Issues**: 
     - 🔴 **Only creates log entry** - no real command sent to edge
     - 🔴 **Missing authorization** - no check
     - ⚠️ Should actually send HTTP command to edge server or disable UI

### Frontend Flow
- `Settings.tsx` → Servers tab → Click restart → `edgeServersApi.restart()` → Shows success (FAKE)

### Database Queries
- `edge_server_logs` table: INSERT log entry

---

## Flow F12: Sync Camera Config to Edge

### Description
Admin syncs camera configuration to edge server.

### Endpoints Sequence

1. **POST `/v1/edge-servers/{id}/sync-config`** (Protected: auth:sanctum)
   - **Input**: None
   - **Output**: `{ message: "Sync request recorded" }`
   - **Status**: 🔴 **UI-ONLY - Fake Functionality**
   - **Issues**: 
     - 🔴 **Only creates log entry** - no real command sent to edge
     - 🔴 **Missing authorization** - no check
     - ⚠️ Should actually send HTTP command to edge server or disable UI

### Frontend Flow
- `Settings.tsx` → Servers tab → Click sync → `edgeServersApi.syncConfig()` → Shows success (FAKE)

### Database Queries
- `edge_server_logs` table: INSERT log entry

---

## Summary of Flow Issues

### 🔴 Critical Flows (Must Fix)
- **F6**: Edge endpoints are public, no auth, no rate limiting
- **F9**: Toggle user active - missing authorization
- **F10**: Reset password - missing authorization, returns plaintext
- **F11**: Restart edge - UI-only, no real command
- **F12**: Sync config - UI-only, no real command

### ⚠️ Partial Flows (Need Completion)
- **F1**: Dashboard returns zeros for attendance/visitors
- **F5**: Camera sync fails silently
- **F8**: Organization listing/viewing - tenant isolation broken

### ✅ Working Flows
- **F1**: Login works
- **F2**: Create org/license works
- **F3**: Create user works (but no quota)
- **F4**: Create edge works (but no quota)
- **F7**: Alerts work

---

**End of FLOW_MAP.md**
