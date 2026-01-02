-- ============================================
-- STC AI-VAP Cloud Platform - MySQL Database
-- ============================================
-- Description: Complete MySQL database with comprehensive demo data
-- Version: 4.1.0 - FIXED & COMPLETE (Updated to match migrations)
-- Date: 2025-01-28
-- Database: MySQL 8.0+ / MariaDB 10.3+
-- ============================================
-- IMPORTANT: This database includes ALL fixes:
-- - All missing tables (organizations_branding, ai_policies, system_backups, notification_priorities, contact_inquiries)
-- - All missing columns (platform_contents.published, platform_contents.key, platform_contents.deleted_at)
-- - All migrations are idempotent-safe
-- - Registered Faces (Face Recognition)
-- - Registered Vehicles (Vehicle Recognition)
-- - Vehicle Access Logs
-- - Complete integration with Events
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ============================================
-- DROP EXISTING TABLES (if any)
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `contact_inquiries`;
DROP TABLE IF EXISTS `device_tokens`;
DROP TABLE IF EXISTS `vehicle_access_logs`;
DROP TABLE IF EXISTS `registered_vehicles`;
DROP TABLE IF EXISTS `registered_faces`;
DROP TABLE IF EXISTS `automation_logs`;
DROP TABLE IF EXISTS `automation_rules`;
DROP TABLE IF EXISTS `system_updates`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `platform_wordings`;
DROP TABLE IF EXISTS `organization_wordings`;
DROP TABLE IF EXISTS `updates`;
DROP TABLE IF EXISTS `ai_policy_events`;
DROP TABLE IF EXISTS `ai_policies`;
DROP TABLE IF EXISTS `ai_module_configs`;
DROP TABLE IF EXISTS `ai_modules`;
DROP TABLE IF EXISTS `ai_command_logs`;
DROP TABLE IF EXISTS `ai_command_targets`;
DROP TABLE IF EXISTS `ai_commands`;
DROP TABLE IF EXISTS `integrations`;
DROP TABLE IF EXISTS `analytics_widgets`;
DROP TABLE IF EXISTS `analytics_dashboards`;
DROP TABLE IF EXISTS `analytics_reports`;
DROP TABLE IF EXISTS `system_backups`;
DROP TABLE IF EXISTS `notification_priorities`;
DROP TABLE IF EXISTS `sms_quotas`;
DROP TABLE IF EXISTS `edge_server_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `cameras`;
DROP TABLE IF EXISTS `edge_servers`;
DROP TABLE IF EXISTS `licenses`;
DROP TABLE IF EXISTS `subscription_plan_limits`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `personal_access_tokens`;
DROP TABLE IF EXISTS `platform_contents`;
DROP TABLE IF EXISTS `organizations_branding`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `organizations`;
DROP TABLE IF EXISTS `distributors`;
DROP TABLE IF EXISTS `resellers`;
DROP TABLE IF EXISTS `subscription_plans`;
DROP TABLE IF EXISTS `migrations`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. DISTRIBUTORS (Resellers)
-- ============================================
CREATE TABLE `distributors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `contact_email` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. RESELLERS
-- ============================================
CREATE TABLE `resellers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `name_en` VARCHAR(255) NULL,
    `email` VARCHAR(255) UNIQUE NULL,
    `phone` VARCHAR(50) NULL,
    `company_name` VARCHAR(255) NULL,
    `tax_number` VARCHAR(255) NULL,
    `address` VARCHAR(500) NULL,
    `city` VARCHAR(255) NULL,
    `country` VARCHAR(50) NULL,
    `commission_rate` DECIMAL(5,2) DEFAULT 0.00,
    `discount_rate` DECIMAL(5,2) DEFAULT 0.00,
    `credit_limit` DECIMAL(10,2) DEFAULT 0.00,
    `contact_person` VARCHAR(255) NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_resellers_email` (`email`),
    INDEX `idx_resellers_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ORGANIZATIONS (Tenants)
-- ============================================
CREATE TABLE `organizations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `distributor_id` BIGINT UNSIGNED NULL,
    `reseller_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `name_en` VARCHAR(255) NULL,
    `slug` VARCHAR(255) UNIQUE NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `address` VARCHAR(500) NULL,
    `city` VARCHAR(255) NULL,
    `tax_number` VARCHAR(255) NULL,
    `logo_url` VARCHAR(500) NULL,
    `subscription_plan` VARCHAR(100) DEFAULT 'basic',
    `max_cameras` INT UNSIGNED DEFAULT 4,
    `max_edge_servers` INT UNSIGNED DEFAULT 1,
    `is_active` BOOLEAN DEFAULT TRUE,
    `settings` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`distributor_id`) REFERENCES `distributors`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`reseller_id`) REFERENCES `resellers`(`id`) ON DELETE SET NULL,
    INDEX `idx_organizations_distributor` (`distributor_id`),
    INDEX `idx_organizations_reseller` (`reseller_id`),
    INDEX `idx_organizations_slug` (`slug`),
    INDEX `idx_organizations_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. USERS
-- ============================================
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `role` VARCHAR(50) DEFAULT 'org_admin',
    `is_super_admin` BOOLEAN DEFAULT FALSE,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login_at` TIMESTAMP NULL,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_users_organization` (`organization_id`),
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_active` (`is_active`),
    INDEX `idx_users_super_admin` (`is_super_admin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. SUBSCRIPTION PLANS
-- ============================================
CREATE TABLE `subscription_plans` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `name_ar` VARCHAR(255) NULL,
    `max_cameras` INT UNSIGNED DEFAULT 4,
    `max_edge_servers` INT UNSIGNED DEFAULT 1,
    `available_modules` JSON NULL,
    `notification_channels` JSON NULL,
    `price_monthly` DECIMAL(10,2) DEFAULT 0.00,
    `price_yearly` DECIMAL(10,2) DEFAULT 0.00,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_subscription_plans_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5.1. ORGANIZATIONS BRANDING (FIXED - Added)
-- ============================================
CREATE TABLE `organizations_branding` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `logo_url` VARCHAR(500) NULL,
    `logo_dark_url` VARCHAR(500) NULL,
    `favicon_url` VARCHAR(500) NULL,
    `primary_color` VARCHAR(50) DEFAULT '#DCA000',
    `secondary_color` VARCHAR(50) DEFAULT '#1E1E6E',
    `accent_color` VARCHAR(50) DEFAULT '#10B981',
    `danger_color` VARCHAR(50) DEFAULT '#EF4444',
    `warning_color` VARCHAR(50) DEFAULT '#F59E0B',
    `success_color` VARCHAR(50) DEFAULT '#22C55E',
    `font_family` VARCHAR(100) DEFAULT 'Inter',
    `heading_font` VARCHAR(100) DEFAULT 'Cairo',
    `border_radius` VARCHAR(20) DEFAULT '8px',
    `custom_css` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    INDEX `idx_organizations_branding_organization` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. LICENSES
