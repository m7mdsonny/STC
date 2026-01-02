<?php

/**
 * Script to fix DatabaseSeeder.php on the server
 * This script updates the seeder to match the actual database schema
 */

$seederPath = __DIR__ . '/../seeders/DatabaseSeeder.php';

if (!file_exists($seederPath)) {
    die("Error: DatabaseSeeder.php not found at: $seederPath\n");
}

// Read the current file
$content = file_get_contents($seederPath);

// Backup the original file
$backupPath = $seederPath . '.backup.' . date('Y-m-d_H-i-s');
copy($seederPath, $backupPath);
echo "✅ Backup created: $backupPath\n";

// Fix distributors section
$distributorsOld = "/\/\/ 1\. Create Distributors.*?\]\s*\]\);/s";
$distributorsNew = <<<'PHP'
        // 1. Create Distributors (only if not exists)
        // Note: distributors table only has: id, name, contact_email, timestamps, softDeletes
        if (DB::table('distributors')->where('id', 1)->doesntExist()) {
            DB::table('distributors')->insert([
            [
                'id' => 1,
                'name' => 'STC Solutions Master Distributor',
                'contact_email' => 'partner@stc-solutions.com',
                'created_at' => now(),
                'updated_at' => now(),
            ]
            ]);
        }
PHP;

$content = preg_replace($distributorsOld, $distributorsNew, $content);

// Fix organizations section
$organizationsOld = "/\/\/ 2\. Create Organizations.*?\]\s*\]\);/s";
$organizationsNew = <<<'PHP'
        // 2. Create Organizations (only if not exists)
        // Note: organizations table has: id, distributor_id, reseller_id, name, name_en, logo_url, 
        // address, city, phone, email, tax_number, subscription_plan, max_cameras, max_edge_servers, 
        // is_active, timestamps, softDeletes
        if (DB::table('organizations')->where('id', 1)->doesntExist()) {
            DB::table('organizations')->insert([
            [
                'id' => 1,
                'distributor_id' => 1,
                'reseller_id' => null,
                'name' => 'Demo Corporation',
                'name_en' => 'Demo Corporation',
                'logo_url' => null,
                'address' => 'King Fahd Road, Riyadh',
                'city' => 'Riyadh',
                'phone' => '+966 11 111 1111',
                'email' => 'contact@democorp.local',
                'tax_number' => null,
                'subscription_plan' => 'basic',
                'max_cameras' => 50,
                'max_edge_servers' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
            ]);
        }
PHP;

$content = preg_replace($organizationsOld, $organizationsNew, $content);

// Write the updated content
file_put_contents($seederPath, $content);

echo "✅ DatabaseSeeder.php has been updated!\n";
echo "\n📋 Changes made:\n";
echo "  - Removed 'contact_phone', 'address', 'commission_rate', 'status' from distributors\n";
echo "  - Updated organizations to use correct schema (email, phone, is_active, etc.)\n";
echo "\n✅ You can now run: php artisan db:seed\n";

