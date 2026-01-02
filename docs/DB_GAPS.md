# DB_GAPS.md - Schema Gap Report

**Generated**: 2025-12-30  
**Purpose**: Identify all fields used in code that may not exist in database migrations

---

## Methodology

1. Scan all Models for `$fillable`, `$casts`, and relationships
2. Scan all Controllers for field usage in validation and queries
3. Compare with existing migrations
4. Identify gaps

---

## Core Tables Gap Analysis

### 1. `users` Table

| Field Used in Code | Model/Controller | Exists in DB? | Migration | Constraint/Index Required | Notes |
|-------------------|------------------|---------------|-----------|---------------------------|-------|
| id | All | ✅ Yes | 2024_01_01_000000 | Primary Key | ✅ |
| organization_id | User, UserController | ✅ Yes | 2024_01_01_000000 | FK → organizations.id, Index | ✅ Added index in migration |
| name | User, UserController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| email | User, UserController | ✅ Yes | 2024_01_01_000000 | UNIQUE | ✅ |
| password | User, AuthController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| phone | User, UserController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| role | User, UserController | ✅ Yes | 2024_01_01_000000 | Index | ✅ Added index in migration |
| is_active | User, UserController | ✅ Yes | 2024_01_01_000000 | Index | ✅ Added index in migration |
| is_super_admin | User, UserController | ✅ Yes | 2024_01_02_000000 | - | ✅ |
| last_login_at | User, AuthController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| remember_token | User | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| created_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| updated_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| deleted_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |

**Status**: ✅ **COMPLETE** - All fields exist

---

### 2. `organizations` Table

| Field Used in Code | Model/Controller | Exists in DB? | Migration | Constraint/Index Required | Notes |
|-------------------|------------------|---------------|-----------|---------------------------|-------|
| id | All | ✅ Yes | 2024_01_01_000000 | Primary Key | ✅ |
| distributor_id | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | FK → distributors.id | ✅ |
| reseller_id | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | FK → resellers.id | ✅ |
| name | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| name_en | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| logo_url | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| address | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| city | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| phone | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| email | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| tax_number | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| subscription_plan | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| max_cameras | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| max_edge_servers | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| is_active | Organization, OrganizationController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| created_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| updated_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| deleted_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |

**Status**: ✅ **COMPLETE** - All fields exist

---

### 3. `licenses` Table

| Field Used in Code | Model/Controller | Exists in DB? | Migration | Constraint/Index Required | Notes |
|-------------------|------------------|---------------|-----------|---------------------------|-------|
| id | All | ✅ Yes | 2024_01_01_000000 | Primary Key | ✅ |
| organization_id | License, LicenseController | ✅ Yes | 2024_01_01_000000 | FK → organizations.id (CASCADE), Index | ✅ Added index in migration |
| subscription_plan_id | License | ✅ Yes | 2024_01_01_000000 | FK → subscription_plans.id | ✅ |
| plan | License, LicenseController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| license_key | License, LicenseController | ✅ Yes | 2024_01_01_000000 | UNIQUE | ✅ |
| status | License, LicenseController | ✅ Yes | 2024_01_01_000000 | Index | ✅ Added index in migration |
| edge_server_id | License, LicenseController | ✅ Yes | 2025_12_30_000001 | FK → edge_servers.id, Index | ✅ Fixed: was string, now foreignId |
| max_cameras | License, LicenseController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| modules | License, LicenseController | ✅ Yes | 2024_01_01_000000 | JSON | ✅ |
| trial_ends_at | License | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| activated_at | License, LicenseController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| expires_at | License, LicenseController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| created_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| updated_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| deleted_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |

**Status**: ✅ **COMPLETE** - All fields exist, edge_server_id fixed

---

### 4. `edge_servers` Table

