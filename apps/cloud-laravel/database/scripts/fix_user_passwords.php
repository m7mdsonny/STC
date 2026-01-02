<?php

/**
 * Script to fix user passwords and verify login credentials
 * 
 * Usage: php database/scripts/fix_user_passwords.php
 */

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

echo "=== User Password Fix Script ===\n\n";

// List all users
$users = User::withTrashed()->get();

echo "Found " . $users->count() . " users (including soft-deleted)\n\n";

foreach ($users as $user) {
    echo "User ID: {$user->id}\n";
    echo "  Name: {$user->name}\n";
    echo "  Email: {$user->email}\n";
    echo "  Phone: " . ($user->phone ?? 'N/A') . "\n";
    echo "  Role: {$user->role}\n";
    echo "  is_super_admin: " . ($user->is_super_admin ? 'true' : 'false') . "\n";
    echo "  is_active: " . ($user->is_active ? 'true' : 'false') . "\n";
    echo "  deleted_at: " . ($user->deleted_at ? $user->deleted_at->toDateTimeString() : 'null') . "\n";
    echo "  Password hash: " . substr($user->password, 0, 20) . "...\n";
    
    // Test password
    $testPasswords = ['password', 'Super@12345', 'Admin@12345', 'Owner@12345'];
    $passwordMatch = false;
    foreach ($testPasswords as $testPassword) {
        if (Hash::check($testPassword, $user->password)) {
            echo "  ✓ Password matches: {$testPassword}\n";
            $passwordMatch = true;
            break;
        }
    }
    
    if (!$passwordMatch) {
        echo "  ✗ Password does not match any known password\n";
    }
    
    echo "\n";
}

// Fix common users
echo "=== Fixing Common Users ===\n\n";

$commonUsers = [
    [
        'email' => 'superadmin@demo.local',
        'password' => 'Super@12345',
        'name' => 'Super Admin',
        'role' => 'super_admin',
    ],
    [
        'email' => 'owner@org1.local',
        'password' => 'Owner@12345',
        'name' => 'Organization Owner',
        'role' => 'owner',
        'organization_id' => 1,
    ],
    [
        'email' => 'admin@org1.local',
        'password' => 'Admin@12345',
        'name' => 'Organization Admin',
        'role' => 'admin',
        'organization_id' => 1,
    ],
];

foreach ($commonUsers as $userData) {
    $user = User::withTrashed()->where('email', $userData['email'])->first();
    
    if ($user) {
        if ($user->deleted_at) {
            echo "Restoring deleted user: {$userData['email']}\n";
            $user->restore();
        }
        
        $user->password = Hash::make($userData['password']);
        $user->is_active = true;
        if (isset($userData['organization_id'])) {
            $user->organization_id = $userData['organization_id'];
        }
        $user->save();
        
        echo "✓ Updated user: {$userData['email']} with password: {$userData['password']}\n";
    } else {
        echo "✗ User not found: {$userData['email']}\n";
    }
}

echo "\n=== Done ===\n";

