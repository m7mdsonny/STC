# Final Database Schema

**Date**: 2025-01-30  
**Status**: Canonical Schema (Production-Ready)

---

## Overview

This document describes the final, canonical database schema for STC AI-VAP platform. All tables, columns, relationships, and indexes are documented here.

**Important**: This schema has been verified to support:
- Cloud Backend (Laravel)
- Web Portal
- Edge Server integration
- Mobile APIs
- All AI modules including Market module

---

## Core Tables

### organizations
Primary tenant/organization table.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| distributor_id | bigint | FOREIGN KEY → distributors.id | Nullable |
| reseller_id | bigint | FOREIGN KEY → resellers.id | Nullable |
| name | varchar(255) | NOT NULL | Organization name |
| name_en | varchar(255) | NULL | English name |
| logo_url | varchar(255) | NULL | Logo URL |
| address | varchar(255) | NULL | Address |
| city | varchar(255) | NULL | City |
| phone | varchar(255) | NULL | Phone |
| email | varchar(255) | NULL | Email |
| tax_number | varchar(255) | NULL | Tax number |
| subscription_plan | varchar(255) | DEFAULT 'basic' | Plan type |
| max_cameras | int | DEFAULT 4 | Max cameras allowed |
| max_edge_servers | int | DEFAULT 1 | Max edge servers |
| is_active | boolean | DEFAULT true | Active status |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

**Indexes**:
- PRIMARY KEY (id)
- INDEX on organization_id (for tenant isolation)

**Relations**:
- belongsTo: distributors, resellers
- hasMany: users, edge_servers, cameras, events, alerts, licenses

---

### users
User accounts table.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| organization_id | bigint | FOREIGN KEY → organizations.id | Nullable (super admin) |
| name | varchar(255) | NOT NULL | User name |
| email | varchar(255) | UNIQUE, NOT NULL | Email (unique) |
| password | varchar(255) | NOT NULL | Hashed password |
| role | varchar(50) | DEFAULT 'user' | Role (user, admin, super_admin) |
| is_super_admin | boolean | DEFAULT false | Super admin flag |
| is_active | boolean | DEFAULT true | Active status |
| email_verified_at | timestamp | NULL | Email verification |
| remember_token | varchar(100) | NULL | Remember token |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (email)
- INDEX (organization_id)

**Relations**:
- belongsTo: organization
- hasMany: (via pivot tables)

---

### edge_servers
Edge server instances.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| organization_id | bigint | FOREIGN KEY → organizations.id | NOT NULL |
| edge_id | varchar(255) | UNIQUE, NOT NULL | Edge identifier |
| edge_key | varchar(255) | UNIQUE, NOT NULL | HMAC key |
| edge_secret | varchar(255) | NOT NULL | HMAC secret |
| name | varchar(255) | NULL | Server name |
| version | varchar(50) | NULL | Version |
| status | varchar(50) | DEFAULT 'offline' | Status |
| last_heartbeat | timestamp | NULL | Last heartbeat |
| ip_address | varchar(45) | NULL | IP address |
| location | varchar(255) | NULL | Location |
| is_active | boolean | DEFAULT true | Active status |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (edge_id)
- UNIQUE INDEX (edge_key)
- INDEX (organization_id)

**Relations**:
- belongsTo: organization, license
- hasMany: cameras, events

**Security**: HMAC authentication via edge_key/edge_secret

---

### cameras
Camera configurations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| organization_id | bigint | FOREIGN KEY → organizations.id | NOT NULL |
| edge_server_id | bigint | FOREIGN KEY → edge_servers.id | Nullable |
| camera_id | varchar(255) | UNIQUE, NOT NULL | Camera identifier |
| name | varchar(255) | NULL | Camera name |
| stream_url | text | NULL | Stream URL |
| rtsp_url | text | NULL | RTSP URL |
| location | varchar(255) | NULL | Location |
| is_active | boolean | DEFAULT true | Active status |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (camera_id)
- INDEX (organization_id)
- INDEX (edge_server_id)

**Relations**:
- belongsTo: organization, edge_server
- hasMany: events (via camera_id in meta)

---

### events
Event log table (used by all modules including Market).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| organization_id | bigint | FOREIGN KEY → organizations.id | NOT NULL |
| edge_server_id | bigint | FOREIGN KEY → edge_servers.id | Nullable |
| edge_id | varchar(255) | NULL | Edge identifier |
| event_type | varchar(255) | NOT NULL | Event type (e.g., 'suspicious_behavior') |
| severity | varchar(50) | NOT NULL | Severity (info, warning, critical) |
| occurred_at | timestamp | NOT NULL | Event timestamp |
| meta | json | NULL | Metadata (module, risk_score, track_id, etc.) |
| acknowledged_at | timestamp | NULL | Acknowledgment timestamp |
| resolved_at | timestamp | NULL | Resolution timestamp |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (organization_id)
- INDEX (edge_server_id)
- INDEX (event_type)
- INDEX (severity)
- INDEX (occurred_at)

