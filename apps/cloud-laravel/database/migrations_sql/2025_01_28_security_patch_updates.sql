-- =====================================================
-- SECURITY PATCH DATABASE UPDATES
-- Date: 2025-01-28
-- Description: Applies security patch updates to database
-- =====================================================

-- =====================================================
-- 1. Add notification_config column to organizations
-- =====================================================
-- This column stores organization-level notification preferences as JSON

SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'organizations'
    AND COLUMN_NAME = 'notification_config'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE `organizations` ADD COLUMN `notification_config` JSON NULL AFTER `is_active`',
    'SELECT "Column notification_config already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. Ensure edge_nonces table exists
-- =====================================================
-- This table is used for replay attack protection

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
-- 3. Note on edge_secret encryption
-- =====================================================
-- IMPORTANT: edge_secret encryption must be done via PHP/Laravel
-- Run: php artisan migrate (migration: 2025_01_28_000012_encrypt_edge_secrets)
-- 
-- The migration will:
-- 1. Check each edge_secret value
-- 2. If not already encrypted (doesn't start with 'eyJ'), encrypt it
-- 3. Update the database with encrypted value
--
-- This cannot be done via pure SQL as it requires Laravel's Crypt facade
-- =====================================================

-- =====================================================
-- 4. Verify updates
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

-- =====================================================
-- END OF SECURITY PATCH UPDATES
-- =====================================================
