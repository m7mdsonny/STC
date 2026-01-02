# DATABASE_MODEL.md - Complete Database Schema Documentation

**Generated**: 2025-12-30  
**Purpose**: Complete documentation of database tables, columns, relationships, constraints, and indexes

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Relationships](#relationships)
3. [Constraints](#constraints)
4. [Indexes](#indexes)
5. [Tenant Isolation](#tenant-isolation)
6. [Missing Tables/Columns](#missing-tablescolumns)

---

## Core Tables

### 1. `distributors`

**Purpose**: Master distributors in the system

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| name | varchar(255) | NO | - | Distributor name |
| contact_email | varchar(255) | YES | NULL | Contact email |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: None  
**Foreign Keys**: None  
**Tenant Isolation**: N/A (root entity)

---

### 2. `organizations`

**Purpose**: Tenant organizations (multi-tenant root)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| distributor_id | bigint unsigned | YES | NULL | FK → distributors.id |
| reseller_id | bigint unsigned | YES | NULL | FK → resellers.id |
| name | varchar(255) | NO | - | Organization name |
| name_en | varchar(255) | YES | NULL | English name |
| logo_url | varchar(255) | YES | NULL | Logo URL |
| address | varchar(255) | YES | NULL | Physical address |
| city | varchar(255) | YES | NULL | City |
| phone | varchar(255) | YES | NULL | Phone number |
| email | varchar(255) | YES | NULL | Contact email |
| tax_number | varchar(255) | YES | NULL | Tax ID |
| subscription_plan | varchar(255) | NO | 'basic' | Plan name |
| max_cameras | int unsigned | NO | 4 | Plan quota |
| max_edge_servers | int unsigned | NO | 1 | Plan quota |
| is_active | boolean | NO | true | Active status |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: 
- `organizations_distributor_id_foreign` (distributor_id)
- `organizations_reseller_id_foreign` (reseller_id)

**Foreign Keys**:
- `distributor_id` → `distributors.id` (nullOnDelete)
- `reseller_id` → `resellers.id` (nullOnDelete)

**Tenant Isolation**: N/A (root entity)

---

### 3. `users`

**Purpose**: System users (can belong to organization or be super admin)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| organization_id | bigint unsigned | YES | NULL | FK → organizations.id (Super admins have NULL) |
| name | varchar(255) | NO | - | User name |
| email | varchar(255) | NO | - | Unique email |
| password | varchar(255) | NO | - | Hashed password |
| phone | varchar(255) | YES | NULL | Phone number |
| role | varchar(255) | NO | 'org_admin' | User role |
| is_active | boolean | NO | true | Active status |
| is_super_admin | boolean | NO | false | Super admin flag |
| last_login_at | timestamp | YES | NULL | Last login timestamp |
| remember_token | varchar(100) | YES | NULL | Remember me token |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: 
- `users_email_unique` (email) - UNIQUE
- `users_organization_id_index` (organization_id) - **ADDED in migration**
- `users_role_index` (role) - **ADDED in migration**
- `users_is_active_index` (is_active) - **ADDED in migration**

**Foreign Keys**:
- `organization_id` → `organizations.id` (nullOnDelete)

**Tenant Isolation**: ✅ `organization_id` (nullable for super admins)

---

### 4. `subscription_plans`

**Purpose**: Available subscription plans

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| name | varchar(255) | NO | - | Plan name (unique) |
| name_ar | varchar(255) | NO | - | Arabic name |
| max_cameras | int unsigned | NO | 4 | Camera quota |
| max_edge_servers | int unsigned | NO | 1 | Edge server quota |
| available_modules | json | YES | NULL | Available AI modules |
| notification_channels | json | YES | NULL | Notification channels |
| price_monthly | decimal(10,2) | YES | NULL | Monthly price |
| price_yearly | decimal(10,2) | YES | NULL | Yearly price |
| is_active | boolean | NO | true | Active status |
| sms_quota | int unsigned | YES | NULL | SMS quota per month |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: None  
**Foreign Keys**: None  
**Tenant Isolation**: N/A (global entity)

---

### 5. `licenses`

**Purpose**: Organization licenses (binds org to plan and edge server)

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| organization_id | bigint unsigned | NO | - | FK → organizations.id (NOT NULL) |
| subscription_plan_id | bigint unsigned | YES | NULL | FK → subscription_plans.id |
| plan | varchar(255) | NO | 'basic' | Plan name |
| license_key | varchar(255) | NO | - | Unique license key |
| status | varchar(255) | NO | 'active' | License status |
| edge_server_id | bigint unsigned | YES | NULL | FK → edge_servers.id (FIXED: was string) |
| max_cameras | int unsigned | NO | 4 | Camera quota |
| modules | json | YES | NULL | Enabled modules |
| trial_ends_at | timestamp | YES | NULL | Trial end date |
| activated_at | timestamp | YES | NULL | Activation date |
| expires_at | timestamp | YES | NULL | Expiration date |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: 
- `licenses_license_key_unique` (license_key) - UNIQUE
- `licenses_organization_id_index` (organization_id) - **ADDED in migration**
- `licenses_status_index` (status) - **ADDED in migration**
- `licenses_edge_server_id_index` (edge_server_id) - **ADDED in migration**

**Foreign Keys**:
- `organization_id` → `organizations.id` (cascadeOnDelete) ✅ NOT NULL
- `subscription_plan_id` → `subscription_plans.id` (nullOnDelete)
- `edge_server_id` → `edge_servers.id` (nullOnDelete) ✅ FIXED: Now foreignId

**Tenant Isolation**: ✅ `organization_id` NOT NULL

---

### 6. `edge_servers`

**Purpose**: Edge server instances

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| organization_id | bigint unsigned | NO | - | FK → organizations.id (NOT NULL) |
| license_id | bigint unsigned | YES | NULL | FK → licenses.id |
| edge_id | varchar(255) | NO | - | Unique edge identifier |
| edge_key | varchar(255) | YES | NULL | **ADDED: For HMAC auth** |
| edge_secret | varchar(255) | YES | NULL | **ADDED: For HMAC auth** |
| name | varchar(255) | YES | NULL | Display name |
| hardware_id | varchar(255) | YES | NULL | Hardware identifier |
| ip_address | varchar(255) | YES | NULL | Public IP |
| internal_ip | varchar(255) | YES | NULL | **ADDED: Internal IP** |
| public_ip | varchar(255) | YES | NULL | **ADDED: Public IP** |
| hostname | varchar(255) | YES | NULL | **ADDED: Hostname** |
| version | varchar(255) | YES | NULL | Edge server version |
| location | varchar(255) | YES | NULL | Physical location |
| notes | text | YES | NULL | Notes |
| online | boolean | NO | false | Online status |
| last_seen_at | timestamp | YES | NULL | Last heartbeat |
| system_info | json | YES | NULL | System information |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: 
- `edge_servers_edge_id_unique` (edge_id) - UNIQUE
- `edge_servers_edge_key_unique` (edge_key) - UNIQUE (if not null) - **ADDED**
- `edge_servers_organization_id_index` (organization_id) - **ADDED in migration**
- `edge_servers_license_id_index` (license_id) - **ADDED in migration**
- `edge_servers_online_index` (online) - **ADDED in migration**
- `edge_servers_last_seen_at_index` (last_seen_at) - **ADDED in migration**

**Foreign Keys**:
- `organization_id` → `organizations.id` (cascadeOnDelete) ✅ NOT NULL
- `license_id` → `licenses.id` (nullOnDelete)

**Tenant Isolation**: ✅ `organization_id` NOT NULL

---

### 7. `cameras`

**Purpose**: Camera instances

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| organization_id | bigint unsigned | NO | - | FK → organizations.id (NOT NULL) |
| edge_server_id | bigint unsigned | YES | NULL | FK → edge_servers.id |
| camera_id | varchar(255) | NO | - | Unique camera identifier |
| name | varchar(255) | NO | - | Display name |
| location | varchar(255) | YES | NULL | Physical location |
| rtsp_url | varchar(500) | YES | NULL | RTSP stream URL |
| status | varchar(255) | NO | 'offline' | Camera status |
| config | json | YES | NULL | Camera configuration |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: 
- `cameras_camera_id_unique` (camera_id) - UNIQUE
- `cameras_organization_id_index` (organization_id)
- `cameras_edge_server_id_index` (edge_server_id)
- `cameras_status_index` (status)

**Foreign Keys**:
- `organization_id` → `organizations.id` (cascadeOnDelete) ✅ NOT NULL
- `edge_server_id` → `edge_servers.id` (nullOnDelete)

**Tenant Isolation**: ✅ `organization_id` NOT NULL

---

### 8. `events`

**Purpose**: Events/alerts from edge servers

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| organization_id | bigint unsigned | YES | NULL | FK → organizations.id (⚠️ Nullable) |
| edge_server_id | bigint unsigned | YES | NULL | FK → edge_servers.id |
| edge_id | varchar(255) | NO | - | Edge identifier |
| event_type | varchar(255) | NO | - | Event type |
| severity | varchar(255) | NO | - | Severity level |
| occurred_at | timestamp | NO | - | Event timestamp |
| meta | json | YES | NULL | Event metadata |
| acknowledged_at | timestamp | YES | NULL | Acknowledgment timestamp |
| resolved_at | timestamp | YES | NULL | Resolution timestamp |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: 
- `events_organization_id_index` (organization_id) - **ADDED in migration**
- `events_edge_server_id_index` (edge_server_id) - **ADDED in migration**
- `events_occurred_at_index` (occurred_at) - **ADDED in migration**

**Foreign Keys**:
- `organization_id` → `organizations.id` (nullOnDelete) ⚠️ **Nullable** (should derive from edge_server)
- `edge_server_id` → `edge_servers.id` (nullOnDelete)

**Tenant Isolation**: ⚠️ `organization_id` nullable (populated from edge_server in migration)

---

### 9. `edge_server_logs`

**Purpose**: Logs from edge servers

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | bigint unsigned | NO | auto_increment | Primary Key |
| organization_id | bigint unsigned | NO | - | FK → organizations.id (NOT NULL) - **ADDED** |
| edge_server_id | bigint unsigned | NO | - | FK → edge_servers.id |
| level | varchar(255) | NO | 'info' | Log level |
| message | text | NO | - | Log message |
| meta | json | YES | NULL | Log metadata |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | Soft Delete |

**Indexes**: 
- `edge_server_logs_organization_id_index` (organization_id) - **ADDED in migration**
- `edge_server_logs_edge_server_id_index` (edge_server_id)

**Foreign Keys**:
- `organization_id` → `organizations.id` (cascadeOnDelete) ✅ **ADDED: NOT NULL**
- `edge_server_id` → `edge_servers.id` (cascadeOnDelete)

**Tenant Isolation**: ✅ `organization_id` NOT NULL (added in migration)

---

## Relationships

### Organization Hierarchy
```
distributors (1) ──→ (N) organizations
resellers (1) ──→ (N) organizations
organizations (1) ──→ (N) users
organizations (1) ──→ (N) licenses
organizations (1) ──→ (N) edge_servers
organizations (1) ──→ (N) cameras
organizations (1) ──→ (N) events
organizations (1) ──→ (N) edge_server_logs
```

### License & Edge Binding
```
licenses (1) ──→ (1) edge_servers (via edge_server_id)
edge_servers (1) ──→ (N) cameras
edge_servers (1) ──→ (N) events
edge_servers (1) ──→ (N) edge_server_logs
```

### Plan & License
```
subscription_plans (1) ──→ (N) licenses
licenses (N) ──→ (1) organizations
```

---

## Constraints

### Unique Constraints

| Table | Column(s) | Constraint Name |
|-------|-----------|-----------------|
| users | email | users_email_unique |
| licenses | license_key | licenses_license_key_unique |
| edge_servers | edge_id | edge_servers_edge_id_unique |
| edge_servers | edge_key | edge_servers_edge_key_unique (if not null) |
| cameras | camera_id | cameras_camera_id_unique |

### Foreign Key Constraints

| Table | Column | References | On Delete | On Update |
|-------|--------|------------|-----------|------------|
| organizations | distributor_id | distributors.id | SET NULL | CASCADE |
| organizations | reseller_id | resellers.id | SET NULL | CASCADE |
| users | organization_id | organizations.id | SET NULL | CASCADE |
| licenses | organization_id | organizations.id | CASCADE | CASCADE ✅ |
| licenses | subscription_plan_id | subscription_plans.id | SET NULL | CASCADE |
| licenses | edge_server_id | edge_servers.id | SET NULL | CASCADE ✅ FIXED |
| edge_servers | organization_id | organizations.id | CASCADE | CASCADE ✅ |
| edge_servers | license_id | licenses.id | SET NULL | CASCADE |
| cameras | organization_id | organizations.id | CASCADE | CASCADE ✅ |
| cameras | edge_server_id | edge_servers.id | SET NULL | CASCADE |
| events | organization_id | organizations.id | SET NULL | CASCADE ⚠️ |
| events | edge_server_id | edge_servers.id | SET NULL | CASCADE |
| edge_server_logs | organization_id | organizations.id | CASCADE | CASCADE ✅ ADDED |
| edge_server_logs | edge_server_id | edge_servers.id | CASCADE | CASCADE |

---

## Indexes

### Performance Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | users_organization_id_index | organization_id | Tenant filtering |
| users | users_role_index | role | Role-based queries |
| users | users_is_active_index | is_active | Active user filtering |
| licenses | licenses_organization_id_index | organization_id | Tenant filtering |
| licenses | licenses_status_index | status | Status filtering |
| licenses | licenses_edge_server_id_index | edge_server_id | Edge-l license lookup |
| edge_servers | edge_servers_organization_id_index | organization_id | Tenant filtering |
| edge_servers | edge_servers_license_id_index | license_id | License lookup |
| edge_servers | edge_servers_online_index | online | Online status filtering |
| edge_servers | edge_servers_last_seen_at_index | last_seen_at | Recent activity |
| cameras | cameras_organization_id_index | organization_id | Tenant filtering |
| cameras | cameras_edge_server_id_index | edge_server_id | Edge-camera lookup |
| cameras | cameras_status_index | status | Status filtering |
| events | events_organization_id_index | organization_id | Tenant filtering |
| events | events_edge_server_id_index | edge_server_id | Edge-event lookup |
| events | events_occurred_at_index | occurred_at | Time-based queries |
| edge_server_logs | edge_server_logs_organization_id_index | organization_id | Tenant filtering |
| edge_server_logs | edge_server_logs_edge_server_id_index | edge_server_id | Edge-log lookup |

---

## Tenant Isolation

### ✅ Properly Isolated Tables (organization_id NOT NULL)

- `licenses` - organization_id NOT NULL
- `edge_servers` - organization_id NOT NULL
- `cameras` - organization_id NOT NULL
- `edge_server_logs` - organization_id NOT NULL (added in migration)

### ⚠️ Partially Isolated Tables

- `events` - organization_id nullable (populated from edge_server in migration)
- `users` - organization_id nullable (super admins have NULL)

### ❌ Not Isolated (Global Tables)

- `distributors`
- `resellers`
- `subscription_plans`
- `ai_modules`
- `platform_contents`

---

## Missing Tables/Columns

### ✅ Fixed in Migrations

1. **edge_servers.edge_key** - Added for HMAC authentication
2. **edge_servers.edge_secret** - Added for HMAC authentication
3. **edge_servers.internal_ip** - Added (in previous migration)
4. **edge_servers.public_ip** - Added (in previous migration)
5. **edge_servers.hostname** - Added (in previous migration)
6. **edge_server_logs.organization_id** - Added for tenant isolation
7. **licenses.edge_server_id** - Fixed from string to foreignId

### ❌ Still Missing (If Needed)

1. **organization_user** pivot table - If many-to-many membership needed
2. **audit_logs** table - For tracking all changes (if required)
3. **sessions** table - If using database sessions

---

## Database Integrity Rules

### Cascade Rules

1. **Delete Organization** → Cascades to:
   - licenses (CASCADE)
   - edge_servers (CASCADE)
   - cameras (CASCADE)
   - edge_server_logs (CASCADE)
   - events (SET NULL - should be CASCADE or derive)

2. **Delete Edge Server** → Cascades to:
   - cameras (SET NULL)
   - events (SET NULL)
   - edge_server_logs (CASCADE)
   - licenses.edge_server_id (SET NULL)

3. **Delete License** → Cascades to:
   - edge_servers.license_id (SET NULL)

### Orphan Prevention

- ✅ Organizations cannot be deleted if they have active licenses (CASCADE prevents orphan)
- ✅ Edge servers cannot exist without organization (CASCADE)
- ✅ Cameras cannot exist without organization (CASCADE)
- ⚠️ Events can exist without organization (nullable) - should derive from edge_server

---

## Seeder Requirements

### Baseline Data Required

1. **Subscription Plans** - At least one plan (basic, premium, etc.)
2. **Super Admin User** - Created from env variables
3. **Demo Organization** (optional) - For testing
4. **Demo License** (optional) - For testing

### Seeder Status

- ✅ `DatabaseSeeder` exists
- ✅ Idempotent (checks `doesntExist()`)
- ✅ Creates baseline data
- ⚠️ Should create super admin from env

---

## Migration Checklist

### ✅ Completed

- [x] Fix `licenses.edge_server_id` from string to foreignId
- [x] Add `edge_servers.internal_ip`, `public_ip`, `hostname`
- [x] Add `edge_servers.edge_key`, `edge_secret` for HMAC
- [x] Add `edge_server_logs.organization_id` for tenant isolation
- [x] Add performance indexes
- [x] Populate null organization_id in events from edge_server

### ⚠️ Recommended (Future)

- [ ] Make `events.organization_id` NOT NULL (requires data migration)
- [ ] Add `audit_logs` table if needed
- [ ] Add composite indexes for common queries
- [ ] Add full-text indexes for search if needed

---

**End of DATABASE_MODEL.md**