| Field Used in Code | Model/Controller | Exists in DB? | Migration | Constraint/Index Required | Notes |
|-------------------|------------------|---------------|-----------|---------------------------|-------|
| id | All | ✅ Yes | 2024_01_01_000000 | Primary Key | ✅ |
| organization_id | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | FK → organizations.id (CASCADE), Index | ✅ Added index in migration |
| license_id | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | FK → licenses.id, Index | ✅ Added index in migration |
| edge_id | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | UNIQUE | ✅ |
| edge_key | EdgeController (planned) | ✅ Yes | 2025_12_30_000002 | UNIQUE | ✅ Added for HMAC |
| edge_secret | EdgeController (planned) | ✅ Yes | 2025_12_30_000002 | - | ✅ Added for HMAC |
| name | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| hardware_id | EdgeServer | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| ip_address | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| internal_ip | EdgeController | ✅ Yes | 2025_12_30_000001 | - | ✅ Added |
| public_ip | EdgeController | ✅ Yes | 2025_12_30_000001 | - | ✅ Added |
| hostname | EdgeController | ✅ Yes | 2025_12_30_000001 | - | ✅ Added |
| version | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| location | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| notes | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| online | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | Index | ✅ Added index in migration |
| last_seen_at | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | Index | ✅ Added index in migration |
| system_info | EdgeServer, EdgeController | ✅ Yes | 2024_01_01_000000 | JSON | ✅ |
| created_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| updated_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| deleted_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |

**Status**: ✅ **COMPLETE** - All fields exist, IP fields and auth fields added

---

### 5. `cameras` Table

| Field Used in Code | Model/Controller | Exists in DB? | Migration | Constraint/Index Required | Notes |
|-------------------|------------------|---------------|-----------|---------------------------|-------|
| id | All | ✅ Yes | 2024_01_01_000001 | Primary Key | ✅ |
| organization_id | Camera, CameraController | ✅ Yes | 2024_01_01_000001 | FK → organizations.id (CASCADE), Index | ✅ |
| edge_server_id | Camera, CameraController | ✅ Yes | 2024_01_01_000001 | FK → edge_servers.id, Index | ✅ |
| camera_id | Camera, CameraController | ✅ Yes | 2024_01_01_000001 | UNIQUE, Index | ✅ |
| name | Camera, CameraController | ✅ Yes | 2024_01_01_000001 | - | ✅ |
| location | Camera, CameraController | ✅ Yes | 2024_01_01_000001 | - | ✅ |
| rtsp_url | Camera, CameraController | ✅ Yes | 2024_01_01_000001 | - | ✅ |
| status | Camera, CameraController | ✅ Yes | 2024_01_01_000001 | Index | ✅ |
| config | Camera, CameraController | ✅ Yes | 2024_01_01_000001 | JSON | ✅ |
| created_at | All | ✅ Yes | 2024_01_01_000001 | - | ✅ |
| updated_at | All | ✅ Yes | 2024_01_01_000001 | - | ✅ |
| deleted_at | All | ✅ Yes | 2024_01_01_000001 | - | ✅ |

**Status**: ✅ **COMPLETE** - All fields exist

---

### 6. `events` Table

| Field Used in Code | Model/Controller | Exists in DB? | Migration | Constraint/Index Required | Notes |
|-------------------|------------------|---------------|-----------|---------------------------|-------|
| id | All | ✅ Yes | 2024_01_01_000000 | Primary Key | ✅ |
| organization_id | Event, EventController | ✅ Yes | 2024_01_01_000000 | FK → organizations.id, Index | ✅ Added index, nullable (should derive) |
| edge_server_id | Event, EventController | ✅ Yes | 2024_01_01_000000 | FK → edge_servers.id, Index | ✅ Added index in migration |
| edge_id | Event, EventController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| event_type | Event, EventController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| severity | Event, EventController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| occurred_at | Event, EventController | ✅ Yes | 2024_01_01_000000 | Index | ✅ Added index in migration |
| meta | Event, EventController | ✅ Yes | 2024_01_01_000000 | JSON | ✅ |
| acknowledged_at | Event, AlertController | ⚠️ **CHECK** | ? | - | ⚠️ Need to verify |
| resolved_at | Event, AlertController | ⚠️ **CHECK** | ? | - | ⚠️ Need to verify |
| created_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| updated_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| deleted_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |

**Status**: ⚠️ **NEEDS VERIFICATION** - acknowledged_at, resolved_at need check

---

### 7. `edge_server_logs` Table

