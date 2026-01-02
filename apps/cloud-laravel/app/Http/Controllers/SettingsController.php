<?php

namespace App\Http\Controllers;

use App\Models\PlatformContent;
use App\Models\Reseller;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;

class SettingsController extends Controller
{
    public function getLanding(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        
        try {
            // Check if table exists
            if (!Schema::hasTable('platform_contents')) {
                \Log::warning('platform_contents table does not exist');
                return response()->json([
                    'content' => $this->landingDefaults(),
                    'published' => false,
                ]);
            }
            
            // Check if deleted_at column exists (for SoftDeletes)
            $hasDeletedAt = Schema::hasColumn('platform_contents', 'deleted_at');
            
            $content = null;
            if ($hasDeletedAt) {
                // Use normal query if SoftDeletes is supported
                $content = PlatformContent::firstOrCreate(
                    ['key' => 'landing_settings'],
                    [
                        'value' => json_encode([]),
                        'section' => 'landing',
                        'published' => false,
                    ]
                );
            } else {
                // Fallback: use raw query without SoftDeletes
                $content = PlatformContent::where('key', 'landing_settings')->first();
                if (!$content) {
                    $content = PlatformContent::create([
                        'key' => 'landing_settings',
                        'value' => json_encode([]),
                        'section' => 'landing',
                        'published' => false,
                    ]);
                }
            }

            return response()->json([
                'content' => $this->mergeLandingDefaults($content->value),
                'published' => (bool) ($content->published ?? false),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Error fetching landing settings: ' . $e->getMessage());
            // Return defaults instead of crashing
            return response()->json([
                'content' => $this->landingDefaults(),
                'published' => false,
            ]);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in getLanding: ' . $e->getMessage());
            return response()->json([
                'content' => $this->landingDefaults(),
                'published' => false,
            ]);
        }
    }

    public function updateLanding(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        try {
            // Check if table exists
            if (!Schema::hasTable('platform_contents')) {
                \Log::error('platform_contents table does not exist - cannot save landing settings');
                return response()->json([
                    'message' => 'Database table not found. Please run migrations.',
                    'error' => 'platform_contents table missing'
                ], 500);
            }
            
            // Check if deleted_at column exists
            $hasDeletedAt = Schema::hasColumn('platform_contents', 'deleted_at');
            
            $content = null;
            if ($hasDeletedAt) {
                $content = PlatformContent::firstOrCreate(['key' => 'landing_settings']);
            } else {
                // Fallback: use raw query without SoftDeletes
                $content = PlatformContent::where('key', 'landing_settings')->first();
                if (!$content) {
                    $content = PlatformContent::create([
                        'key' => 'landing_settings',
                        'value' => json_encode([]),
                        'section' => 'landing',
                        'published' => false,
                    ]);
                }
            }
            
            $payload = $request->get('content', $request->all());
            $existing = json_decode($content->value ?? '[]', true) ?? [];
            $contentData = array_merge($existing, is_array($payload) ? $payload : []);

            $updateData = [
                'value' => json_encode($contentData),
                'published' => (bool) $request->get('published', $content->published ?? false),
                'section' => 'landing',
            ];
            
            // Only include published if column exists
            if (Schema::hasColumn('platform_contents', 'published')) {
                $updateData['published'] = (bool) $request->get('published', $content->published ?? false);
            }

            $content->update($updateData);
            
            // Refresh to get updated data
            $content->refresh();

            return response()->json([
                'content' => $this->mergeLandingDefaults($contentData),
                'published' => (bool) ($content->published ?? false),
                'message' => 'Landing settings saved successfully',
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Error saving landing settings: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to save landing settings',
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in updateLanding: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to save landing settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function mergeLandingDefaults($content): array
    {
        $data = is_string($content) ? json_decode($content, true) : (is_array($content) ? $content : []);
        return array_merge($this->landingDefaults(), $data ?? []);
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

    public function getSystem(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $settings = SystemSetting::first() ?? SystemSetting::create();
        return response()->json($settings);
    }

    public function updateSystem(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $settings = SystemSetting::first() ?? new SystemSetting();
        $data = $request->only([
            'platform_name',
            'platform_tagline',
            'support_email',
            'support_phone',
            'default_timezone',
            'default_language',
            'maintenance_mode',
            'allow_registration',
            'require_email_verification',
            'session_timeout_minutes',
            'max_login_attempts',
        ]);
        $settings->fill($data);
        $settings->save();

        return response()->json($settings);
    }

    public function getSms(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $settings = SystemSetting::first();
        return response()->json($settings?->sms_settings ?? []);
    }

    public function updateSms(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $settings = SystemSetting::first() ?? new SystemSetting();
        $settings->sms_settings = $request->all();
        $settings->save();

        return response()->json($settings->sms_settings);
    }

    public function testSms(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $settings = SystemSetting::first();
        if (!$settings || empty($settings->sms_settings)) {
            return response()->json(['success' => false, 'message' => 'SMS settings not configured'], 422);
        }

        return response()->json(['success' => true, 'message' => 'SMS configuration saved']);
    }

    public function getPlans(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        return response()->json(SubscriptionPlan::orderBy('price_monthly')->get());
    }

    public function updatePlan(Request $request, SubscriptionPlan $plan): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $plan->update($request->only([
            'name', 'name_ar', 'max_cameras', 'max_edge_servers', 'available_modules', 'notification_channels', 'price_monthly', 'price_yearly', 'is_active'
        ]));

        return response()->json($plan);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $request->validate(['logo' => 'required|file|mimes:png,jpg,jpeg,svg']);
        $path = $request->file('logo')->store('public/logos');

        return response()->json(['url' => Storage::url($path)]);
    }

    public function resellers(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        return response()->json(Reseller::orderBy('name')->get());
    }

    public function storeReseller(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $reseller = Reseller::create($request->all());
        return response()->json($reseller, 201);
    }

    public function updateReseller(Request $request, Reseller $reseller): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $reseller->update($request->all());
        return response()->json($reseller);
    }

    public function deleteReseller(Reseller $reseller): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $reseller->delete();
        return response()->json(['message' => 'Reseller deleted']);
    }
}
