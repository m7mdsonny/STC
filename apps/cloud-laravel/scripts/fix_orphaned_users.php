<?php

/**
 * Script to fix users with deleted organization_id
 * Run: php artisan tinker < scripts/fix_orphaned_users.php
 * Or: php scripts/fix_orphaned_users.php
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Organization;

echo "🔍 Checking for users with deleted organizations...\n\n";

$users = User::whereNotNull('organization_id')->get();
$fixed = 0;
$deleted = 0;

foreach ($users as $user) {
    $org = Organization::withTrashed()->find($user->organization_id);
    
    if (!$org) {
        echo "❌ User {$user->id} has organization_id {$user->organization_id} but organization doesn't exist\n";
        $user->organization_id = null;
        $user->save();
        $fixed++;
    } elseif ($org->trashed()) {
        echo "⚠️  User {$user->id} has organization_id {$user->organization_id} but organization is soft-deleted\n";
        // Soft delete the user as well
        $user->delete();
        $deleted++;
    }
}

echo "\n✅ Fixed: {$fixed} users (cleared organization_id)\n";
echo "🗑️  Deleted: {$deleted} users (soft-deleted with organization)\n";
echo "\n✨ Done!\n";
