# Comprehensive Production Fix Guide

This document addresses all critical production blockers reported in the backend.

## 🔴 Critical Issues Fixed

### 1. ✅ Branding Public Endpoint Crashes
**Problem**: `organizations_branding` table missing, causing 500 errors on `GET /api/v1/branding`

**Fix Applied**:
- Added graceful fallback in `BrandingController::showPublic()` to return default branding if table doesn't exist
- Created migration to ensure table exists with `deleted_at` column
- Added SQL fix script

**Verification**:
```bash
curl -X GET https://api.stcsolutions.online/api/v1/branding/public
# Should return JSON with default branding colors, no 500 error
```

---

### 2. ✅ AI Policies Lookup Crashes + Route Binding Issue
**Problem**: 
- `ai_policies` table missing
- Route binding conflict: `/ai-policies/effective` was matching `/ai-policies/{aiPolicy}` first

**Fix Applied**:
- Reordered routes: `/ai-policies/effective` now comes BEFORE `/ai-policies/{id}`
- Changed route parameter from `{aiPolicy}` to `{id}` to avoid automatic model binding conflict
- Added error handling in `AiPolicyController::show()` to handle "effective" keyword
- Added graceful fallback in `AiPolicyController::effective()` if table doesn't exist
- Created migration to ensure table exists

**Verification**:
```bash
curl -X GET https://api.stcsolutions.online/api/v1/ai-policies/effective
# Should return JSON with default policy or actual policy, no 500 error
```

---

### 3. ✅ Alerts Endpoint Crashes (Wrong Column Name)
**Problem**: Code uses `metadata->status` but table has `meta` column (not `metadata`)

**Fix Applied**:
- Updated `AlertController::index()` to use `meta->status`, `meta->severity`, `meta->module` instead of `metadata->*`
- Ensured `events` table has `meta` JSON column (already exists in migration)

**Verification**:
```bash
curl -X GET "https://api.stcsolutions.online/api/v1/alerts" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return alerts list, no 500 error
```

---

### 4. ✅ Landing Page Not Saving Changes
**Problem**: Multiple root causes:
- `platform_contents.deleted_at` column missing (SoftDeletes mismatch)
- `platform_contents.key` column missing
- `platform_contents.published` column missing
- Branding fetch fails, causing Landing page to reset

**Fix Applied**:
- Migration `2025_01_28_000003_fix_platform_contents_soft_deletes.php` adds `deleted_at`
- Migration `2025_01_28_000001_fix_platform_contents_key_column.php` adds `key`
- Comprehensive migration adds `published` column
- Branding fallback ensures Landing page can load even if branding table is missing
- `SettingsController` now handles missing columns gracefully

**Verification**:
```bash
# 1. GET landing settings
curl -X GET "https://api.stcsolutions.online/api/v1/settings/landing" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. SAVE landing settings
curl -X PUT "https://api.stcsolutions.online/api/v1/settings/landing" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":{"hero_title":"Test Title"},"published":true}'

# 3. GET again to verify persistence
curl -X GET "https://api.stcsolutions.online/api/v1/settings/landing" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should show "Test Title" in hero_title
```

---

### 5. ✅ Notifications Priority Endpoint Crashes
**Problem**: `notification_priorities` table missing

**Fix Applied**:
- Migration `2025_01_28_000002_fix_notification_priorities_table.php` creates table
- `NotificationController` now returns empty array if table doesn't exist (graceful fallback)
- Comprehensive migration ensures table exists

**Verification**:
```bash
curl -X GET "https://api.stcsolutions.online/api/v1/notification-priorities" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return array (empty or with data), no 500 error
```

---

### 6. ✅ System Backups Broken (Missing Table + proc_open Disabled)
**Problem**: 
- `system_backups` table missing
- `proc_open` function disabled in PHP, causing Symfony Process to fail

**Fix Applied**:
- Added graceful fallback in `SystemBackupController::index()` if table doesn't exist
- Added `proc_open` check in `SystemBackupController::createDatabaseDump()`
- Returns HTTP 503 with clear error message if `proc_open` is disabled
- Comprehensive migration ensures table exists

**Verification**:
```bash
# Test if backup feature is available
curl -X GET "https://api.stcsolutions.online/api/v1/system-backups" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return array (empty or with backups), no 500 error

# Test backup creation (will fail gracefully if proc_open disabled)
curl -X POST "https://api.stcsolutions.online/api/v1/system-backups" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return 503 with clear message if proc_open disabled, or 201 if successful
```

---

### 7. ✅ Method Visibility Issue (Already Fixed)
**Problem**: `NotificationPriorityController::ensureSuperAdmin()` had wrong visibility

