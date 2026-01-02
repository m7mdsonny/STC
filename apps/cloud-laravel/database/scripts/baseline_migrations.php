<?php

/**
 * Migration Baseline Script
 * 
 * This script syncs the migrations table with existing database tables.
 * It registers migrations for tables/columns that already exist in the database
 * but are not recorded in the migrations table.
 * 
 * This is essential for production databases that were imported or created
 * before migrations were run.
 * 
 * Usage:
 *   php artisan tinker
 *   >>> require 'database/scripts/baseline_migrations.php';
 * 
 * Or via command line:
 *   php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require 'database/scripts/baseline_migrations.php';"
 */

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "🔧 Migration Baseline Sync Script\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Map of table names to their migration file names
$tableToMigrationMap = [
    // Core tables
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
    
    // Additional migrations
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

// Column-based migrations (check for specific columns)
$columnToMigrationMap = [
    ['table' => 'users', 'column' => 'is_super_admin', 'migration' => '2024_01_02_000000_add_is_super_admin_to_users'],
    ['table' => 'platform_contents', 'column' => 'published', 'migration' => '2025_01_01_130000_add_published_to_platform_contents'],
    ['table' => 'platform_contents', 'column' => 'key', 'migration' => '2025_01_28_000001_fix_platform_contents_key_column'],
    ['table' => 'platform_contents', 'column' => 'deleted_at', 'migration' => '2025_01_28_000003_fix_platform_contents_soft_deletes'],
    ['table' => 'events', 'column' => 'registered_face_id', 'migration' => '2025_01_27_000003_add_registered_relations_to_events_table'],
    ['table' => 'events', 'column' => 'registered_vehicle_id', 'migration' => '2025_01_27_000003_add_registered_relations_to_events_table'],
    ['table' => 'subscription_plans', 'column' => 'sms_quota', 'migration' => '2025_01_01_120000_add_sms_quota_to_subscription_plans'],
];

// Get all existing migrations
$existingMigrations = DB::table('migrations')->pluck('migration')->toArray();

$synced = 0;
$skipped = 0;
$errors = 0;

echo "📋 Step 1: Syncing table-based migrations...\n\n";

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
        $maxBatch = DB::table('migrations')->max('batch') ?? 0;
        DB::table('migrations')->insert([
            'migration' => $migrationName,
            'batch' => $maxBatch + 1,
        ]);
        echo "✅ Registered migration '{$migrationName}' for existing table '{$tableName}'\n";
        $synced++;
    } catch (\Exception $e) {
        echo "❌ Failed to register migration '{$migrationName}': {$e->getMessage()}\n";
        $errors++;
    }
}

echo "\n📋 Step 2: Syncing column-based migrations...\n\n";

foreach ($columnToMigrationMap as $mapping) {
    $tableName = $mapping['table'];
    $columnName = $mapping['column'];
    $migrationName = $mapping['migration'];

    // Check if table exists
    if (!Schema::hasTable($tableName)) {
        echo "⏭️  Table '{$tableName}' does not exist, skipping column '{$columnName}'...\n";
        $skipped++;
        continue;
    }

    // Check if column exists
    if (!Schema::hasColumn($tableName, $columnName)) {
        echo "⏭️  Column '{$tableName}.{$columnName}' does not exist, skipping...\n";
        $skipped++;
        continue;
    }

    // Check if migration is already registered
    if (in_array($migrationName, $existingMigrations)) {
        echo "✅ Migration '{$migrationName}' already registered for column '{$tableName}.{$columnName}'\n";
        continue;
    }

    // Register the migration
    try {
        $maxBatch = DB::table('migrations')->max('batch') ?? 0;
        DB::table('migrations')->insert([
            'migration' => $migrationName,
            'batch' => $maxBatch + 1,
        ]);
        echo "✅ Registered migration '{$migrationName}' for existing column '{$tableName}.{$columnName}'\n";
        $synced++;
    } catch (\Exception $e) {
        echo "❌ Failed to register migration '{$migrationName}': {$e->getMessage()}\n";
        $errors++;
    }
}

echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 Summary:\n";
echo "   ✅ Synced: {$synced} migrations\n";
echo "   ⏭️  Skipped: {$skipped} tables/columns (don't exist)\n";
if ($errors > 0) {
    echo "   ❌ Errors: {$errors} migrations failed\n";
}
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "\n✅ Migration baseline sync complete!\n";
echo "   You can now run 'php artisan migrate' safely.\n";
echo "   It will only run migrations that haven't been executed yet.\n\n";

