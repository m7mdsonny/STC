<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure subscription_plans table has baseline data
        if (Schema::hasTable('subscription_plans')) {
            // Basic Plan
            if (DB::table('subscription_plans')->where('name', 'basic')->doesntExist()) {
                DB::table('subscription_plans')->insert([
                    'name' => 'basic',
                    'name_ar' => 'الخطة الأساسية',
                    'max_cameras' => 4,
                    'max_edge_servers' => 1,
                    'available_modules' => json_encode(['fire', 'face', 'counter']),
                    'notification_channels' => json_encode(['push']),
                    'price_monthly' => 0,
                    'price_yearly' => 0,
                    'is_active' => true,
                    'sms_quota' => 100,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            // Premium Plan
            if (DB::table('subscription_plans')->where('name', 'premium')->doesntExist()) {
                DB::table('subscription_plans')->insert([
                    'name' => 'premium',
                    'name_ar' => 'الخطة المميزة',
                    'max_cameras' => 50,
                    'max_edge_servers' => 5,
                    'available_modules' => json_encode(['fire', 'face', 'counter', 'vehicle', 'ppe', 'weapon']),
                    'notification_channels' => json_encode(['push', 'email', 'sms', 'whatsapp']),
                    'price_monthly' => 500,
                    'price_yearly' => 5000,
                    'is_active' => true,
                    'sms_quota' => 1000,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            // Enterprise Plan
            if (DB::table('subscription_plans')->where('name', 'enterprise')->doesntExist()) {
                DB::table('subscription_plans')->insert([
                    'name' => 'enterprise',
                    'name_ar' => 'الخطة المؤسسية',
                    'max_cameras' => 500,
                    'max_edge_servers' => 50,
                    'available_modules' => json_encode(['fire', 'face', 'counter', 'vehicle', 'ppe', 'weapon', 'intrusion', 'crowd']),
                    'notification_channels' => json_encode(['push', 'email', 'sms', 'whatsapp', 'webhook']),
                    'price_monthly' => 2000,
                    'price_yearly' => 20000,
                    'is_active' => true,
                    'sms_quota' => 10000,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Don't delete subscription plans on rollback (they might be in use)
        // If needed, can be manually deleted
    }
};