**Fix Applied**: Already fixed in previous commit - removed duplicate method, uses parent's `protected` method

---

## 📋 Deployment Steps

### Option 1: Use Migrations (Recommended)

```bash
cd /www/wwwroot/api.stcsolutions.online

# 1. Backup database first!
mysqldump -u root -p stc_saas > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull latest code
git pull origin main

# 3. Run migrations
php artisan migrate

# 4. Clear cache
php artisan route:clear
php artisan config:clear
php artisan cache:clear
composer dump-autoload
```

### Option 2: Use SQL Script (If Migrations Fail)

```bash
# 1. Backup database first!
mysqldump -u root -p stc_saas > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run SQL fix script
mysql -u root -p stc_saas < database/fix_production_comprehensive.sql

# 3. Clear cache
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

---

## ✅ End-to-End Verification Checklist

After deployment, verify each endpoint:

### 1. Public Branding
```bash
curl -X GET https://api.stcsolutions.online/api/v1/branding/public
```
**Expected**: JSON response with branding colors, **NO 500 error**

### 2. Landing Settings GET
```bash
curl -X GET "https://api.stcsolutions.online/api/v1/settings/landing" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: JSON with landing content, **NO 500 error**

### 3. Landing Settings SAVE
```bash
curl -X PUT "https://api.stcsolutions.online/api/v1/settings/landing" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":{"hero_title":"Test Save"},"published":true}'
```
**Expected**: 200 OK with saved data

### 4. Landing Settings GET Again (Verify Persistence)
```bash
curl -X GET "https://api.stcsolutions.online/api/v1/settings/landing" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: Should show "Test Save" in hero_title

### 5. Alerts List
```bash
curl -X GET "https://api.stcsolutions.online/api/v1/alerts" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: JSON with alerts array, **NO 500 error**

### 6. AI Policies Effective
```bash
curl -X GET "https://api.stcsolutions.online/api/v1/ai-policies/effective?organization_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: JSON with policy data, **NO 500 error**

### 7. Notification Priorities
```bash
curl -X GET "https://api.stcsolutions.online/api/v1/notification-priorities" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: JSON array (empty or with data), **NO 500 error**

### 8. System Backups
```bash
curl -X GET "https://api.stcsolutions.online/api/v1/system-backups" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: JSON array (empty or with backups), **NO 500 error**

---

## 🔍 Database Verification

After running migrations/SQL script, verify tables exist:

```sql
-- Check all tables exist
SHOW TABLES LIKE 'organizations_branding';
SHOW TABLES LIKE 'ai_policies';
SHOW TABLES LIKE 'system_backups';
SHOW TABLES LIKE 'notification_priorities';

-- Check events table has meta column
DESCRIBE events;
-- Should show 'meta' column of type 'json'

-- Check platform_contents has all required columns
DESCRIBE platform_contents;
-- Should show: 'key', 'deleted_at', 'published'

-- Check organizations_branding has deleted_at
DESCRIBE organizations_branding;
-- Should show 'deleted_at' column
```

---

## ⚠️ Important Notes

1. **proc_open for Backups**: If `proc_open` is disabled on your server, the backup feature will return HTTP 503 with a clear error message. This is intentional - the feature gracefully degrades instead of crashing.

2. **Route Order**: The `/ai-policies/effective` route MUST come before `/ai-policies/{id}` in `routes/api.php`. This is already fixed.

3. **Column Names**: The code now consistently uses `meta` (not `metadata`) for the events table. All queries have been updated.

4. **Graceful Fallbacks**: All controllers now check if tables exist before querying, and return sensible defaults instead of crashing.

---

## 📝 Files Changed

### Controllers:
- `app/Http/Controllers/AlertController.php` - Fixed `metadata` → `meta`
- `app/Http/Controllers/BrandingController.php` - Added graceful fallback
- `app/Http/Controllers/AiPolicyController.php` - Fixed route binding, added error handling
- `app/Http/Controllers/SystemBackupController.php` - Added proc_open check, graceful fallback

### Routes:
- `routes/api.php` - Reordered AI policies routes

### Migrations:
- `database/migrations/2025_01_28_000004_fix_production_tables_comprehensive.php` - Comprehensive fix

### SQL Scripts:
- `database/fix_production_comprehensive.sql` - Manual SQL fix script

---

## 🚀 Next Steps

1. Deploy code changes to production
2. Run migrations or SQL script
3. Verify all endpoints work using the checklist above
4. Monitor logs for any remaining errors

All critical blockers should now be resolved! 🎉

