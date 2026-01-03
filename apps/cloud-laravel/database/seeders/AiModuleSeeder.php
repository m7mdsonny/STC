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
                'name' => 'fire_detection', // This will be used as the unique identifier
                'display_name' => 'Fire & Smoke Detection',
                'description' => 'Detect fire and smoke in real-time using advanced AI algorithms',
                'is_active' => true,
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
                'name' => 'intrusion_detection',
                'display_name' => 'Intrusion Detection',
                'description' => 'Detect unauthorized access and intrusions in restricted areas',
                'is_active' => true,
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
                'name' => 'face_recognition',
                'display_name' => 'Face Recognition',
                'description' => 'Identify and track individuals using facial recognition technology',
                'is_active' => true,
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
                'name' => 'license_plate_recognition',
                'display_name' => 'Vehicle Recognition (ANPR)',
                'description' => 'Automatic Number Plate Recognition for vehicle tracking',
                'is_active' => true,
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
                'name' => 'crowd_counting',
                'display_name' => 'Crowd Detection',
                'description' => 'Monitor and analyze crowd density and movement patterns',
                'is_active' => true,
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
                'name' => 'ppe_detection',
                'display_name' => 'PPE Detection',
                'description' => 'Ensure safety equipment compliance (helmets, vests, etc.)',
                'is_active' => true,
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
                'name' => 'production_monitoring',
                'display_name' => 'Production Monitoring',
                'description' => 'Monitor production lines and detect anomalies',
                'is_active' => true,
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
                'name' => 'warehouse_monitoring',
                'display_name' => 'Warehouse Monitoring',
                'description' => 'Monitor warehouse operations and detect unauthorized access',
                'is_active' => true,
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
                'name' => 'drowning_detection',
                'display_name' => 'Drowning Detection',
                'description' => 'Detect drowning incidents in pools and water areas',
                'is_active' => true,
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
            // Use 'name' instead of 'module_key' as the unique identifier
            // The table uses 'name' as UNIQUE column, not 'module_key'
            $moduleData = $module;
            $moduleKey = $moduleData['module_key'];
            unset($moduleData['module_key']); // Remove module_key from data
            
            // Map module_key to name (use module_key as name)
            $moduleData['name'] = $moduleKey;
            
            // Set display_name if not provided
            if (!isset($moduleData['display_name'])) {
                $moduleData['display_name'] = $moduleData['name'];
            }
            
            // Map is_enabled to is_active (table uses is_active)
            if (isset($moduleData['is_enabled'])) {
                $moduleData['is_active'] = $moduleData['is_enabled'];
                unset($moduleData['is_enabled']);
            }
            
            AiModule::updateOrCreate(
                ['name' => $moduleKey], // Use 'name' as unique identifier
                $moduleData
            );
        }
    }
}