-- ============================================
CREATE TABLE `licenses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `subscription_plan_id` BIGINT UNSIGNED NULL,
    `plan` VARCHAR(100) DEFAULT 'basic',
    `license_key` VARCHAR(255) UNIQUE NOT NULL,
    `status` VARCHAR(50) DEFAULT 'active',
    `edge_server_id` VARCHAR(255) NULL,
    `max_cameras` INT UNSIGNED DEFAULT 4,
    `modules` JSON NULL,
    `trial_ends_at` TIMESTAMP NULL,
    `activated_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE SET NULL,
    INDEX `idx_licenses_organization` (`organization_id`),
    INDEX `idx_licenses_key` (`license_key`),
    INDEX `idx_licenses_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. EDGE SERVERS
-- ============================================
CREATE TABLE `edge_servers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `license_id` BIGINT UNSIGNED NULL,
    `edge_id` VARCHAR(255) UNIQUE NOT NULL,
    `name` VARCHAR(255) NULL,
    `hardware_id` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `version` VARCHAR(50) NULL,
    `location` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `online` BOOLEAN DEFAULT FALSE,
    `last_seen_at` TIMESTAMP NULL,
    `system_info` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`license_id`) REFERENCES `licenses`(`id`) ON DELETE SET NULL,
    INDEX `idx_edge_servers_organization` (`organization_id`),
    INDEX `idx_edge_servers_edge_id` (`edge_id`),
    INDEX `idx_edge_servers_online` (`online`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. CAMERAS
-- ============================================
CREATE TABLE `cameras` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `edge_server_id` BIGINT UNSIGNED NULL,
    `camera_id` VARCHAR(255) UNIQUE NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NULL,
    `rtsp_url` VARCHAR(500) NULL,
    `status` VARCHAR(50) DEFAULT 'offline',
    `config` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`edge_server_id`) REFERENCES `edge_servers`(`id`) ON DELETE SET NULL,
    INDEX `idx_cameras_organization` (`organization_id`),
    INDEX `idx_cameras_edge_server` (`edge_server_id`),
    INDEX `idx_cameras_camera_id` (`camera_id`),
    INDEX `idx_cameras_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. REGISTERED FACES
-- ============================================
CREATE TABLE `registered_faces` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `person_name` VARCHAR(255) NOT NULL,
    `employee_id` VARCHAR(100) NULL,
    `department` VARCHAR(255) NULL,
    `category` ENUM('employee', 'vip', 'visitor', 'blacklist') DEFAULT 'employee',
    `photo_url` VARCHAR(500) NULL,
    `face_encoding` TEXT NULL,
    `face_metadata` JSON NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_seen_at` TIMESTAMP NULL,
    `recognition_count` INT UNSIGNED DEFAULT 0,
    `meta` JSON NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_registered_faces_organization` (`organization_id`),
    INDEX `idx_registered_faces_category` (`category`),
    INDEX `idx_registered_faces_department` (`department`),
    INDEX `idx_registered_faces_active` (`is_active`),
    INDEX `idx_registered_faces_employee_id` (`employee_id`),
    INDEX `idx_registered_faces_last_seen` (`last_seen_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. REGISTERED VEHICLES
-- ============================================
CREATE TABLE `registered_vehicles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `plate_number` VARCHAR(50) NOT NULL,
    `plate_ar` VARCHAR(50) NULL,
    `owner_name` VARCHAR(255) NULL,
    `vehicle_type` VARCHAR(50) NULL,
    `vehicle_color` VARCHAR(50) NULL,
    `vehicle_make` VARCHAR(50) NULL,
    `vehicle_model` VARCHAR(50) NULL,
    `category` ENUM('employee', 'vip', 'visitor', 'delivery', 'blacklist') DEFAULT 'employee',
    `photo_url` VARCHAR(500) NULL,
    `plate_encoding` TEXT NULL,
    `vehicle_metadata` JSON NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_seen_at` TIMESTAMP NULL,
    `recognition_count` INT UNSIGNED DEFAULT 0,
    `meta` JSON NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `updated_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    UNIQUE KEY `unique_org_plate` (`organization_id`, `plate_number`),
    INDEX `idx_registered_vehicles_organization` (`organization_id`),
    INDEX `idx_registered_vehicles_category` (`category`),
    INDEX `idx_registered_vehicles_active` (`is_active`),
    INDEX `idx_registered_vehicles_plate_number` (`plate_number`),
    INDEX `idx_registered_vehicles_plate_ar` (`plate_ar`),
    INDEX `idx_registered_vehicles_last_seen` (`last_seen_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. VEHICLE ACCESS LOGS
-- ============================================
CREATE TABLE `vehicle_access_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `vehicle_id` BIGINT UNSIGNED NOT NULL,
    `camera_id` BIGINT UNSIGNED NULL,
    `plate_number` VARCHAR(50) NOT NULL,
    `plate_ar` VARCHAR(50) NULL,
    `direction` ENUM('in', 'out') NULL,
    `access_granted` BOOLEAN DEFAULT FALSE,
    `access_reason` VARCHAR(255) NULL,
    `confidence_score` DECIMAL(5,2) NULL,
    `photo_url` VARCHAR(500) NULL,
    `recognition_metadata` JSON NULL,
    `recognized_at` TIMESTAMP NOT NULL,
    `meta` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`vehicle_id`) REFERENCES `registered_vehicles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`camera_id`) REFERENCES `cameras`(`id`) ON DELETE SET NULL,
    INDEX `idx_vehicle_access_logs_organization` (`organization_id`),
    INDEX `idx_vehicle_access_logs_vehicle` (`vehicle_id`),
    INDEX `idx_vehicle_access_logs_camera` (`camera_id`),
    INDEX `idx_vehicle_access_logs_recognized_at` (`recognized_at`),
    INDEX `idx_vehicle_access_logs_access_granted` (`access_granted`),
    INDEX `idx_vehicle_access_logs_direction` (`direction`),
    INDEX `idx_vehicle_access_logs_org_recognized` (`organization_id`, `recognized_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. EVENTS (Alerts)
-- ============================================
CREATE TABLE `events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `edge_server_id` BIGINT UNSIGNED NULL,
    `edge_id` VARCHAR(255) NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `severity` VARCHAR(50) DEFAULT 'medium',
    `occurred_at` TIMESTAMP NOT NULL,
    `meta` JSON NULL,
    `registered_face_id` BIGINT UNSIGNED NULL,
    `registered_vehicle_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`edge_server_id`) REFERENCES `edge_servers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`registered_face_id`) REFERENCES `registered_faces`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`registered_vehicle_id`) REFERENCES `registered_vehicles`(`id`) ON DELETE SET NULL,
    INDEX `idx_events_organization` (`organization_id`),
    INDEX `idx_events_edge_id` (`edge_id`),
    INDEX `idx_events_occurred_at` (`occurred_at`),
    INDEX `idx_events_severity` (`severity`),
    INDEX `idx_events_registered_face` (`registered_face_id`),
    INDEX `idx_events_registered_vehicle` (`registered_vehicle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. NOTIFICATIONS
-- ============================================
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `edge_server_id` BIGINT UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `priority` VARCHAR(50) DEFAULT 'medium',
    `channel` VARCHAR(50) DEFAULT 'push',
    `status` VARCHAR(50) DEFAULT 'new',
    `meta` JSON NULL,
    `read_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`edge_server_id`) REFERENCES `edge_servers`(`id`) ON DELETE SET NULL,
    INDEX `idx_notifications_organization` (`organization_id`),
    INDEX `idx_notifications_user` (`user_id`),
    INDEX `idx_notifications_status` (`status`),
    INDEX `idx_notifications_read` (`read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. AI MODULES
-- ============================================
CREATE TABLE `ai_modules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) UNIQUE NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `display_name_ar` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `description_ar` TEXT NULL,
    `config_schema` JSON NULL,
    `default_config` JSON NULL,
    `required_camera_type` VARCHAR(255) NULL,
    `min_fps` INT NULL,
    `min_resolution` VARCHAR(50) NULL,
    `icon` VARCHAR(255) NULL,
    `display_order` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_ai_modules_active` (`is_active`),
    INDEX `idx_ai_modules_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. AI MODULE CONFIGS