| Field Used in Code | Model/Controller | Exists in DB? | Migration | Constraint/Index Required | Notes |
|-------------------|------------------|---------------|-----------|---------------------------|-------|
| id | All | ✅ Yes | 2024_01_01_000000 | Primary Key | ✅ |
| organization_id | EdgeController | ✅ Yes | 2025_12_30_000002 | FK → organizations.id (CASCADE), Index | ✅ Added for tenant isolation |
| edge_server_id | EdgeServerLog, EdgeController | ✅ Yes | 2024_01_01_000000 | FK → edge_servers.id (CASCADE), Index | ✅ |
| level | EdgeServerLog, EdgeController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| message | EdgeServerLog, EdgeController | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| meta | EdgeServerLog, EdgeController | ✅ Yes | 2024_01_01_000000 | JSON | ✅ |
| created_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| updated_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |
| deleted_at | All | ✅ Yes | 2024_01_01_000000 | - | ✅ |

**Status**: ✅ **COMPLETE** - organization_id added

---

## Missing Tables

### ❌ `organization_user` (Pivot Table)

**Status**: ❌ **NOT FOUND** - No pivot table exists

**Analysis**:
- Current design: `users.organization_id` (one-to-many)
- If many-to-many needed: Create pivot table
- **Decision**: Current design is one-to-many (user belongs to one org), so pivot table NOT needed unless requirement changes

**Action**: ✅ **NO ACTION** - Current design is correct

---

### ❌ `audit_logs` Table

**Status**: ❌ **NOT FOUND** - No audit_logs table exists

**Analysis**:
- Not used in current code
- May be needed for compliance/security
- **Decision**: Optional for now, can be added later if needed

**Action**: ⚠️ **OPTIONAL** - Can be added in future if audit requirements exist

---

## Edge Credentials Storage

**Status**: ✅ **COMPLETE**

**Implementation**: Columns in `edge_servers` table:
- `edge_key` (unique) - Added in migration 2025_12_30_000002
- `edge_secret` - Added in migration 2025_12_30_000002

**Alternative Considered**: Separate `edge_api_keys` table
**Decision**: Columns in `edge_servers` is simpler and sufficient

---

## Foreign Key Verification

### Required FKs Status

| FK Relationship | Status | Migration | Delete Rule | Notes |
|----------------|--------|-----------|-------------|-------|
| licenses.organization_id → organizations.id | ✅ | 2024_01_01_000000 | CASCADE | ✅ NOT NULL |
| edge_servers.organization_id → organizations.id | ✅ | 2024_01_01_000000 | CASCADE | ✅ NOT NULL |
| cameras.organization_id → organizations.id | ✅ | 2024_01_01_000001 | CASCADE | ✅ NOT NULL |
| events.organization_id → organizations.id | ✅ | 2024_01_01_000000 | SET NULL | ⚠️ Nullable (populated from edge_server) |
| edge_server_logs.organization_id → organizations.id | ✅ | 2025_12_30_000002 | CASCADE | ✅ NOT NULL (added) |
| cameras.edge_server_id → edge_servers.id | ✅ | 2024_01_01_000001 | SET NULL | ✅ Correct (camera can exist without edge) |
| licenses.edge_server_id → edge_servers.id | ✅ | 2025_12_30_000001 | SET NULL | ✅ Fixed: was string, now foreignId |

**Status**: ✅ **ALL REQUIRED FKs EXIST**

---

## Index Verification

### Required Indexes Status

| Table | Index Column(s) | Status | Migration | Notes |
|-------|----------------|-------|-----------|-------|
| users | organization_id | ✅ | 2025_12_30_000002 | Added |
| users | role | ✅ | 2025_12_30_000002 | Added |
| users | is_active | ✅ | 2025_12_30_000002 | Added |
| licenses | organization_id | ✅ | 2025_12_30_000002 | Added |
| licenses | status | ✅ | 2025_12_30_000002 | Added |
| licenses | edge_server_id | ✅ | 2025_12_30_000002 | Added |
| edge_servers | organization_id | ✅ | 2025_12_30_000002 | Added |
| edge_servers | license_id | ✅ | 2025_12_30_000002 | Added |
| edge_servers | online | ✅ | 2025_12_30_000002 | Added |
| edge_servers | last_seen_at | ✅ | 2025_12_30_000002 | Added |
| cameras | organization_id | ✅ | 2024_01_01_000001 | Exists |
| cameras | edge_server_id | ✅ | 2024_01_01_000001 | Exists |
| cameras | status | ✅ | 2024_01_01_000001 | Exists |
| events | organization_id | ✅ | 2025_12_30_000002 | Added |
| events | edge_server_id | ✅ | 2025_12_30_000002 | Added |
| events | occurred_at | ✅ | 2025_12_30_000002 | Added |
| edge_server_logs | organization_id | ✅ | 2025_12_30_000002 | Added |

