# Critical Update v1.0.0 - Deployment Instructions

## 📦 Update Contents

This update fixes 3 critical issues:
1. Edge Server visibility for Organization Owners
2. Free Trial Requests UI (complete implementation)
3. Backup & Restore enhancements (confirmation, tracking)

## 🚀 Deployment Steps

### 1. Backup Current System
```bash
# Create a backup before applying update
cd /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel
php artisan backup:create
```

### 2. Extract Update Files

Extract this ZIP to a temporary location, then:

**Backend Files** → Copy to:
```
/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/
```

**Frontend Files** → Copy to:
```
/www/wwwroot/stcsolutions.online/apps/web-portal/src/
```

### 3. Run Migration

```bash
cd /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel
php artisan migrate --force
```

### 4. Rebuild Frontend

```bash
cd /www/wwwroot/stcsolutions.online/apps/web-portal
npm install  # Only if package.json changed
npm run build
```

### 5. Clear Cache

```bash
cd /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### 6. Verify

1. Test Edge Server creation as Organization Owner
2. Access `/admin/free-trial-requests` as Super Admin
3. Test Backup & Restore with confirmation

## 📁 File Structure

```
backend/
├── app/Http/Controllers/
│   ├── EdgeController.php
│   ├── SystemBackupController.php
│   └── FreeTrialRequestController.php
├── app/Models/
│   └── SystemBackup.php
└── database/migrations/
    └── 2025_01_28_000016_add_restore_tracking_to_system_backups.php

frontend/
├── src/lib/api/
│   ├── freeTrial.ts
│   └── backups.ts
├── src/pages/admin/
│   ├── FreeTrialRequests.tsx
│   └── AdminBackups.tsx
└── src/App.tsx (route addition - manual edit required)
```

## ⚠️ Important Notes

- All migrations are idempotent (safe to run multiple times)
- No destructive database changes
- All changes are additive
- Backward compatible

## 🔄 Rollback

If issues occur:
1. Restore from backup created in step 1
2. Or manually revert file changes
3. Run: `php artisan migrate:rollback --step=1`

---

**Update Version**: 1.0.0  
**Date**: 2025-01-28  
**Status**: Production Ready
