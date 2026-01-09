-- =====================================================
-- DATABASE UPDATE: SECURITY PATCH (2025-01-28)
-- =====================================================
-- This script applies the security patch updates to the database
-- Run this script on your existing database to apply the updates
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- =====================================================
-- 1. Add notification_config column to organizations
-- =====================================================
-- This column stores organization-level notification preferences as JSON
-- Format: {"push_enabled": true, "sms_enabled": false, "email_enabled": true, ...}

SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'notification_config'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE `organizations` ADD COLUMN `notification_config` JSON NULL COMMENT ''Organization-level notification preferences'' AFTER `is_active`',
    'SELECT "Column notification_config already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. Ensure edge_nonces table exists (for replay protection)
-- =====================================================
-- This table stores nonces to prevent replay attacks on Edge Server requests

CREATE TABLE IF NOT EXISTS `edge_nonces` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nonce` VARCHAR(255) NOT NULL,
    `edge_server_id` BIGINT UNSIGNED NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `used_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `edge_nonces_nonce_unique` (`nonce`),
    KEY `edge_nonces_edge_server_id_index` (`edge_server_id`),
    KEY `edge_nonces_used_at_index` (`used_at`),
    CONSTRAINT `edge_nonces_edge_server_id_foreign` 
        FOREIGN KEY (`edge_server_id`) 
        REFERENCES `edge_servers` (`id`) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. Verify edge_servers table has secret_delivered_at column
-- =====================================================
-- This column tracks when edge_secret was first delivered (security)

SET @column_exists_secret = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'edge_servers'
    AND COLUMN_NAME = 'secret_delivered_at'
);

SET @sql_secret = IF(@column_exists_secret = 0,
    'ALTER TABLE `edge_servers` ADD COLUMN `secret_delivered_at` TIMESTAMP NULL AFTER `edge_secret`',
    'SELECT "Column secret_delivered_at already exists" AS message'
);

PREPARE stmt_secret FROM @sql_secret;
EXECUTE stmt_secret;
DEALLOCATE PREPARE stmt_secret;

-- =====================================================
-- 4. IMPORTANT: edge_secret encryption
-- =====================================================
-- NOTE: edge_secret encryption MUST be done via Laravel migration
-- Run: php artisan migrate (migration: 2025_01_28_000012_encrypt_edge_secrets)
-- 
-- The migration will:
-- 1. Check each edge_secret value in edge_servers table
-- 2. If not already encrypted (doesn't start with 'eyJ'), encrypt it using Laravel Crypt
-- 3. Update the database with encrypted value
--
-- This cannot be done via pure SQL as it requires Laravel's Crypt facade
-- =====================================================

-- =====================================================
-- 5. Verification queries
-- =====================================================

-- Check notification_config column
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ notification_config column exists'
        ELSE '✗ notification_config column missing'
    END AS notification_config_status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'organizations'
AND COLUMN_NAME = 'notification_config';

-- Check edge_nonces table
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ edge_nonces table exists'
        ELSE '✗ edge_nonces table missing'
    END AS edge_nonces_status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'edge_nonces';

-- Check secret_delivered_at column
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ secret_delivered_at column exists'
        ELSE '✗ secret_delivered_at column missing'
    END AS secret_delivered_at_status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'edge_servers'
AND COLUMN_NAME = 'secret_delivered_at';

-- =====================================================
-- END OF DATABASE UPDATE
-- =====================================================
-- Next steps:
-- 1. Run Laravel migration for edge_secret encryption:
--    php artisan migrate
-- 2. Verify all updates are applied
-- 3. Test notification settings endpoints
-- =====================================================
