<?php

namespace Database\Seeders;

use App\Models\PlatformContent;
use Illuminate\Database\Seeder;

class LandingContentSeeder extends Seeder
{
    public function run(): void
    {
        // Create or update landing settings
        $content = PlatformContent::updateOrCreate(
            ['key' => 'landing_settings'],
            [
                'value' => json_encode([
                    'hero_title' => 'منصة تحليل الفيديو بالذكاء الاصطناعي',
                    'hero_subtitle' => 'حول كاميرات المراقبة الى عيون ذكية تحمي منشاتك وتحلل بياناتك في الوقت الفعلي',
                    'hero_button_text' => 'ابدا تجربتك المجانية - 14 يوم',
                    'about_title' => 'عن المنصة',
                    'about_description' => 'حل متكامل لادارة المراقبة بالفيديو والذكاء الاصطناعي مع تكاملات جاهزة.',
                    'contact_email' => 'info@stc-solutions.com',
                    'contact_phone' => '+20 2 0000 0000',
                    'contact_address' => 'القاهرة، جمهورية مصر العربية',
                    'whatsapp_number' => '+201000000000',
                    'show_whatsapp_button' => true,
                    'footer_text' => 'STC Solutions. جميع الحقوق محفوظة',
                ]),
                'section' => 'landing',
            ]
        );

        // Add published column if migration hasn't run yet
        if (\Schema::hasColumn('platform_contents', 'published')) {
            $content->published = true;
            $content->save();
        }

        $this->command->info('Landing content seeded successfully!');
    }
}


