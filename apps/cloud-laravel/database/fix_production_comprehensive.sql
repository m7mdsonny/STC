-- ============================================
-- Comprehensive Production Database Fix Script
-- ============================================
-- This script fixes all reported production database issues
-- Run this on production database if migrations fail
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. Fix organizations_branding table
-- ============================================
CREATE TABLE IF NOT EXISTS `organizations_branding` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `organization_id` bigint unsigned DEFAULT NULL,
    `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `logo_dark_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `favicon_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `primary_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#DCA000',
    `secondary_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#1E1E6E',
    `accent_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#10B981',
    `danger_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#EF4444',
    `warning_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#F59E0B',
    `success_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#22C55E',
    `font_family` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Inter',
    `heading_font` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cairo',
    `border_radius` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '8px',
    `custom_css` text COLLATE utf8mb4_unicode_ci,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `organizations_branding_organization_id_foreign` (`organization_id`),
    CONSTRAINT `organizations_branding_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add deleted_at if table exists but column is missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'organizations_branding' 
    AND COLUMN_NAME = 'deleted_at');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `organizations_branding` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL AFTER `updated_at`',
    'SELECT "deleted_at column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. Fix ai_policies table
-- ============================================
CREATE TABLE IF NOT EXISTS `ai_policies` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `organization_id` bigint unsigned DEFAULT NULL,
    `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
    `modules` json DEFAULT NULL,
    `thresholds` json DEFAULT NULL,
    `actions` json DEFAULT NULL,
    `feature_flags` json DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `ai_policies_organization_id_foreign` (`organization_id`),
    CONSTRAINT `ai_policies_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Fix system_backups table
-- ============================================
CREATE TABLE IF NOT EXISTS `system_backups` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
    `meta` json DEFAULT NULL,
    `created_by` bigint unsigned DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `system_backups_created_by_foreign` (`created_by`),
    CONSTRAINT `system_backups_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Fix events table - ensure meta column exists
-- ============================================
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'events' 
    AND COLUMN_NAME = 'meta');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `events` ADD COLUMN `meta` JSON NULL DEFAULT NULL AFTER `severity`',
    'SELECT "meta column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 5. Fix platform_contents table
-- ============================================
-- Add key column if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'platform_contents' 
    AND COLUMN_NAME = 'key');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `platform_contents` ADD COLUMN `key` VARCHAR(255) UNIQUE NULL AFTER `id`',
    'SELECT "key column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add deleted_at if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'platform_contents' 
    AND COLUMN_NAME = 'deleted_at');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `platform_contents` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL',
    'SELECT "deleted_at column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add published column if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'platform_contents' 
    AND COLUMN_NAME = 'published');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `platform_contents` ADD COLUMN `published` TINYINT(1) NOT NULL DEFAULT 1 AFTER `section`',
    'SELECT "published column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 6. Fix notification_priorities table
-- ============================================
CREATE TABLE IF NOT EXISTS `notification_priorities` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `organization_id` bigint unsigned DEFAULT NULL,
    `notification_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `priority` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
    `is_critical` tinyint(1) NOT NULL DEFAULT '0',
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `deleted_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `notification_priorities_organization_id_foreign` (`organization_id`),
    CONSTRAINT `notification_priorities_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add deleted_at if table exists but column is missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'notification_priorities' 
    AND COLUMN_NAME = 'deleted_at');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `notification_priorities` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL AFTER `updated_at`',
    'SELECT "deleted_at column already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. Seed default branding if not exists
-- ============================================
INSERT IGNORE INTO `organizations_branding` (
    `organization_id`,
    `primary_color`,
    `secondary_color`,
    `accent_color`,
    `danger_color`,
    `warning_color`,
    `success_color`,
    `font_family`,
    `heading_font`,
    `border_radius`,
    `created_at`,
    `updated_at`
) VALUES (
    NULL,
    '#DCA000',
    '#1E1E6E',
    '#10B981',
    '#EF4444',
    '#F59E0B',
    '#22C55E',
    'Inter',
    'Cairo',
    '8px',
    NOW(),
    NOW()
);

-- ============================================
-- 8. Seed default landing settings if not exists
-- ============================================
INSERT IGNORE INTO `platform_contents` (
    `key`,
    `value`,
    `section`,
    `published`,
    `created_at`,
    `updated_at`
) VALUES (
    'landing_settings',
    '{"hero_title": "منصة تحليل الفيديو بالذكاء الاصطناعي", "hero_subtitle": "حول كاميرات المراقبة الى عيون ذكية تحمي منشاتك وتحلل بياناتك في الوقت الفعلي", "hero_button_text": "ابدا تجربتك المجانية - 14 يوم", "about_title": "عن المنصة", "about_description": "حل متكامل لادارة المراقبة بالفيديو والذكاء الاصطناعي مع تكاملات جاهزة.", "contact_email": "info@stc-solutions.com", "contact_phone": "+966 11 000 0000", "contact_address": "الرياض، المملكة العربية السعودية", "whatsapp_number": "+966500000000", "show_whatsapp_button": true, "footer_text": "STC Solutions. جميع الحقوق محفوظة", "social_twitter": null, "social_linkedin": null, "social_instagram": null, "features": [], "stats": []}',
    'landing',
    1,
    NOW(),
    NOW()
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the fixes:
-- SELECT 'organizations_branding' AS table_name, COUNT(*) AS row_count FROM organizations_branding;
-- SELECT 'ai_policies' AS table_name, COUNT(*) AS row_count FROM ai_policies;
-- SELECT 'system_backups' AS table_name, COUNT(*) AS row_count FROM system_backups;
-- SELECT 'notification_priorities' AS table_name, COUNT(*) AS row_count FROM notification_priorities;
-- DESCRIBE events; -- Should show 'meta' column
-- DESCRIBE platform_contents; -- Should show 'key', 'deleted_at', 'published' columns

