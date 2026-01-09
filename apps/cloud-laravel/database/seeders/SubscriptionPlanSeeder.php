<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\DB;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Seed subscription plans
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic',
                'name_ar' => 'أساسي',
                'max_cameras' => 4,
                'max_edge_servers' => 1,
                'available_modules' => ['fire_detection', 'intrusion_detection'],
                'notification_channels' => ['push'],
                'price_monthly' => 0,
                'price_yearly' => 0,
                'sms_quota' => 0,
                'retention_days' => 30,
                'is_active' => true,
            ],
            [
                'name' => 'Professional',
                'name_ar' => 'احترافي',
                'max_cameras' => 20,
                'max_edge_servers' => 3,
                'available_modules' => ['fire_detection', 'intrusion_detection', 'face_recognition', 'vehicle_recognition', 'crowd_detection'],
                'notification_channels' => ['push', 'email'],
                'price_monthly' => 500,
                'price_yearly' => 5000,
                'sms_quota' => 100,
                'retention_days' => 90,
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'name_ar' => 'مؤسسي',
                'max_cameras' => 100,
                'max_edge_servers' => 10,
                'available_modules' => ['fire_detection', 'intrusion_detection', 'face_recognition', 'vehicle_recognition', 'crowd_detection', 'ppe_detection', 'production_monitoring', 'warehouse_monitoring'],
                'notification_channels' => ['push', 'email', 'sms'],
                'price_monthly' => 2000,
                'price_yearly' => 20000,
                'sms_quota' => 1000,
                'retention_days' => 365,
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
