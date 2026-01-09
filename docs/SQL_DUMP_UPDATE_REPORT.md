# SQL Dump Update Report
**Date**: 2025-01-28  
**File**: `stc_cloud_mysql_canonical_latest.sql`  
**Status**: ✅ **UPDATED**

## Summary

The canonical SQL dump has been updated to include all new tables and columns based on the latest codebase analysis.

---

## ✅ Updates Applied

### New Tables Added (7)

1. **`organization_subscriptions`** - Organization subscription management
2. **`edge_nonces`** - HMAC replay attack protection
3. **`ai_scenarios`** - Enterprise monitoring scenarios (Market/Factory)
4. **`ai_scenario_rules`** - Scenario rules and weights
5. **`ai_camera_bindings`** - Camera-to-scenario bindings
6. **`ai_alert_policies`** - Alert notification policies per risk level
7. **`free_trial_requests`** - Sales & onboarding pipeline

### Tables Updated

1. **`events`** - Added:
   - `ai_module` (VARCHAR, indexed)
   - `risk_score` (INT, indexed)
   - `title` (VARCHAR)
   - `description` (TEXT)
   - `camera_id` (VARCHAR, indexed)
   - `acknowledged_at` (TIMESTAMP)
   - `resolved_at` (TIMESTAMP)
   - Composite index: `(organization_id, ai_module, occurred_at)`

2. **`edge_servers`** - Added:
   - `edge_key` (VARCHAR, unique, indexed)
   - `edge_secret` (VARCHAR)
   - `secret_delivered_at` (TIMESTAMP)
   - `internal_ip` (VARCHAR)
   - `public_ip` (VARCHAR)
   - `hostname` (VARCHAR)

3. **`subscription_plans`** - Added:
   - `sms_quota` (INT UNSIGNED, default: 0)
   - `retention_days` (INT UNSIGNED, nullable)

4. **`updates`** - Added:
   - `version` (VARCHAR)
   - `version_type` (ENUM: major, minor, patch, hotfix)
   - `release_notes` (TEXT)
   - `changelog` (TEXT)
   - `affected_modules` (JSON)
   - `requires_manual_update` (BOOLEAN)
   - `download_url` (VARCHAR)
   - `checksum` (VARCHAR)
   - `file_size_mb` (INT)
   - `release_date` (TIMESTAMP)
   - `end_of_support_date` (TIMESTAMP)

5. **`platform_contents`** - Added:
   - `published` (BOOLEAN, default: FALSE)

---

## 📊 File Statistics

- **File Name**: `stc_cloud_mysql_canonical_latest.sql`
- **File Size**: 79 KB
- **Total Lines**: 1,403
- **Total Tables**: 48 (including migrations table)
- **Version**: 5.0.0 - CANONICAL

---

## ✅ Verification

### All New Tables Present ✅

- ✅ `organization_subscriptions` - CREATE TABLE statement found
- ✅ `edge_nonces` - CREATE TABLE statement found
- ✅ `ai_scenarios` - CREATE TABLE statement found
- ✅ `ai_scenario_rules` - CREATE TABLE statement found
- ✅ `ai_camera_bindings` - CREATE TABLE statement found
- ✅ `ai_alert_policies` - CREATE TABLE statement found
- ✅ `free_trial_requests` - CREATE TABLE statement found

### All Updates Applied ✅

- ✅ Events table analytics fields
- ✅ Edge servers security fields
- ✅ Subscription plans enhancements
- ✅ Updates table versioning
- ✅ Platform contents published flag

---

## 🔒 Compliance

✅ **Biometric Data**: Removed (face_encoding, plate_encoding)  
✅ **Security**: Edge secrets tracking, HMAC nonces  
✅ **Tenant Isolation**: All tables properly scoped  

---

## 📋 Complete Table List (48 Tables)

1. distributors
2. resellers
3. organizations
4. users
5. subscription_plans
6. subscription_plan_limits
7. licenses
8. edge_servers
9. cameras
10. events
11. edge_server_logs
12. notifications
13. notification_priorities
14. sms_quotas
15. system_settings
16. platform_contents
17. system_backups
18. analytics_reports
19. analytics_dashboards
20. analytics_widgets
21. ai_policies
22. ai_policy_events
23. ai_modules
24. ai_module_configs
25. ai_commands
26. ai_command_targets
27. ai_command_logs
28. integrations
29. automation_rules
30. automation_logs
31. system_updates
32. updates
33. platform_wordings
34. organization_wordings
35. organizations_branding
36. registered_faces
37. registered_vehicles
38. vehicle_access_logs
39. device_tokens
40. contact_inquiries
41. personal_access_tokens
42. **organization_subscriptions** (NEW)
43. **edge_nonces** (NEW)
44. **ai_scenarios** (NEW)
45. **ai_scenario_rules** (NEW)
46. **ai_camera_bindings** (NEW)
47. **ai_alert_policies** (NEW)
48. **free_trial_requests** (NEW)

---

## ✅ Update Complete

The SQL dump file `stc_cloud_mysql_canonical_latest.sql` has been successfully updated with:

- ✅ All 7 new tables
- ✅ All column updates
- ✅ All indexes
- ✅ All foreign keys
- ✅ Proper DROP TABLE statements
- ✅ Version updated to 5.0.0

**File Status**: ✅ **READY FOR USE**

---

**Report Generated**: 2025-01-28
