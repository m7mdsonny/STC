# DATABASE UPDATE: SECURITY PATCH (2025-01-28)

## Overview

This document describes the database updates required to apply the security patch to the STC AI-VAP platform.

## Updates Applied

### 1. Notification Config Column
- **Table**: `organizations`
- **Column**: `notification_config` (JSON, nullable)
- **Purpose**: Stores organization-level notification preferences
- **Format**: 
  ```json
  {
    "push_enabled": true,
    "sms_enabled": false,
    "email_enabled": true,
    "whatsapp_enabled": false,
    "default_channels": ["push", "email"],
    "cooldown_minutes": 5,
    "updated_at": "2025-01-28T12:00:00Z",
    "updated_by": 1
  }
  ```

### 2. Edge Nonces Table
- **Table**: `edge_nonces` (already exists, verified)
- **Purpose**: Stores nonces for replay attack protection
- **Columns**: `id`, `nonce` (unique), `edge_server_id`, `ip_address`, `used_at`, `created_at`, `updated_at`

### 3. Secret Delivery Tracking
- **Table**: `edge_servers`
- **Column**: `secret_delivered_at` (TIMESTAMP, nullable)
- **Purpose**: Tracks when `edge_secret` was first delivered (security)

### 4. Edge Secret Encryption
- **IMPORTANT**: `edge_secret` encryption must be done via Laravel migration
- **Migration**: `2025_01_28_000012_encrypt_edge_secrets.php`
- **Process**: 
  1. Checks each `edge_secret` value
  2. If not encrypted (doesn't start with 'eyJ'), encrypts it
  3. Updates database with encrypted value
- **Cannot be done via SQL**: Requires Laravel's `Crypt` facade

## How to Apply Updates

### Option 1: Using SQL Script (Recommended for Production)

1. **Backup your database first!**
   ```bash
   mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
   ```

2. **Run the SQL update script:**
   ```bash
   mysql -u username -p database_name < DATABASE_UPDATE_SECURITY_PATCH.sql
   ```

3. **Run Laravel migrations for encryption:**
   ```bash
   cd apps/cloud-laravel
   php artisan migrate
   ```

### Option 2: Using Laravel Migrations Only

1. **Run all migrations:**
   ```bash
   cd apps/cloud-laravel
   php artisan migrate
   ```

   This will apply:
   - `2025_01_28_000013_add_notification_config_to_organizations.php`
   - `2025_01_28_000012_encrypt_edge_secrets.php`
   - `2025_01_30_120000_create_edge_nonces_table.php` (if not already applied)

## Verification

After applying updates, verify with:

```sql
-- Check notification_config column
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ notification_config column exists'
        ELSE '✗ notification_config column missing'
    END AS status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'organizations'
AND COLUMN_NAME = 'notification_config';

-- Check edge_nonces table
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ edge_nonces table exists'
        ELSE '✗ edge_nonces table missing'
    END AS status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'edge_nonces';

-- Check secret_delivered_at column
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ secret_delivered_at column exists'
        ELSE '✗ secret_delivered_at column missing'
    END AS status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'edge_servers'
AND COLUMN_NAME = 'secret_delivered_at';
```

## Updated SQL Dump

The main SQL dump (`stc_cloud_mysql_complete_latest.sql`) has been updated to include:
- ✅ `notification_config` column in `organizations` table
- ✅ `edge_nonces` table (already present)
- ✅ Updated version number: 5.1.0 - SECURITY PATCH UPDATE

## Rollback

If you need to rollback:

```sql
-- Remove notification_config column
ALTER TABLE `organizations` DROP COLUMN IF EXISTS `notification_config`;

-- Note: edge_secret decryption is NOT recommended for security reasons
-- The encryption migration is one-way
```

## Notes

- All migrations are **idempotent** (safe to run multiple times)
- The SQL script checks for existing columns/tables before creating
- `edge_secret` encryption requires Laravel - cannot be done via pure SQL
- After encryption, existing Edge Servers will need to re-register to receive their secrets (if not already delivered)

## Support

If you encounter any issues:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Verify database connection
3. Ensure all migrations are idempotent-safe
4. Check foreign key constraints