**Relations**:
- belongsTo: organization, edge_server

**Notes**:
- Market module events use event_type='suspicious_behavior'
- Risk score, track_id, actions stored in meta JSON
- Supports all AI modules

---

### alerts
Alert table (views/notifications of events).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| organization_id | bigint | FOREIGN KEY → organizations.id | NOT NULL |
| event_id | bigint | FOREIGN KEY → events.id | Nullable |
| title | varchar(255) | NOT NULL | Alert title |
| description | text | NULL | Alert description |
| severity | varchar(50) | NOT NULL | Severity |
| status | varchar(50) | DEFAULT 'new' | Status (new, acknowledged, resolved) |
| acknowledged_at | timestamp | NULL | Acknowledgment timestamp |
| resolved_at | timestamp | NULL | Resolution timestamp |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (organization_id)
- INDEX (event_id)
- INDEX (status)
- INDEX (severity)

**Relations**:
- belongsTo: organization, event

---

## Supporting Tables

### licenses
License/subscription management.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| organization_id | bigint | FOREIGN KEY → organizations.id | NOT NULL |
| license_key | varchar(255) | UNIQUE, NOT NULL | License key |
| expires_at | timestamp | NULL | Expiration |
| status | varchar(50) | DEFAULT 'active' | Status |
| modules | json | NULL | Enabled modules (e.g., ['market']) |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (license_key)
- INDEX (organization_id)

---

### subscription_plans
Subscription plan definitions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| name | varchar(255) | NOT NULL | Plan name |
| name_ar | varchar(255) | NULL | Arabic name |
| max_cameras | int | DEFAULT 4 | Max cameras |
| max_edge_servers | int | DEFAULT 1 | Max edge servers |
| available_modules | json | NULL | Available modules |
| notification_channels | json | NULL | Notification channels |
| price_monthly | decimal(10,2) | DEFAULT 0 | Monthly price |
| price_yearly | decimal(10,2) | DEFAULT 0 | Yearly price |
| is_active | boolean | DEFAULT true | Active status |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

---

### device_tokens
FCM/notification device tokens.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| user_id | bigint | FOREIGN KEY → users.id | NOT NULL |
| device_token | varchar(255) | NOT NULL | Device token |
| platform | varchar(50) | NULL | Platform (ios, android) |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (device_token)

---

## AI Module Tables

### ai_policies
AI policy configurations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| organization_id | bigint | FOREIGN KEY → organizations.id | Nullable |
| name | varchar(255) | NOT NULL | Policy name |
| is_enabled | boolean | DEFAULT true | Enabled status |
| modules | json | NULL | Modules configuration |
| thresholds | json | NULL | Thresholds |
| actions | json | NULL | Actions |
| feature_flags | json | NULL | Feature flags |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

---

### ai_commands
AI command queue.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | bigint | PRIMARY KEY | Auto-increment |
| organization_id | bigint | FOREIGN KEY → organizations.id | Nullable |
| title | varchar(255) | NOT NULL | Command title |
| status | varchar(50) | DEFAULT 'queued' | Status |
| payload | json | NULL | Command payload |
| acknowledged_at | timestamp | NULL | Acknowledgment |
| created_at | timestamp | NULL | Timestamp |
| updated_at | timestamp | NULL | Timestamp |
| deleted_at | timestamp | NULL | Soft delete |

---

## Additional Tables

See migrations for complete list:
- distributors
- resellers
- organizations_branding
- registered_faces
- registered_vehicles
- vehicle_access_logs
- automation_rules
- integrations
- system_updates
- platform_contents
- platform_wordings
- notification_priorities
- ai_modules
- updates (announcements)
- contact_inquiries

---

## Key Relationships

```
organizations (1) ──< (N) users
organizations (1) ──< (N) edge_servers
organizations (1) ──< (N) cameras
organizations (1) ──< (N) events
organizations (1) ──< (N) alerts
organizations (1) ──< (N) licenses

edge_servers (1) ──< (N) cameras
edge_servers (1) ──< (N) events

events (1) ──< (1) alerts
```

---

## Tenant Isolation

All tables with `organization_id` enforce tenant isolation:
- Data filtered by organization_id in queries
- Foreign keys ensure referential integrity
- Soft deletes preserve data integrity

---

## Market Module Integration

Market module uses existing `events` table:
- event_type = 'suspicious_behavior'
- meta JSON contains:
  - module: 'market'
  - risk_score: int
  - risk_level: string
  - track_id: int
  - actions: array
  - contributing_factors: array
- No separate market_* tables required

---

## Verification

This schema has been verified to:
✅ Support all existing features
✅ Support Market module
✅ Maintain tenant isolation
✅ Support Edge Server integration
✅ Support Web Portal
✅ Support Mobile APIs

---

**Last Updated**: 2025-01-30  
**Schema Version**: Final (Canonical)
