<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AiModule;

class AiModuleSeeder extends Seeder
{
    public function run(): void
    {
        // Modules matching the database schema
        // Table uses: name (UNIQUE), display_name, display_name_ar, description, description_ar, is_active
        $modules = [
            [
                'name' => 'fire_detection',
                'display_name' => 'Fire Detection',
                'display_name_ar' => 'كشف الحرائق',
                'description' => 'Detect fire and smoke in real-time using advanced AI algorithms',
                'description_ar' => 'كشف الحرائق والدخان في الوقت الفعلي باستخدام خوارزميات الذكاء الاصطناعي المتقدمة',
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
                'name' => 'intrusion_detection',
                'display_name' => 'Intrusion Detection',
                'display_name_ar' => 'كشف التسلل',
                'description' => 'Detect unauthorized access and intrusions in restricted areas',
                'description_ar' => 'كشف الوصول غير المصرح به والتسلل في المناطق المحظورة',
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
                'name' => 'face_recognition',
                'display_name' => 'Face Recognition',
                'display_name_ar' => 'التعرف على الوجوه',
                'description' => 'Identify and track individuals using facial recognition technology',
                'description_ar' => 'تحديد وتتبع الأفراد باستخدام تقنية التعرف على الوجوه',
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
                'name' => 'license_plate_recognition',
                'display_name' => 'License Plate Recognition',
                'display_name_ar' => 'قراءة لوحات الأرقام',
                'description' => 'Automatic Number Plate Recognition for vehicle tracking',
                'description_ar' => 'قراءة لوحات الأرقام تلقائياً لتتبع المركبات',
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
                'name' => 'crowd_counting',
                'display_name' => 'Crowd Counting',
                'display_name_ar' => 'عد الحشود',
                'description' => 'Monitor and analyze crowd density and movement patterns',
                'description_ar' => 'مراقبة وتحليل كثافة الحشود وأنماط الحركة',
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
                'name' => 'face_detection',
                'display_name' => 'Face Detection',
                'display_name_ar' => 'كشف الوجوه',
                'description' => 'Detect and identify faces in video',
                'description_ar' => 'كشف وتحديد الوجوه في الفيديو',
                'is_active' => true,
                'icon' => 'user',
                'min_fps' => 25,
                'min_resolution' => '1080p',
                'display_order' => 6,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.8],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.8,
                ],
            ],
            [
                'name' => 'object_detection',
                'display_name' => 'Object Detection',
                'display_name_ar' => 'كشف الأشياء',
                'description' => 'Detect and identify objects in video',
                'description_ar' => 'كشف وتحديد الأشياء في الفيديو',
                'is_active' => true,
                'icon' => 'box',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 7,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.75],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.75,
                ],
            ],
            [
                'name' => 'vehicle_detection',
                'display_name' => 'Vehicle Detection',
                'display_name_ar' => 'كشف المركبات',
                'description' => 'Detect and identify vehicles',
                'description_ar' => 'كشف وتحديد المركبات',
                'is_active' => true,
                'icon' => 'truck',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 8,
                'config_schema' => [
                    'confidence_threshold' => ['type' => 'number', 'min' => 0.5, 'max' => 1.0, 'default' => 0.8],
                ],
                'default_config' => [
                    'confidence_threshold' => 0.8,
                ],
            ],
            [
                'name' => 'loitering_detection',
                'display_name' => 'Loitering Detection',
                'display_name_ar' => 'كشف التكاسل',
                'description' => 'Detect loitering persons',
                'description_ar' => 'كشف الأشخاص المتكاسلين',
                'is_active' => true,
                'icon' => 'clock',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 9,
                'config_schema' => [
                    'time_threshold' => ['type' => 'number', 'min' => 10, 'max' => 300, 'default' => 60],
                ],
                'default_config' => [
                    'time_threshold' => 60,
                ],
            ],
            [
                'name' => 'abandoned_object',
                'display_name' => 'Abandoned Object',
                'display_name_ar' => 'الأشياء المتروكة',
                'description' => 'Detect abandoned objects',
                'description_ar' => 'كشف الأشياء المتروكة',
                'is_active' => true,
                'icon' => 'package-x',
                'min_fps' => 15,
                'min_resolution' => '720p',
                'display_order' => 10,
                'config_schema' => [
                    'time_threshold' => ['type' => 'number', 'min' => 30, 'max' => 600, 'default' => 120],
                ],
                'default_config' => [
                    'time_threshold' => 120,
                ],
            ],
        ];

        foreach ($modules as $module) {
            // Use 'name' as the unique identifier (matches database schema)
            AiModule::updateOrCreate(
                ['name' => $module['name']],
                $module
            );
        }
    }
}
