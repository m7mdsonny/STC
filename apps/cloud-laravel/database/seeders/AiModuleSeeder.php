<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AiModule;

class AiModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'module_key' => 'fire_detection',
                'name' => 'Fire & Smoke Detection',
                'description' => 'Detect fire and smoke in real-time using advanced AI algorithms',
                'category' => 'safety',
                'is_enabled' => true,
                'is_premium' => false,
                'min_plan_level' => 1,
                'icon' => 'flame',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 1,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.8],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 3],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.8,
                    'alert_threshold' => 3,
                ],
            ],
            [
                'module_key' => 'intrusion_detection',
                'name' => 'Intrusion Detection',
                'description' => 'Detect unauthorized access and intrusions in restricted areas',
                'category' => 'security',
                'is_enabled' => true,
                'is_premium' => false,
                'min_plan_level' => 1,
                'icon' => 'shield-alert',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 2,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.75],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 2],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.75,
                    'alert_threshold' => 2,
                ],
            ],
            [
                'module_key' => 'face_recognition',
                'name' => 'Face Recognition',
                'description' => 'Identify and track individuals using facial recognition technology',
                'category' => 'security',
                'is_enabled' => true,
                'is_premium' => true,
                'min_plan_level' => 2,
                'icon' => 'user-check',
                'min_fps' => 25,
                'min_resolution' => '1080p',
                'display_order' => 3,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.85],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 1],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.85,
                    'alert_threshold' => 1,
                ],
            ],
            [
                'module_key' => 'vehicle_recognition',
                'name' => 'Vehicle Recognition (ANPR)',
                'description' => 'Automatic Number Plate Recognition for vehicle tracking',
                'category' => 'security',
                'is_enabled' => true,
                'is_premium' => true,
                'min_plan_level' => 2,
                'icon' => 'car',
                'min_fps' => 25,
                'min_resolution' => '1080p',
                'display_order' => 4,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.8],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 1],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.8,
                    'alert_threshold' => 1,
                ],
            ],
            [
                'module_key' => 'crowd_detection',
                'name' => 'Crowd Detection',
                'description' => 'Monitor and analyze crowd density and movement patterns',
                'category' => 'analytics',
                'is_enabled' => true,
                'is_premium' => true,
                'min_plan_level' => 2,
                'icon' => 'users',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 5,
                'config_schema' => [
                    'density_threshold' => ['type' => 'number', 'min' => 1, 'max' => 100, 'default' => 10],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 5],
                ],
                'default_config' => [
                    'density_threshold' => 10,
                    'alert_threshold' => 5,
                ],
            ],
            [
                'module_key' => 'ppe_detection',
                'name' => 'PPE Detection',
                'description' => 'Ensure safety equipment compliance (helmets, vests, etc.)',
                'category' => 'safety',
                'is_enabled' => true,
                'is_premium' => true,
                'min_plan_level' => 3,
                'icon' => 'hard-hat',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 6,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.75],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 1],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.75,
                    'alert_threshold' => 1,
                ],
            ],
            [
                'module_key' => 'production_monitoring',
                'name' => 'Production Monitoring',
                'description' => 'Monitor production lines and detect anomalies',
                'category' => 'operations',
                'is_enabled' => true,
                'is_premium' => true,
                'min_plan_level' => 3,
                'icon' => 'factory',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 7,
                'config_schema' => [
                    'anomaly_threshold' => ['type' => 'number', 'min' => 0.1, 'max' => 1.0, 'default' => 0.5],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 3],
                ],
                'default_config' => [
                    'anomaly_threshold' => 0.5,
                    'alert_threshold' => 3,
                ],
            ],
            [
                'module_key' => 'warehouse_monitoring',
                'name' => 'Warehouse Monitoring',
                'description' => 'Monitor warehouse operations and detect unauthorized access',
                'category' => 'operations',
                'is_enabled' => true,
                'is_premium' => true,
                'min_plan_level' => 3,
                'icon' => 'package',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 8,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.7],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 2],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.7,
                    'alert_threshold' => 2,
                ],
            ],
            [
                'module_key' => 'drowning_detection',
                'name' => 'Drowning Detection',
                'description' => 'Detect drowning incidents in pools and water areas',
                'category' => 'safety',
                'is_enabled' => true,
                'is_premium' => true,
                'min_plan_level' => 3,
                'icon' => 'waves',
                'min_fps' => 25,
                'min_resolution' => '1080p',
                'display_order' => 9,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.9],
                    'alert_threshold' => ['type' => 'number', 'min' => 1, 'max' => 10, 'default' => 1],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.9,
                    'alert_threshold' => 1,
                ],
            ],
        ];

        foreach ($modules as $module) {
            AiModule::updateOrCreate(
                ['module_key' => $module['module_key']],
                $module
            );
        }
    }
}

