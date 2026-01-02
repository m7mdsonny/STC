<?php

/**
 * Migration History Sync Script
 * 
 * This script syncs the migrations table with existing database tables.
 * It registers migrations for tables that already exist in the database
 * but are not recorded in the migrations table.
 * 
 * Usage: php artisan tinker < database/scripts/sync_migration_history.php
 * Or: php -r "require 'vendor/autoload.php'; require 'database/scripts/sync_migration_history.php';"
 */

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "🔍 Syncing migration history with existing tables...\n\n";

// Map of table names to their migration file names
$tableToMigrationMap = [
    'distributors' => '2024_01_01_000000_create_core_platform_tables',
    'resellers' => '2024_01_01_000000_create_core_platform_tables',
    'organizations' => '2024_01_01_000000_create_core_platform_tables',
    'subscription_plans' => '2024_01_01_000000_create_core_platform_tables',
    'organizations_branding' => '2024_01_01_000000_create_core_platform_tables',
    'users' => '2024_01_01_000000_create_core_platform_tables',
    'subscription_plan_limits' => '2024_01_01_000000_create_core_platform_tables',
    'licenses' => '2024_01_01_000000_create_core_platform_tables',
    'edge_servers' => '2024_01_01_000000_create_core_platform_tables',
    'events' => '2024_01_01_000000_create_core_platform_tables',
    'edge_server_logs' => '2024_01_01_000000_create_core_platform_tables',
    'notifications' => '2024_01_01_000000_create_core_platform_tables',
    'notification_priorities' => '2024_01_01_000000_create_core_platform_tables',
    'sms_quotas' => '2024_01_01_000000_create_core_platform_tables',
    'system_settings' => '2024_01_01_000000_create_core_platform_tables',
    'platform_contents' => '2024_01_01_000000_create_core_platform_tables',
    'system_backups' => '2024_01_01_000000_create_core_platform_tables',
    'analytics_reports' => '2024_01_01_000000_create_core_platform_tables',
    'analytics_dashboards' => '2024_01_01_000000_create_core_platform_tables',
    'analytics_widgets' => '2024_01_01_000000_create_core_platform_tables',
    'ai_policies' => '2024_01_01_000000_create_core_platform_tables',
    'ai_policy_events' => '2024_01_01_000000_create_core_platform_tables',
    'personal_access_tokens' => '2024_01_01_000000_create_core_platform_tables',
    'platform_wordings' => '2025_01_02_140000_create_platform_wordings_table',
    'organization_wordings' => '2025_01_02_140000_create_platform_wordings_table',
    'ai_modules' => '2025_01_02_120000_create_ai_modules_table',
    'ai_module_configs' => '2025_01_02_120000_create_ai_modules_table',
    'integrations' => '2025_01_02_100000_create_integrations_table',
    'ai_commands' => '2025_01_02_090000_create_ai_commands_tables',
    'ai_command_targets' => '2025_01_02_090000_create_ai_commands_tables',
    'ai_command_logs' => '2025_01_02_090000_create_ai_commands_tables',
    'updates' => '2025_01_01_131000_create_updates_table',
    'system_updates' => '2025_01_15_000000_create_system_updates_table',
    'automation_rules' => '2025_01_20_000000_create_automation_rules_tables',
    'automation_logs' => '2025_01_20_000000_create_automation_rules_tables',
    'registered_faces' => '2025_01_27_000000_create_registered_faces_table',
    'registered_vehicles' => '2025_01_27_000001_create_registered_vehicles_table',
    'vehicle_access_logs' => '2025_01_27_000002_create_vehicle_access_logs_table',
    'device_tokens' => '2024_12_20_000000_create_device_tokens_table',
    'contact_inquiries' => '2025_01_28_000000_create_contact_inquiries_table',
];

// Get all existing migrations
$existingMigrations = DB::table('migrations')->pluck('migration')->toArray();

$synced = 0;
$skipped = 0;

foreach ($tableToMigrationMap as $tableName => $migrationName) {
    // Check if table exists
    if (!Schema::hasTable($tableName)) {
        echo "⏭️  Table '{$tableName}' does not exist, skipping...\n";
        $skipped++;
        continue;
    }

    // Check if migration is already registered
    if (in_array($migrationName, $existingMigrations)) {
        echo "✅ Migration '{$migrationName}' already registered for table '{$tableName}'\n";
        continue;
    }

    // Register the migration
    try {
        DB::table('migrations')->insert([
            'migration' => $migrationName,
            'batch' => DB::table('migrations')->max('batch') + 1,
        ]);
        echo "✅ Registered migration '{$migrationName}' for existing table '{$tableName}'\n";
        $synced++;
    } catch (\Exception $e) {
        echo "❌ Failed to register migration '{$migrationName}': {$e->getMessage()}\n";
    }
}

echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 Summary:\n";
echo "   Synced: {$synced} migrations\n";
echo "   Skipped: {$skipped} tables (don't exist)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "\n✅ Migration history sync complete!\n";
echo "   You can now run 'php artisan migrate' safely.\n";

