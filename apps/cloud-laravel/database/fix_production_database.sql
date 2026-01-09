-- ============================================
-- Production Database Fix Script
-- Date: 2025-01-28
-- Purpose: Fix missing tables and columns
-- ============================================

-- 1. Fix notification_priorities table
-- ============================================

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS `notification_priorities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint(20) unsigned DEFAULT NULL,
  `notification_type` varchar(255) NOT NULL,
  `priority` varchar(255) NOT NULL DEFAULT 'medium',
  `is_critical` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_priorities_organization_id_foreign` (`organization_id`),
  CONSTRAINT `notification_priorities_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add deleted_at if table exists but column is missing
SET @dbname = DATABASE();
SET @tablename = 'notification_priorities';
SET @columnname = 'deleted_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' timestamp NULL DEFAULT NULL AFTER updated_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add organization_id if missing
SET @columnname = 'organization_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' bigint(20) unsigned DEFAULT NULL AFTER id, ADD KEY notification_priorities_organization_id_foreign (organization_id), ADD CONSTRAINT notification_priorities_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Fix platform_contents table
-- ============================================

-- Ensure platform_contents table exists
CREATE TABLE IF NOT EXISTS `platform_contents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` text,
  `section` varchar(255) DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `platform_contents_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add deleted_at if missing
SET @tablename = 'platform_contents';
SET @columnname = 'deleted_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' timestamp NULL DEFAULT NULL AFTER updated_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add key column if missing
SET @columnname = 'key';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(255) NOT NULL AFTER id, ADD UNIQUE KEY platform_contents_key_unique (key)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add published column if missing
SET @columnname = 'published';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' tinyint(1) NOT NULL DEFAULT 0 AFTER section')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- Verification Queries
-- ============================================

-- Verify notification_priorities
SELECT 
    'notification_priorities' as table_name,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = 'notification_priorities';

-- Verify platform_contents columns
SELECT 
    column_name,
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'platform_contents'
AND column_name IN ('deleted_at', 'key', 'published');