-- ============================================
CREATE TABLE `ai_module_configs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `ai_module_id` BIGINT UNSIGNED NOT NULL,
    `config` JSON NULL,
    `is_enabled` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`ai_module_id`) REFERENCES `ai_modules`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_org_module` (`organization_id`, `ai_module_id`),
    INDEX `idx_module_configs_organization` (`organization_id`),
    INDEX `idx_module_configs_module` (`ai_module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. AI COMMANDS
-- ============================================
CREATE TABLE `ai_commands` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'queued',
    `payload` JSON NULL,
    `acknowledged_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_ai_commands_organization` (`organization_id`),
    INDEX `idx_ai_commands_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 17. INTEGRATIONS
-- ============================================
CREATE TABLE `integrations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `connection_config` JSON NULL,
    `is_active` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    INDEX `idx_integrations_organization` (`organization_id`),
    INDEX `idx_integrations_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 18. AUTOMATION RULES
-- ============================================
CREATE TABLE `automation_rules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `integration_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `name_ar` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `trigger_module` VARCHAR(100) NOT NULL,
    `trigger_event` VARCHAR(100) NOT NULL,
    `trigger_conditions` JSON NULL,
    `action_type` VARCHAR(100) NOT NULL,
    `action_command` JSON NOT NULL,
    `cooldown_seconds` INT UNSIGNED DEFAULT 60,
    `is_active` BOOLEAN DEFAULT TRUE,
    `priority` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`integration_id`) REFERENCES `integrations`(`id`) ON DELETE SET NULL,
    INDEX `idx_automation_rules_organization` (`organization_id`),
    INDEX `idx_automation_rules_active` (`is_active`),
    INDEX `idx_automation_rules_trigger_module` (`trigger_module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 19. AUTOMATION LOGS
-- ============================================
CREATE TABLE `automation_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `automation_rule_id` BIGINT UNSIGNED NOT NULL,
    `alert_id` BIGINT UNSIGNED NULL,
    `action_executed` JSON NOT NULL,
    `status` VARCHAR(50) DEFAULT 'success',
    `error_message` TEXT NULL,
    `execution_time_ms` INT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`automation_rule_id`) REFERENCES `automation_rules`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`alert_id`) REFERENCES `events`(`id`) ON DELETE SET NULL,
    INDEX `idx_automation_logs_organization` (`organization_id`),
    INDEX `idx_automation_logs_rule` (`automation_rule_id`),
    INDEX `idx_automation_logs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 20. SYSTEM UPDATES
-- ============================================
CREATE TABLE `system_updates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `version` VARCHAR(50) UNIQUE NOT NULL,
    `update_id` VARCHAR(255) UNIQUE NOT NULL,
    `manifest` JSON NOT NULL,
    `status` ENUM('pending', 'installing', 'installed', 'failed', 'rollback') DEFAULT 'pending',
    `backup_id` VARCHAR(255) NULL,
    `installed_at` TIMESTAMP NULL,
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_system_updates_version` (`version`),
    INDEX `idx_system_updates_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21. SYSTEM SETTINGS
