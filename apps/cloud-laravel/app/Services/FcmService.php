<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    protected $serverKey;
    protected $projectId;

    public function __construct()
    {
        $settings = SystemSetting::first();
        $fcmSettings = $settings?->fcm_settings ?? [];
        
        $this->serverKey = $fcmSettings['server_key'] ?? null;
        $this->projectId = $fcmSettings['project_id'] ?? null;
    }

    public function sendToDevice(string $deviceToken, array $notification, array $data = []): bool
    {
        return $this->sendToMultipleDevices([$deviceToken], $notification, $data);
    }

    public function sendToMultipleDevices(array $deviceTokens, array $notification, array $data = []): bool
    {
        if (empty($this->serverKey)) {
            Log::warning('FCM server key not configured');
            return false;
        }

        if (empty($deviceTokens)) {
            return false;
        }

        try {
            // Use legacy FCM API for simplicity
            $url = 'https://fcm.googleapis.com/fcm/send';
            
            $payload = [
                'registration_ids' => $deviceTokens,
                'notification' => $notification,
                'data' => $data,
                'priority' => 'high',
            ];

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            if ($response->successful()) {
                Log::info('FCM notification sent successfully', [
                    'devices' => count($deviceTokens),
                    'response' => $response->json(),
                ]);
                return true;
            } else {
                Log::error('FCM notification failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('FCM notification exception: ' . $e->getMessage());
            return false;
        }
    }

    public function sendToTopic(string $topic, array $notification, array $data = []): bool
    {
        if (empty($this->serverKey)) {
            Log::warning('FCM server key not configured');
            return false;
        }

        try {
            $url = 'https://fcm.googleapis.com/fcm/send';
            
            $payload = [
                'to' => '/topics/' . $topic,
                'notification' => $notification,
                'data' => $data,
                'priority' => 'high',
            ];

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($url, $payload);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('FCM topic notification exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send notification to all users in an organization
     * 
     * @param int $organizationId
     * @param string $title
     * @param string $body
     * @param array $data
     * @param string $priority
     * @return bool
     */
    public function sendToOrganization(int $organizationId, string $title, string $body, array $data = [], string $priority = 'high'): bool
    {
        // Get all active device tokens for users in this organization
        $deviceTokens = \App\Models\DeviceToken::whereHas('user', function ($query) use ($organizationId) {
            $query->where('organization_id', $organizationId)
                  ->where('is_active', true);
        })
        ->where('is_active', true)
        ->pluck('token')
        ->toArray();

        if (empty($deviceTokens)) {
            Log::info('No active device tokens found for organization', ['organization_id' => $organizationId]);
            return false;
        }

        $notification = [
            'title' => $title,
            'body' => $body,
            'sound' => 'default',
        ];

        // Add priority to data
        $data['priority'] = $priority;

        return $this->sendToMultipleDevices($deviceTokens, $notification, $data);
    }

    /**
     * Send notification to a specific user
     * 
     * @param int $userId
     * @param string $title
     * @param string $body
     * @param array $data
     * @return bool
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): bool
    {
        $deviceTokens = \App\Models\DeviceToken::where('user_id', $userId)
            ->where('is_active', true)
            ->pluck('token')
            ->toArray();

        if (empty($deviceTokens)) {
            Log::info('No active device tokens found for user', ['user_id' => $userId]);
            return false;
        }

        $notification = [
            'title' => $title,
            'body' => $body,
            'sound' => 'default',
        ];

        return $this->sendToMultipleDevices($deviceTokens, $notification, $data);
    }
}



