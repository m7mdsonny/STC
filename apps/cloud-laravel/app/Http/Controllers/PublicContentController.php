<?php

namespace App\Http\Controllers;

use App\Models\ContactInquiry;
use App\Models\PlatformContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class PublicContentController extends Controller
{
    public function landing(): JsonResponse
    {
        try {
            // Check if 'key' column exists
            if (!Schema::hasColumn('platform_contents', 'key')) {
                // If key column doesn't exist, return defaults
                \Log::warning('platform_contents table missing key column');
                return response()->json([
                    'content' => $this->landingDefaults(),
                    'published' => false,
                ]);
            }

            // Try to get published content first
            $content = PlatformContent::where('key', 'landing_settings')
                ->when(
                    Schema::hasColumn('platform_contents', 'published'),
                    fn($query) => $query->where('published', true),
                    fn($query) => $query
                )
                ->first();
            
            // If no published content, try to get any content
            if (!$content) {
                $content = PlatformContent::where('key', 'landing_settings')->first();
            }
            
            $data = $content && $content->value 
                ? json_decode($content->value, true) 
                : [];
            
            // Ensure data is an array
            if (!is_array($data)) {
                $data = [];
            }
            
            $published = false;
            if ($content) {
                // Check if published column exists and get its value
                if (Schema::hasColumn('platform_contents', 'published')) {
                    $published = (bool) ($content->published ?? false);
                } else {
                    // If published column doesn't exist, consider it published if content exists
                    $published = true;
                }
            }
            
            return response()->json([
                'content' => array_merge($this->landingDefaults(), $data),
                'published' => $published,
            ]);
        } catch (\Exception $e) {
            // If database query fails, return defaults
            \Log::error('PublicContentController::landing error: ' . $e->getMessage());
            
            return response()->json([
                'content' => $this->landingDefaults(),
                'published' => false,
            ]);
        }
    }

    private function landingDefaults(): array
    {
        return [
            'hero_title' => 'منصة تحليل الفيديو بالذكاء الاصطناعي',
            'hero_subtitle' => 'حول كاميرات المراقبة الى عيون ذكية تحمي منشاتك وتحلل بياناتك في الوقت الفعلي',
            'hero_button_text' => 'ابدا تجربتك المجانية - 14 يوم',
            'about_title' => 'عن المنصة',
            'about_description' => 'حل متكامل لادارة المراقبة بالفيديو والذكاء الاصطناعي مع تكاملات جاهزة.',
            'contact_email' => 'info@stc-solutions.com',
            'contact_phone' => '+966 11 000 0000',
            'contact_address' => 'الرياض، المملكة العربية السعودية',
            'whatsapp_number' => '+966500000000',
            'show_whatsapp_button' => true,
            'footer_text' => 'STC Solutions. جميع الحقوق محفوظة',
            'social_twitter' => null,
            'social_linkedin' => null,
            'social_instagram' => null,
            'features' => [],
            'stats' => [],
        ];
    }

    /**
     * Submit contact form from landing page
     */
    public function submitContact(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $inquiry = ContactInquiry::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'message' => $request->input('message'),
                'source' => 'landing_page',
                'status' => 'new',
            ]);

            // Optionally send email notification here
            // Mail::to(config('mail.support_email'))->send(new ContactInquiryNotification($inquiry));

            return response()->json([
                'message' => 'تم إرسال رسالتك بنجاح. سنتواصل معك في أقرب وقت.',
                'success' => true,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('PublicContentController::submitContact error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.',
                'success' => false,
            ], 500);
        }
    }
}