-- ============================================
CREATE TABLE `system_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `platform_name` VARCHAR(255) DEFAULT 'STC AI-VAP',
    `platform_tagline` VARCHAR(500) NULL,
    `support_email` VARCHAR(255) NULL,
    `support_phone` VARCHAR(50) NULL,
    `default_timezone` VARCHAR(100) DEFAULT 'UTC',
    `default_language` VARCHAR(10) DEFAULT 'ar',
    `maintenance_mode` BOOLEAN DEFAULT FALSE,
    `maintenance_message` TEXT NULL,
    `session_timeout_minutes` INT UNSIGNED DEFAULT 60,
    `max_login_attempts` INT UNSIGNED DEFAULT 5,
    `password_min_length` INT UNSIGNED DEFAULT 8,
    `require_2fa` BOOLEAN DEFAULT FALSE,
    `allow_registration` BOOLEAN DEFAULT TRUE,
    `require_email_verification` BOOLEAN DEFAULT FALSE,
    `email_settings` JSON NULL,
    `sms_settings` JSON NULL,
    `fcm_settings` JSON NULL,
    `storage_settings` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.1. PLATFORM CONTENTS (FIXED - Added key, published, deleted_at)
-- ============================================
CREATE TABLE `platform_contents` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(255) UNIQUE NULL,
    `value` TEXT NULL,
    `section` VARCHAR(255) NULL,
    `published` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_platform_contents_key` (`key`),
    INDEX `idx_platform_contents_section` (`section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.2. SYSTEM BACKUPS (FIXED - Added)
-- ============================================
CREATE TABLE `system_backups` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `file_path` VARCHAR(500) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'pending',
    `meta` JSON NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_system_backups_status` (`status`),
    INDEX `idx_system_backups_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.3. NOTIFICATION PRIORITIES (FIXED - Added)
-- ============================================
CREATE TABLE `notification_priorities` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `notification_type` VARCHAR(255) NOT NULL,
    `priority` VARCHAR(50) DEFAULT 'medium',
    `is_critical` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_notification_priorities_organization` (`organization_id`),
    INDEX `idx_notification_priorities_type` (`notification_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.4. AI POLICIES (FIXED - Added)
-- ============================================
CREATE TABLE `ai_policies` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `is_enabled` BOOLEAN DEFAULT TRUE,
    `modules` JSON NULL,
    `thresholds` JSON NULL,
    `actions` JSON NULL,
    `feature_flags` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_ai_policies_organization` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.5. AI POLICY EVENTS (FIXED - Added)
-- ============================================
CREATE TABLE `ai_policy_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `ai_policy_id` BIGINT UNSIGNED NOT NULL,
    `event_type` VARCHAR(255) NOT NULL,
    `label` VARCHAR(255) NULL,
    `payload` JSON NULL,
    `weight` DECIMAL(8,2) DEFAULT 1.00,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`ai_policy_id`) REFERENCES `ai_policies`(`id`) ON DELETE CASCADE,
    INDEX `idx_ai_policy_events_policy` (`ai_policy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.6. AI COMMAND TARGETS (FIXED - Added)
-- ============================================
CREATE TABLE `ai_command_targets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `ai_command_id` BIGINT UNSIGNED NOT NULL,
    `target_type` VARCHAR(50) DEFAULT 'org',
    `target_id` VARCHAR(255) NULL,
    `meta` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`ai_command_id`) REFERENCES `ai_commands`(`id`) ON DELETE CASCADE,
    INDEX `idx_ai_command_targets_command` (`ai_command_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.7. AI COMMAND LOGS (FIXED - Added)
-- ============================================
CREATE TABLE `ai_command_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `ai_command_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(50) DEFAULT 'queued',
    `message` TEXT NULL,
    `meta` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`ai_command_id`) REFERENCES `ai_commands`(`id`) ON DELETE CASCADE,
    INDEX `idx_ai_command_logs_command` (`ai_command_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.8. DEVICE TOKENS (FIXED - Added)
-- ============================================
CREATE TABLE `device_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `organization_id` BIGINT UNSIGNED NULL,
    `token` VARCHAR(255) UNIQUE NOT NULL,
    `device_type` VARCHAR(50) NOT NULL,
    `device_id` VARCHAR(255) NULL,
    `device_name` VARCHAR(255) NULL,
    `app_version` VARCHAR(50) NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_used_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    INDEX `idx_device_tokens_user` (`user_id`, `is_active`),
    INDEX `idx_device_tokens_organization` (`organization_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.9. CONTACT INQUIRIES (FIXED - Added)
-- ============================================
CREATE TABLE `contact_inquiries` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `message` TEXT NOT NULL,
    `source` VARCHAR(100) DEFAULT 'landing_page',
    `status` ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    `read_at` TIMESTAMP NULL,
    `admin_notes` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_contact_inquiries_status` (`status`),
    INDEX `idx_contact_inquiries_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.10. UPDATES (FIXED - Added)
-- ============================================
CREATE TABLE `updates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `is_published` BOOLEAN DEFAULT FALSE,
    `organization_id` BIGINT UNSIGNED NULL,
    `published_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_updates_organization` (`organization_id`),
    INDEX `idx_updates_published` (`is_published`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.11. SMS QUOTAS (FIXED - Added)
-- ============================================
CREATE TABLE `sms_quotas` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `monthly_limit` INT UNSIGNED NOT NULL,
    `used_this_month` INT UNSIGNED DEFAULT 0,
    `resets_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    INDEX `idx_sms_quotas_organization` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.12. EDGE SERVER LOGS (FIXED - Added)
-- ============================================
CREATE TABLE `edge_server_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `edge_server_id` BIGINT UNSIGNED NOT NULL,
    `level` VARCHAR(50) DEFAULT 'info',
    `message` TEXT NOT NULL,
    `meta` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`edge_server_id`) REFERENCES `edge_servers`(`id`) ON DELETE CASCADE,
    INDEX `idx_edge_server_logs_server` (`edge_server_id`),
    INDEX `idx_edge_server_logs_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.13. ANALYTICS REPORTS (FIXED - Added)
-- ============================================
CREATE TABLE `analytics_reports` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `report_type` VARCHAR(100) DEFAULT 'event_summary',
    `parameters` JSON NULL,
    `filters` JSON NULL,
    `format` VARCHAR(50) DEFAULT 'json',
    `file_url` VARCHAR(500) NULL,
    `file_size` BIGINT UNSIGNED NULL,
    `is_scheduled` BOOLEAN DEFAULT FALSE,
    `schedule_cron` VARCHAR(100) NULL,
    `last_generated_at` TIMESTAMP NULL,
    `next_scheduled_at` TIMESTAMP NULL,
    `recipients` JSON NULL,
    `status` VARCHAR(50) DEFAULT 'draft',
    `error_message` TEXT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_analytics_reports_organization` (`organization_id`),
    INDEX `idx_analytics_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.14. ANALYTICS DASHBOARDS (FIXED - Added)
-- ============================================
CREATE TABLE `analytics_dashboards` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_default` BOOLEAN DEFAULT FALSE,
    `layout` JSON NULL,
    `is_public` BOOLEAN DEFAULT FALSE,
    `shared_with` JSON NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
    INDEX `idx_analytics_dashboards_organization` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.15. ANALYTICS WIDGETS (FIXED - Added)
-- ============================================
CREATE TABLE `analytics_widgets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `dashboard_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `widget_type` VARCHAR(100) NOT NULL,
    `config` JSON NULL,
    `data_source` VARCHAR(255) NULL,
    `filters` JSON NULL,
    `position_x` INT DEFAULT 0,
    `position_y` INT DEFAULT 0,
    `width` INT DEFAULT 4,
    `height` INT DEFAULT 3,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`dashboard_id`) REFERENCES `analytics_dashboards`(`id`) ON DELETE CASCADE,
    INDEX `idx_analytics_widgets_dashboard` (`dashboard_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 21.16. SUBSCRIPTION PLAN LIMITS (FIXED - Added)
-- ============================================
CREATE TABLE `subscription_plan_limits` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `subscription_plan_id` BIGINT UNSIGNED NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    `value` INT NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE CASCADE,
    INDEX `idx_subscription_plan_limits_plan` (`subscription_plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 22. PLATFORM WORDINGS
-- ============================================
CREATE TABLE `platform_wordings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(255) UNIQUE NOT NULL,
    `label` VARCHAR(255) NULL,
    `value_ar` TEXT NULL,
    `value_en` TEXT NULL,
    `category` VARCHAR(100) NULL DEFAULT 'general',
    `context` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `is_customizable` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,
    INDEX `idx_platform_wordings_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 23. ORGANIZATION WORDINGS
-- ============================================
CREATE TABLE `organization_wordings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `wording_id` BIGINT UNSIGNED NOT NULL,
    `custom_value_ar` TEXT NULL,
    `custom_value_en` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`wording_id`) REFERENCES `platform_wordings`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_org_wording` (`organization_id`, `wording_id`),
    INDEX `idx_org_wordings_organization` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 24. PERSONAL ACCESS TOKENS (Laravel Sanctum)
-- ============================================
CREATE TABLE `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `token` VARCHAR(64) UNIQUE NOT NULL,
    `abilities` TEXT NULL,
    `last_used_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_personal_access_tokens_tokenable` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEMO DATA
-- ============================================

-- 1. Distributors
INSERT INTO `distributors` (`id`, `name`, `contact_email`) VALUES
(1, 'موزع تجريبي', 'partner@stc-solutions.com'),
(2, 'موزع الشرق الأوسط', 'me@stc-solutions.com');

-- 2. Resellers
INSERT INTO `resellers` (`id`, `name`, `name_en`, `email`, `phone`, `company_name`, `address`, `city`, `country`, `commission_rate`, `is_active`) VALUES
(1, 'تاجر تجريبي', 'Demo Reseller', 'reseller@demo.com', '+20 100 000 0002', 'شركة التجار', 'القاهرة، مصر', 'القاهرة', 'مصر', 10.00, TRUE),
(2, 'تاجر الشمال', 'North Reseller', 'north@demo.com', '+20 100 000 0003', 'شركة الشمال', 'الإسكندرية، مصر', 'الإسكندرية', 'مصر', 8.00, TRUE);

-- 3. Organizations
INSERT INTO `organizations` (`id`, `distributor_id`, `reseller_id`, `name`, `name_en`, `slug`, `email`, `phone`, `address`, `city`, `tax_number`, `subscription_plan`, `max_cameras`, `max_edge_servers`, `is_active`) VALUES
(1, 1, 1, 'مؤسسة تجريبية', 'Demo Organization', 'demo-org', 'admin@demo-org.com', '+20 100 000 0001', 'القاهرة، مصر', 'القاهرة', 'TAX-001', 'professional', 50, 5, TRUE),
(2, 1, 2, 'شركة التكنولوجيا المتقدمة', 'Advanced Tech Company', 'advanced-tech', 'info@advanced-tech.com', '+20 100 000 0004', 'الإسكندرية، مصر', 'الإسكندرية', 'TAX-002', 'enterprise', 128, 10, TRUE),
(3, 2, NULL, 'مؤسسة الشرق', 'East Organization', 'east-org', 'contact@east-org.com', '+971 50 123 4568', 'دبي، الإمارات', 'دبي', 'TAX-003', 'basic', 10, 2, TRUE);

-- 4. Users (Super Admin)
INSERT INTO `users` (`id`, `organization_id`, `name`, `email`, `password`, `role`, `is_super_admin`, `is_active`, `phone`) VALUES
(1, NULL, 'Super Admin', 'superadmin@stc-solutions.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', TRUE, TRUE, '+20 100 000 0000');

-- 5. Users (Organization Owners & Other Roles)
INSERT INTO `users` (`id`, `organization_id`, `name`, `email`, `password`, `role`, `is_super_admin`, `is_active`, `phone`) VALUES
(2, 1, 'صاحب المؤسسة', 'owner@demo-org.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner', FALSE, TRUE, '+20 100 000 0002'),
(3, 1, 'مدير الأمن', 'admin@demo-org.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', FALSE, TRUE, '+20 100 000 0003'),
(4, 1, 'محرر', 'editor@demo-org.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'editor', FALSE, TRUE, '+20 100 000 0004'),
(5, 2, 'صاحب الشركة', 'owner@advanced-tech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner', FALSE, TRUE, '+20 100 000 0005'),
(6, 3, 'مدير المؤسسة', 'owner@east-org.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner', FALSE, TRUE, '+971 50 123 4569');

-- 6. Subscription Plans
INSERT INTO `subscription_plans` (`id`, `name`, `name_ar`, `max_cameras`, `max_edge_servers`, `available_modules`, `notification_channels`, `price_monthly`, `price_yearly`, `is_active`) VALUES
(1, 'basic', 'الباقة الأساسية', 10, 1, '["face_detection", "object_detection"]', '["push", "email"]', 500.00, 5000.00, TRUE),
(2, 'professional', 'الباقة الاحترافية', 50, 5, '["face_detection", "face_recognition", "object_detection", "vehicle_detection", "license_plate_recognition"]', '["push", "email", "sms"]', 1500.00, 15000.00, TRUE),
(3, 'enterprise', 'الباقة المؤسسية', 128, 10, '["all"]', '["push", "email", "sms", "whatsapp"]', 5000.00, 50000.00, TRUE);

-- 7. Licenses
INSERT INTO `licenses` (`id`, `organization_id`, `subscription_plan_id`, `plan`, `license_key`, `status`, `max_cameras`, `modules`, `activated_at`, `expires_at`) VALUES
(1, 1, 2, 'professional', 'DEMO-LICENSE-001', 'active', 50, '["face_detection", "face_recognition", "object_detection", "vehicle_detection", "license_plate_recognition"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
(2, 2, 3, 'enterprise', 'DEMO-LICENSE-002', 'active', 128, '["all"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR)),
(3, 3, 1, 'basic', 'DEMO-LICENSE-003', 'active', 10, '["face_detection", "object_detection"]', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR));

-- 8. Edge Servers
INSERT INTO `edge_servers` (`id`, `organization_id`, `license_id`, `edge_id`, `name`, `ip_address`, `version`, `location`, `online`, `last_seen_at`, `system_info`) VALUES
(1, 1, 1, 'edge-server-001', 'سيرفر الحرم الرئيسي', '192.168.1.100', '1.0.0', 'المبنى الرئيسي - الطابق الأول', TRUE, NOW(), '{"cpu": "Intel i7", "ram": "16GB", "storage": "500GB"}'),
(2, 1, 1, 'edge-server-002', 'سيرفر البوابة الشمالية', '192.168.1.101', '1.0.0', 'البوابة الشمالية', TRUE, DATE_SUB(NOW(), INTERVAL 5 MINUTE), '{"cpu": "Intel i5", "ram": "8GB", "storage": "250GB"}'),
(3, 2, 2, 'edge-server-003', 'سيرفر المقر الرئيسي', '192.168.2.100', '1.0.0', 'المقر الرئيسي', TRUE, NOW(), '{"cpu": "Intel i9", "ram": "32GB", "storage": "1TB"}'),
(4, 3, 3, 'edge-server-004', 'سيرفر المبنى A', '192.168.3.100', '1.0.0', 'المبنى A', FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR), '{"cpu": "Intel i5", "ram": "8GB", "storage": "250GB"}');

-- 9. Cameras
INSERT INTO `cameras` (`id`, `organization_id`, `edge_server_id`, `camera_id`, `name`, `location`, `rtsp_url`, `status`, `config`) VALUES
(1, 1, 1, 'cam-001', 'كاميرا المدخل الرئيسي', 'المدخل الرئيسي', 'rtsp://192.168.1.100:554/stream1', 'online', '{"username": "admin", "password": "encrypted", "resolution": "1920x1080", "fps": 30, "enabled_modules": ["face_detection", "face_recognition", "object_detection"]}'),
(2, 1, 1, 'cam-002', 'كاميرا الاستقبال', 'قاعة الاستقبال', 'rtsp://192.168.1.100:554/stream2', 'online', '{"username": "admin", "password": "encrypted", "resolution": "1920x1080", "fps": 25, "enabled_modules": ["face_detection", "object_detection"]}'),
(3, 1, 1, 'cam-003', 'كاميرا البوابة الشمالية', 'البوابة الشمالية', 'rtsp://192.168.1.100:554/stream3', 'online', '{"username": "admin", "password": "encrypted", "resolution": "1920x1080", "fps": 30, "enabled_modules": ["vehicle_detection", "license_plate_recognition"]}'),
(4, 1, 2, 'cam-004', 'كاميرا موقف السيارات', 'موقف السيارات', 'rtsp://192.168.1.101:554/stream1', 'online', '{"username": "admin", "password": "encrypted", "resolution": "1920x1080", "fps": 25, "enabled_modules": ["vehicle_detection", "license_plate_recognition"]}'),
(5, 2, 3, 'cam-005', 'كاميرا المدخل الرئيسي', 'المدخل الرئيسي', 'rtsp://192.168.2.100:554/stream1', 'online', '{"username": "admin", "password": "encrypted", "resolution": "3840x2160", "fps": 30, "enabled_modules": ["face_detection", "face_recognition", "object_detection", "vehicle_detection"]}'),
(6, 3, 4, 'cam-006', 'كاميرا المبنى A', 'المبنى A - المدخل', 'rtsp://192.168.3.100:554/stream1', 'offline', '{"username": "admin", "password": "encrypted", "resolution": "1920x1080", "fps": 15, "enabled_modules": ["face_detection"]}');

-- 10. Registered Faces
INSERT INTO `registered_faces` (`id`, `organization_id`, `person_name`, `employee_id`, `department`, `category`, `photo_url`, `is_active`, `last_seen_at`, `recognition_count`, `created_by`, `updated_by`) VALUES
(1, 1, 'أحمد محمد علي', 'EMP001', 'قسم تقنية المعلومات', 'employee', '/storage/people/photos/emp001.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 2 HOUR), 45, 2, 2),
(2, 1, 'فاطمة أحمد', 'EMP002', 'قسم الموارد البشرية', 'employee', '/storage/people/photos/emp002.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 1 HOUR), 32, 2, 2),
(3, 1, 'محمد خالد', 'EMP003', 'قسم الأمن', 'employee', '/storage/people/photos/emp003.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 30 MINUTE), 78, 3, 3),
(4, 1, 'سارة محمود', 'VIP001', 'إدارة', 'vip', '/storage/people/photos/vip001.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 15 MINUTE), 12, 2, 2),
(5, 1, 'علي حسن', NULL, NULL, 'visitor', '/storage/people/photos/visitor001.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 5 MINUTE), 3, 4, 4),
(6, 1, 'مشبوه', NULL, NULL, 'blacklist', '/storage/people/photos/blacklist001.jpg', TRUE, NULL, 0, 3, 3),
(7, 2, 'يوسف أحمد', 'EMP101', 'قسم التطوير', 'employee', '/storage/people/photos/emp101.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 1 HOUR), 28, 5, 5),
(8, 2, 'نورا سعيد', 'VIP101', 'إدارة', 'vip', '/storage/people/photos/vip101.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 20 MINUTE), 8, 5, 5);

-- 11. Registered Vehicles
INSERT INTO `registered_vehicles` (`id`, `organization_id`, `plate_number`, `plate_ar`, `owner_name`, `vehicle_type`, `vehicle_color`, `vehicle_make`, `vehicle_model`, `category`, `photo_url`, `is_active`, `last_seen_at`, `recognition_count`, `created_by`, `updated_by`) VALUES
(1, 1, 'ABC123', 'أ ب ج ١٢٣', 'أحمد محمد علي', 'car', 'white', 'Toyota', 'Camry', 'employee', '/storage/vehicles/photos/abc123.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 1 HOUR), 25, 2, 2),
(2, 1, 'XYZ789', 'س ص ع ٧٨٩', 'فاطمة أحمد', 'car', 'black', 'Honda', 'Accord', 'employee', '/storage/vehicles/photos/xyz789.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 30 MINUTE), 18, 2, 2),
(3, 1, 'VIP001', 'في أي بي ٠٠١', 'سارة محمود', 'car', 'silver', 'Mercedes', 'S-Class', 'vip', '/storage/vehicles/photos/vip001.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 10 MINUTE), 5, 2, 2),
(4, 1, 'DEL001', 'د ل ٠٠١', 'شركة التوصيل السريع', 'truck', 'blue', 'Ford', 'Transit', 'delivery', '/storage/vehicles/photos/del001.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 5 MINUTE), 12, 3, 3),
(5, 1, 'BLK001', 'ب ل ك ٠٠١', 'مشبوه', 'car', 'red', 'Unknown', 'Unknown', 'blacklist', '/storage/vehicles/photos/blk001.jpg', TRUE, NULL, 0, 3, 3),
(6, 2, 'ADV001', 'أ د ف ٠٠١', 'يوسف أحمد', 'car', 'blue', 'BMW', '5 Series', 'employee', '/storage/vehicles/photos/adv001.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 45 MINUTE), 15, 5, 5),
(7, 2, 'ADV002', 'أ د ف ٠٠٢', 'نورا سعيد', 'car', 'white', 'Audi', 'A6', 'vip', '/storage/vehicles/photos/adv002.jpg', TRUE, DATE_SUB(NOW(), INTERVAL 20 MINUTE), 6, 5, 5);

-- 12. Vehicle Access Logs
INSERT INTO `vehicle_access_logs` (`id`, `organization_id`, `vehicle_id`, `camera_id`, `plate_number`, `plate_ar`, `direction`, `access_granted`, `access_reason`, `confidence_score`, `recognized_at`) VALUES
(1, 1, 1, 3, 'ABC123', 'أ ب ج ١٢٣', 'in', TRUE, 'Employee vehicle - Access granted', 95.50, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 1, 2, 3, 'XYZ789', 'س ص ع ٧٨٩', 'in', TRUE, 'Employee vehicle - Access granted', 92.30, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(3, 1, 3, 3, 'VIP001', 'في أي بي ٠٠١', 'in', TRUE, 'VIP vehicle - Access granted', 98.75, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(4, 1, 4, 3, 'DEL001', 'د ل ٠٠١', 'in', TRUE, 'Delivery vehicle - Access granted', 88.20, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(5, 1, 1, 4, 'ABC123', 'أ ب ج ١٢٣', 'out', TRUE, 'Employee vehicle - Access granted', 94.10, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(6, 2, 6, 5, 'ADV001', 'أ د ف ٠٠١', 'in', TRUE, 'Employee vehicle - Access granted', 96.80, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(7, 2, 7, 5, 'ADV002', 'أ د ف ٠٠٢', 'in', TRUE, 'VIP vehicle - Access granted', 97.50, DATE_SUB(NOW(), INTERVAL 20 MINUTE));

-- 13. Events (Alerts)
INSERT INTO `events` (`id`, `organization_id`, `edge_server_id`, `edge_id`, `event_type`, `severity`, `occurred_at`, `meta`, `registered_face_id`, `registered_vehicle_id`) VALUES
(1, 1, 1, 'edge-server-001', 'face_recognized', 'low', DATE_SUB(NOW(), INTERVAL 2 HOUR), '{"confidence": 0.95, "camera_id": "cam-001"}', 1, NULL),
(2, 1, 1, 'edge-server-001', 'face_recognized', 'low', DATE_SUB(NOW(), INTERVAL 1 HOUR), '{"confidence": 0.92, "camera_id": "cam-002"}', 2, NULL),
(3, 1, 1, 'edge-server-001', 'face_recognized', 'medium', DATE_SUB(NOW(), INTERVAL 30 MINUTE), '{"confidence": 0.88, "camera_id": "cam-001"}', 3, NULL),
(4, 1, 1, 'edge-server-001', 'face_recognized', 'high', DATE_SUB(NOW(), INTERVAL 15 MINUTE), '{"confidence": 0.98, "camera_id": "cam-001"}', 4, NULL),
(5, 1, 1, 'edge-server-001', 'unknown_face', 'medium', DATE_SUB(NOW(), INTERVAL 5 MINUTE), '{"confidence": 0.75, "camera_id": "cam-002"}', 5, NULL),
(6, 1, 2, 'edge-server-002', 'vehicle_recognized', 'low', DATE_SUB(NOW(), INTERVAL 1 HOUR), '{"confidence": 0.96, "camera_id": "cam-003"}', NULL, 1),
(7, 1, 2, 'edge-server-002', 'vehicle_recognized', 'low', DATE_SUB(NOW(), INTERVAL 30 MINUTE), '{"confidence": 0.92, "camera_id": "cam-003"}', NULL, 2),
(8, 1, 2, 'edge-server-002', 'vehicle_recognized', 'high', DATE_SUB(NOW(), INTERVAL 10 MINUTE), '{"confidence": 0.99, "camera_id": "cam-003"}', NULL, 3),
(9, 1, 2, 'edge-server-002', 'vehicle_recognized', 'medium', DATE_SUB(NOW(), INTERVAL 5 MINUTE), '{"confidence": 0.88, "camera_id": "cam-003"}', NULL, 4),
(10, 1, 1, 'edge-server-001', 'fire_detected', 'critical', DATE_SUB(NOW(), INTERVAL 20 MINUTE), '{"camera_id": "cam-001", "location": "قاعة الاستقبال"}', NULL, NULL),
(11, 2, 3, 'edge-server-003', 'face_recognized', 'low', DATE_SUB(NOW(), INTERVAL 1 HOUR), '{"confidence": 0.94, "camera_id": "cam-005"}', 7, NULL),
(12, 2, 3, 'edge-server-003', 'vehicle_recognized', 'low', DATE_SUB(NOW(), INTERVAL 45 MINUTE), '{"confidence": 0.97, "camera_id": "cam-005"}', NULL, 6);

-- 14. Notifications
INSERT INTO `notifications` (`id`, `organization_id`, `user_id`, `edge_server_id`, `title`, `body`, `priority`, `channel`, `status`, `read_at`) VALUES
(1, 1, 2, 1, 'تم التعرف على شخص', 'تم التعرف على أحمد محمد علي في المدخل الرئيسي', 'low', 'push', 'new', NULL),
(2, 1, 3, 1, 'تنبيه: حريق', 'تم اكتشاف حريق في قاعة الاستقبال', 'critical', 'push', 'new', NULL),
(3, 1, 2, 2, 'تم التعرف على مركبة', 'تم التعرف على مركبة VIP في البوابة الشمالية', 'high', 'push', 'read', DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(4, 2, 5, 3, 'تم التعرف على شخص', 'تم التعرف على يوسف أحمد في المدخل الرئيسي', 'low', 'push', 'new', NULL);

-- 15. AI Modules
INSERT INTO `ai_modules` (`id`, `name`, `display_name`, `display_name_ar`, `description`, `description_ar`, `is_active`, `display_order`) VALUES
(1, 'face_detection', 'Face Detection', 'كشف الوجوه', 'Detect and identify faces in video', 'كشف وتحديد الوجوه في الفيديو', TRUE, 1),
(2, 'face_recognition', 'Face Recognition', 'التعرف على الوجوه', 'Recognize people through faces', 'التعرف على الأشخاص من خلال الوجوه', TRUE, 2),
(3, 'object_detection', 'Object Detection', 'كشف الأشياء', 'Detect and identify objects in video', 'كشف وتحديد الأشياء في الفيديو', TRUE, 3),
(4, 'vehicle_detection', 'Vehicle Detection', 'كشف المركبات', 'Detect and identify vehicles', 'كشف وتحديد المركبات', TRUE, 4),
(5, 'license_plate_recognition', 'License Plate Recognition', 'قراءة لوحات الأرقام', 'Read vehicle license plates', 'قراءة لوحات أرقام المركبات', TRUE, 5),
(6, 'crowd_counting', 'Crowd Counting', 'عد الحشود', 'Count people in crowds', 'عد الأشخاص في الحشود', TRUE, 6),
(7, 'intrusion_detection', 'Intrusion Detection', 'كشف التسلل', 'Detect intrusion in restricted areas', 'كشف التسلل في المناطق المحظورة', TRUE, 7),
(8, 'loitering_detection', 'Loitering Detection', 'كشف التكاسل', 'Detect loitering persons', 'كشف الأشخاص المتكاسلين', TRUE, 8),
(9, 'abandoned_object', 'Abandoned Object', 'الأشياء المتروكة', 'Detect abandoned objects', 'كشف الأشياء المتروكة', TRUE, 9),
(10, 'fire_detection', 'Fire Detection', 'كشف الحرائق', 'Detect fires in video', 'كشف الحرائق في الفيديو', TRUE, 10);

-- 16. AI Module Configs
INSERT INTO `ai_module_configs` (`id`, `organization_id`, `ai_module_id`, `config`, `is_enabled`) VALUES
(1, 1, 2, '{"threshold": 0.85, "max_faces": 10}', TRUE),
(2, 1, 4, '{"threshold": 0.80, "vehicle_types": ["car", "truck"]}', TRUE),
(3, 1, 5, '{"threshold": 0.90, "regions": ["saudi", "uae"]}', TRUE),
(4, 2, 2, '{"threshold": 0.90, "max_faces": 20}', TRUE),
(5, 2, 4, '{"threshold": 0.85, "vehicle_types": ["all"]}', TRUE);

-- 17. AI Commands
INSERT INTO `ai_commands` (`id`, `organization_id`, `title`, `status`, `payload`) VALUES
(1, 1, 'Face Recognition Command', 'executing', '{"command_type": "face_recognition", "camera_id": "cam-001", "module": "face_recognition"}'),
(2, 1, 'Vehicle Detection Command', 'queued', '{"command_type": "vehicle_detection", "camera_id": "cam-003", "module": "vehicle_detection"}'),
(3, 2, 'Object Detection Command', 'executing', '{"command_type": "object_detection", "camera_id": "cam-005", "module": "object_detection"}');

-- 18. Integrations
INSERT INTO `integrations` (`id`, `organization_id`, `type`, `name`, `connection_config`, `is_active`) VALUES
(1, 1, 'sms', 'SMS Gateway', '{"provider": "twilio", "api_key": "demo_key"}', TRUE),
(2, 1, 'email', 'Email Service', '{"provider": "smtp", "host": "smtp.example.com"}', TRUE),
(3, 2, 'webhook', 'Custom Webhook', '{"url": "https://api.example.com/webhook", "secret": "demo_secret"}', TRUE);

-- 19. Automation Rules
INSERT INTO `automation_rules` (`id`, `organization_id`, `name`, `name_ar`, `description`, `trigger_module`, `trigger_event`, `action_type`, `action_command`, `is_active`, `priority`) VALUES
(1, 1, 'Notify on VIP Recognition', 'إشعار عند التعرف على VIP', 'Send notification when VIP is recognized', 'face_recognition', 'vip_recognized', 'notification', '{"channels": ["push", "email"], "message": "VIP recognized"}', TRUE, 10),
(2, 1, 'Block Blacklist Vehicles', 'منع مركبات القائمة السوداء', 'Block access for blacklist vehicles', 'license_plate_recognition', 'blacklist_recognized', 'gate_control', '{"action": "close_gate", "alert": true}', TRUE, 20),
(3, 1, 'Fire Alert', 'تنبيه الحريق', 'Send critical alert on fire detection', 'fire_detection', 'fire_detected', 'notification', '{"channels": ["push", "sms", "email"], "priority": "critical"}', TRUE, 30);

-- 20. System Settings
INSERT INTO `system_settings` (`id`, `platform_name`, `platform_tagline`, `support_email`, `support_phone`, `default_timezone`, `default_language`, `maintenance_mode`, `allow_registration`) VALUES
(1, 'STC AI-VAP', 'منصة تحليل الفيديو بالذكاء الاصطناعي', 'support@stc-solutions.com', '+20 100 000 0000', 'Africa/Cairo', 'ar', FALSE, TRUE);

-- 20.1. Organizations Branding (Default Global Branding)
INSERT INTO `organizations_branding` (`id`, `organization_id`, `primary_color`, `secondary_color`, `accent_color`, `danger_color`, `warning_color`, `success_color`, `font_family`, `heading_font`, `border_radius`) VALUES
(1, NULL, '#DCA000', '#1E1E6E', '#10B981', '#EF4444', '#F59E0B', '#22C55E', 'Inter', 'Cairo', '8px');

-- 20.2. Platform Contents (Landing Settings)
INSERT INTO `platform_contents` (`id`, `key`, `value`, `section`, `published`) VALUES
(1, 'landing_settings', '{"hero_title": "منصة تحليل الفيديو بالذكاء الاصطناعي", "hero_subtitle": "حول كاميرات المراقبة الى عيون ذكية تحمي منشاتك وتحلل بياناتك في الوقت الفعلي", "hero_button_text": "ابدا تجربتك المجانية - 14 يوم", "about_title": "عن المنصة", "about_description": "حل متكامل لادارة المراقبة بالفيديو والذكاء الاصطناعي مع تكاملات جاهزة.", "contact_email": "info@stc-solutions.com", "contact_phone": "+966 11 000 0000", "contact_address": "الرياض، المملكة العربية السعودية", "whatsapp_number": "+966500000000", "show_whatsapp_button": true, "footer_text": "STC Solutions. جميع الحقوق محفوظة", "social_twitter": null, "social_linkedin": null, "social_instagram": null, "features": [], "stats": []}', 'landing', TRUE);

-- 20.3. Notification Priorities (Default Priorities)
INSERT INTO `notification_priorities` (`id`, `organization_id`, `notification_type`, `priority`, `is_critical`) VALUES
(1, NULL, 'fire_detection', 'critical', TRUE),
(2, NULL, 'intrusion_detection', 'high', TRUE),
(3, NULL, 'face_recognized', 'low', FALSE),
(4, NULL, 'vehicle_recognized', 'low', FALSE),
(5, NULL, 'object_detection', 'medium', FALSE);

-- 20.4. AI Policies (Default Global Policy)
INSERT INTO `ai_policies` (`id`, `organization_id`, `name`, `is_enabled`, `modules`, `thresholds`, `actions`, `feature_flags`) VALUES
(1, NULL, 'Default Global AI Policy', TRUE, '["face_detection", "face_recognition", "object_detection", "vehicle_detection"]', '{"confidence_threshold": 0.85, "alert_threshold": 3}', '{"notify_on_detection": true, "log_all_events": true}', '{"advanced_analytics": true, "real_time_processing": true}');

-- 21. Platform Wordings
INSERT INTO `platform_wordings` (`id`, `key`, `label`, `value_ar`, `value_en`, `category`, `is_customizable`) VALUES
(1, 'welcome_message', 'رسالة الترحيب', 'مرحباً بك في منصة STC AI-VAP', 'Welcome to STC AI-VAP Platform', 'general', TRUE),
(2, 'dashboard_title', 'عنوان لوحة التحكم', 'لوحة التحكم', 'Dashboard', 'navigation', TRUE),
(3, 'cameras_title', 'عنوان الكاميرات', 'إدارة الكاميرات', 'Camera Management', 'navigation', TRUE),
(4, 'alerts_title', 'عنوان التنبيهات', 'التنبيهات', 'Alerts', 'navigation', TRUE),
(5, 'people_title', 'عنوان الأشخاص', 'الأشخاص المسجلون', 'Registered People', 'navigation', TRUE),
(6, 'vehicles_title', 'عنوان المركبات', 'المركبات المسجلة', 'Registered Vehicles', 'navigation', TRUE),
(7, 'settings_title', 'عنوان الإعدادات', 'الإعدادات', 'Settings', 'navigation', TRUE),
(8, 'users_title', 'عنوان المستخدمين', 'المستخدمون', 'Users', 'navigation', TRUE),
(9, 'organizations_title', 'عنوان المؤسسات', 'المؤسسات', 'Organizations', 'navigation', TRUE),
(10, 'notifications_title', 'عنوان الإشعارات', 'الإشعارات', 'Notifications', 'navigation', TRUE),
(11, 'add_button', 'زر الإضافة', 'إضافة', 'Add', 'buttons', TRUE),
(12, 'edit_button', 'زر التعديل', 'تعديل', 'Edit', 'buttons', TRUE),
(13, 'delete_button', 'زر الحذف', 'حذف', 'Delete', 'buttons', TRUE),
(14, 'save_button', 'زر الحفظ', 'حفظ', 'Save', 'buttons', TRUE),
(15, 'cancel_button', 'زر الإلغاء', 'إلغاء', 'Cancel', 'buttons', TRUE),
(16, 'search_placeholder', 'نص البحث', 'ابحث...', 'Search...', 'forms', TRUE),
(17, 'loading_message', 'رسالة التحميل', 'جاري التحميل...', 'Loading...', 'messages', TRUE),
(18, 'success_message', 'رسالة النجاح', 'تم بنجاح', 'Success', 'messages', TRUE),
(19, 'error_message', 'رسالة الخطأ', 'حدث خطأ', 'Error', 'messages', TRUE),
(20, 'confirm_delete', 'تأكيد الحذف', 'هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?', 'messages', TRUE);

-- ============================================
-- END OF DATABASE SETUP
-- ============================================

