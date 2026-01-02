<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Services\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SystemSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $this->ensureSuperAdmin(request());

        $settings = SystemSetting::first();
        if (!$settings) {
            $settings = SystemSetting::create();
        }

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $settings = SystemSetting::first() ?? new SystemSetting();

        $data = $request->validate([
            'platform_name' => 'nullable|string|max:255',
            'platform_tagline' => 'nullable|string|max:500',
            'support_email' => 'nullable|email',
            'support_phone' => 'nullable|string|max:50',
            'default_timezone' => 'nullable|string|max:100',
            'default_language' => 'nullable|string|max:10',
            'maintenance_mode' => 'nullable|boolean',
            'maintenance_message' => 'nullable|string',
            'session_timeout_minutes' => 'nullable|integer|min:5',
            'max_login_attempts' => 'nullable|integer|min:1',
            'password_min_length' => 'nullable|integer|min:6',
            'require_2fa' => 'nullable|boolean',
            'allow_registration' => 'nullable|boolean',
            'require_email_verification' => 'nullable|boolean',
            'email_settings' => 'nullable|array',
            'sms_settings' => 'nullable|array',
            'fcm_settings' => 'nullable|array',
            'storage_settings' => 'nullable|array',
        ]);

        $settings->fill($data);
        $settings->save();

        return response()->json($settings);
    }

    public function testEmail(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $request->validate([
            'to' => 'required|email',
            'message' => 'nullable|string',
        ]);

        try {
            Mail::raw($data['message'] ?? 'Test email from STC AI-VAP', function ($mail) use ($data) {
                $mail->to($data['to'])->subject('AI-VAP SMTP Test');
            });

            return response()->json(['success' => true, 'message' => 'Email dispatched using configured mail driver']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function testSms(): JsonResponse
    {
        $this->ensureSuperAdmin(request());

        $settings = SystemSetting::first();
        $configured = $settings && $settings->sms_settings;

        if (!$configured) {
            return response()->json(['success' => false, 'message' => 'SMS provider not configured'], 422);
        }

        return response()->json(['success' => true, 'message' => 'SMS provider configuration saved']);
    }

    public function clearCache(): JsonResponse
    {
        $this->ensureSuperAdmin(request());

        try {
            \Artisan::call('config:clear');
            \Artisan::call('cache:clear');
            \Artisan::call('route:clear');
            \Artisan::call('view:clear');

            return response()->json(['success' => true, 'message' => 'Cache cleared successfully']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function testFcm(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $settings = SystemSetting::first();
        $fcmSettings = $settings?->fcm_settings ?? [];

        if (empty($fcmSettings['server_key'] ?? null)) {
            return response()->json(['success' => false, 'message' => 'FCM server key is missing'], 422);
        }

        $testToken = $request->get('test_token'); // Optional: specific device token to test

        try {
            $fcmService = app(FcmService::class);
            
            $notification = [
                'title' => 'STC AI-VAP Test Notification',
                'body' => 'This is a test push notification from the platform. FCM is configured correctly!',
                'sound' => 'default',
            ];

            $data = [
                'type' => 'test',
                'level' => 'medium',
                'timestamp' => now()->toIso8601String(),
            ];

            if ($testToken) {
                $success = $fcmService->sendToDevice($testToken, $notification, $data);
            } else {
                // Send to test topic
                $success = $fcmService->sendToTopic('test', $notification, $data);
            }

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Test notification sent successfully',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send test notification',
                ], 500);
            }
        } catch (\Throwable $e) {
            \Log::error('FCM test exception', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error sending test notification: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function check(): JsonResponse
    {
        $isSuperAdmin = request()->user()?->role === 'super_admin';
        return response()->json(['is_super_admin' => $isSuperAdmin]);
    }
}