**Status**: ✅ **ALL REQUIRED INDEXES EXIST**

---

## Unique Constraints Verification

| Table | Column(s) | Status | Migration | Notes |
|-------|-----------|--------|-----------|-------|
| users | email | ✅ | 2024_01_01_000000 | UNIQUE |
| licenses | license_key | ✅ | 2024_01_01_000000 | UNIQUE |
| edge_servers | edge_id | ✅ | 2024_01_01_000000 | UNIQUE |
| edge_servers | edge_key | ✅ | 2025_12_30_000002 | UNIQUE (nullable) |
| cameras | camera_id | ✅ | 2024_01_01_000001 | UNIQUE |

**Status**: ✅ **ALL REQUIRED UNIQUES EXIST**

---

## Tenant Isolation Verification

### Tables with organization_id NOT NULL (Properly Isolated)

| Table | organization_id | Status | Migration |
|-------|----------------|-------|-----------|
| licenses | NOT NULL | ✅ | 2024_01_01_000000 |
| edge_servers | NOT NULL | ✅ | 2024_01_01_000000 |
| cameras | NOT NULL | ✅ | 2024_01_01_000001 |
| edge_server_logs | NOT NULL | ✅ | 2025_12_30_000002 (added) |

### Tables with organization_id Nullable (Partially Isolated)

| Table | organization_id | Status | Reason | Migration |
|-------|----------------|-------|--------|-----------|
| users | NULLABLE | ✅ | Super admins have NULL | 2024_01_01_000000 |
| events | NULLABLE | ⚠️ | Should derive from edge_server | 2024_01_01_000000 |

**Action for events**: Migration 2025_12_30_000002 populates null organization_id from edge_server, but column remains nullable for events without edge_server (edge case).

---

## Delete/Cascade Rules Verification

### Organization Deletion Policy

**Decision**: **CASCADE** - Delete organization cascades to all tenant data

| Table | Delete Rule | Status | Notes |
|-------|-------------|--------|-------|
| licenses | CASCADE | ✅ | All licenses deleted |
| edge_servers | CASCADE | ✅ | All edge servers deleted |
| cameras | CASCADE | ✅ | All cameras deleted |
| edge_server_logs | CASCADE | ✅ | All logs deleted |
| events | SET NULL | ⚠️ | Should be CASCADE or derive org_id |

**Recommendation**: Change `events.organization_id` to CASCADE or ensure it's always populated from edge_server.

---

## Summary

### ✅ Complete (No Gaps)

- `users` table - All fields exist
- `organizations` table - All fields exist
- `licenses` table - All fields exist, edge_server_id fixed
- `edge_servers` table - All fields exist, IP and auth fields added
- `cameras` table - All fields exist
- `edge_server_logs` table - organization_id added

### ⚠️ Needs Verification

- `events` table - `acknowledged_at`, `resolved_at` columns need verification

### ❌ Missing (Optional)

- `audit_logs` table - Not required for core functionality
- `organization_user` pivot - Not needed (one-to-many design)

### ✅ All Constraints & Indexes

- All required Foreign Keys exist
- All required Indexes exist
- All required Unique constraints exist
- Tenant isolation enforced (organization_id NOT NULL where required)

---

## Action Items

1. ✅ **DONE**: Fix `licenses.edge_server_id` from string to foreignId
2. ✅ **DONE**: Add `edge_servers.internal_ip`, `public_ip`, `hostname`
3. ✅ **DONE**: Add `edge_servers.edge_key`, `edge_secret`
4. ✅ **DONE**: Add `edge_server_logs.organization_id`
5. ✅ **DONE**: Add all performance indexes
6. ⚠️ **VERIFY**: Check if `events` table has `acknowledged_at`, `resolved_at` columns
7. ⚠️ **OPTIONAL**: Consider making `events.organization_id` NOT NULL with CASCADE

---

**End of DB_GAPS.md**
