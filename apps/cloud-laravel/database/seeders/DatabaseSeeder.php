<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks for MariaDB/MySQL compatibility
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

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

        // 3. Create Users (Super Admin & Organization Admin) - only if not exists
        $usersToCreate = [];
        
        // Super Admin - Read from env or use default
        $superAdminEmail = env('SUPER_ADMIN_EMAIL', 'superadmin@demo.local');
        $superAdminPassword = env('SUPER_ADMIN_PASSWORD', 'Super@12345');
        
        if (DB::table('users')->where('email', $superAdminEmail)->doesntExist()) {
            $usersToCreate[] = [
                'organization_id' => null,
                'name' => 'Super Administrator',
                'email' => $superAdminEmail,
                'password' => Hash::make($superAdminPassword),
                'role' => 'super_admin',
                'phone' => '+966 50 000 0001',
                'is_active' => true,
                'is_super_admin' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        // Organization Admin
        if (DB::table('users')->where('email', 'admin@org1.local')->doesntExist()) {
            $usersToCreate[] = [
                'organization_id' => 1,
                'name' => 'Organization Administrator',
                'email' => 'admin@org1.local',
                'password' => Hash::make('Admin@12345'),
                'role' => 'admin',
                'phone' => '+966 50 000 0002',
                'is_active' => true,
                'is_super_admin' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        // Security Operator (Editor role)
        if (DB::table('users')->where('email', 'operator@org1.local')->doesntExist()) {
            $usersToCreate[] = [
                'organization_id' => 1,
                'name' => 'Security Operator',
                'email' => 'operator@org1.local',
                'password' => Hash::make('Operator@12345'),
                'role' => 'editor',
                'phone' => '+966 50 000 0003',
                'is_active' => true,
                'is_super_admin' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        // Viewer User
        if (DB::table('users')->where('email', 'viewer@org1.local')->doesntExist()) {
            $usersToCreate[] = [
                'organization_id' => 1,
                'name' => 'Viewer User',
                'email' => 'viewer@org1.local',
                'password' => Hash::make('Viewer@12345'),
                'role' => 'viewer',
                'phone' => '+966 50 000 0004',
                'is_active' => true,
                'is_super_admin' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        // Insert users if any to create
        if (!empty($usersToCreate)) {
            DB::table('users')->insert($usersToCreate);
        }

        // 4. Create Licenses (only if not exists)
        // Note: licenses table has: id, organization_id, subscription_plan_id, plan, license_key, 
        // status, edge_server_id, max_cameras, modules, trial_ends_at, activated_at, expires_at, 
        // timestamps, softDeletes
        if (DB::table('licenses')->where('id', 1)->doesntExist()) {
            DB::table('licenses')->insert([
            [
                'id' => 1,
                'organization_id' => 1,
                'subscription_plan_id' => null,
                'plan' => 'basic',
                'license_key' => 'DEMO-CORP-2024-FULL-ACCESS',
                'status' => 'active',
                'edge_server_id' => null,
                'max_cameras' => 50,
                'modules' => null,
                'trial_ends_at' => null,
                'activated_at' => now(),
                'expires_at' => now()->addYear(),
                'created_at' => now(),
                'updated_at' => now(),
            ]
            ]);
        }

        // 5. Create Edge Servers (only if not exists)
        if (DB::table('edge_servers')->where('edge_id', 'EDGE-DEMO-MAIN-001')->doesntExist()) {
            DB::table('edge_servers')->insert([
            [
                'id' => 1,
                'edge_id' => 'EDGE-DEMO-MAIN-001',
                'organization_id' => 1,
                'name' => 'Main Building Edge Server',
                'location' => 'Building A - Server Room',
                'version' => '1.0.0',
                'ip_address' => '192.168.1.100',
                'online' => true,
                'last_seen_at' => now(),
                'system_info' => json_encode([
                    'cpu' => 'Intel Core i7-10700',
                    'ram' => '32GB',
                    'gpu' => 'NVIDIA RTX 3060',
                    'storage' => '1TB SSD',
                    'os' => 'Ubuntu 22.04 LTS'
                ]),
                'created_at' => now()->subDays(30),
                'updated_at' => now(),
            ]
            ]);
        }
        
        if (DB::table('edge_servers')->where('edge_id', 'EDGE-DEMO-GATE-002')->doesntExist()) {
            DB::table('edge_servers')->insert([
            [
                'id' => 2,
                'edge_id' => 'EDGE-DEMO-GATE-002',
                'organization_id' => 1,
                'name' => 'Gate Entrance Edge Server',
                'location' => 'Main Gate',
                'version' => '1.0.0',
                'ip_address' => '192.168.1.101',
                'online' => true,
                'last_seen_at' => now(),
                'system_info' => json_encode([
                    'cpu' => 'Intel Core i5-10400',
                    'ram' => '16GB',
                    'storage' => '500GB SSD',
                    'os' => 'Ubuntu 22.04 LTS'
                ]),
                'created_at' => now()->subDays(25),
                'updated_at' => now(),
            ]
            ]);
        }

        // 6. Create Events (Sample data for different event types) - only if table is empty
        if (DB::table('events')->count() === 0) {
        $eventTypes = [
            ['type' => 'fire_detection', 'severity' => 'critical', 'title' => 'Fire Detected', 'description' => 'Fire detected in storage area'],
            ['type' => 'face_recognition', 'severity' => 'info', 'title' => 'Employee Detected', 'description' => 'John Doe entered the building'],
            ['type' => 'intrusion', 'severity' => 'high', 'title' => 'Intrusion Alert', 'description' => 'Unauthorized person in restricted area'],
            ['type' => 'vehicle_anpr', 'severity' => 'info', 'title' => 'Vehicle Entry', 'description' => 'Vehicle ABC-1234 entered parking'],
            ['type' => 'ppe_violation', 'severity' => 'medium', 'title' => 'PPE Violation', 'description' => 'Worker without helmet detected'],
            ['type' => 'weapon_detection', 'severity' => 'critical', 'title' => 'Weapon Detected', 'description' => 'Firearm detected at entrance'],
            ['type' => 'people_counting', 'severity' => 'info', 'title' => 'Occupancy Update', 'description' => 'Current occupancy: 45 people'],
        ];

        $events = [];
        for ($i = 0; $i < 100; $i++) {
            $eventType = $eventTypes[array_rand($eventTypes)];
            $daysAgo = rand(0, 30);
            $events[] = [
                'edge_id' => rand(1, 2) === 1 ? 'EDGE-DEMO-MAIN-001' : 'EDGE-DEMO-GATE-002',
                'organization_id' => 1,
                'camera_id' => 'CAM-' . str_pad(rand(1, 10), 3, '0', STR_PAD_LEFT),
                'event_type' => $eventType['type'],
                'severity' => $eventType['severity'],
                'title' => $eventType['title'],
                'description' => $eventType['description'],
                'occurred_at' => now()->subDays($daysAgo)->subHours(rand(0, 23)),
                'acknowledged_at' => rand(0, 1) ? now()->subDays($daysAgo)->addHours(1) : null,
                'resolved_at' => rand(0, 2) > 0 ? now()->subDays($daysAgo)->addHours(2) : null,
                'meta' => json_encode([
                    'confidence' => rand(85, 99) / 100,
                    'camera_location' => ['Entrance', 'Parking', 'Hallway', 'Storage'][rand(0, 3)],
                    'acknowledged_by' => rand(0, 1) ? 2 : null,
                    'resolved_by' => rand(0, 2) > 0 ? 2 : null,
                ]),
                'created_at' => now()->subDays($daysAgo),
            ];
        }
        DB::table('events')->insert($events);
        }

        // 7. Create Notifications - only if table is empty
        if (DB::table('notifications')->count() === 0) {
            $notifications = [];
        for ($i = 0; $i < 50; $i++) {
            $daysAgo = rand(0, 15);
            $notifications[] = [
                'user_id' => rand(2, 4),
                'organization_id' => 1,
                'channel' => ['push', 'email', 'sms', 'whatsapp'][rand(0, 3)],
                'title' => 'Alert Notification',
                'message' => 'You have a new alert that requires attention',
                'type' => ['info', 'warning', 'alert', 'critical'][rand(0, 3)],
                'read_at' => rand(0, 1) ? now()->subDays($daysAgo)->addHours(1) : null,
                'data' => json_encode(['event_id' => rand(1, 100)]),
                'created_at' => now()->subDays($daysAgo),
            ];
        }
        DB::table('notifications')->insert($notifications);
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        
        echo "\n✅ Database seeded successfully!\n";
        echo "\n📝 Login Credentials:\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Super Admin:\n";
        $superAdminEmail = env('SUPER_ADMIN_EMAIL', 'superadmin@demo.local');
        $superAdminPassword = env('SUPER_ADMIN_PASSWORD', 'Super@12345');
        echo "  Email: {$superAdminEmail}\n";
        echo "  Password: {$superAdminPassword}\n";
        echo "\nOrganization Admin:\n";
        echo "  Email: admin@org1.local\n";
        echo "  Password: Admin@12345\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    }
}
