<?php

namespace App\Jobs;

use App\Models\Camera;
use App\Models\DeviceToken;
use App\Services\FcmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendCameraOfflineNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $camera;

    public function __construct(Camera $camera)
    {
        $this->camera = $camera;
    }

    public function handle()
    {
        try {
            $organizationId = $this->camera->organization_id;
            
            // Get all active device tokens for users in this organization
            $deviceTokens = DeviceToken::whereHas('user', function ($query) use ($organizationId) {
                $query->where('organization_id', $organizationId);
            })
            ->where('is_active', true)
            ->pluck('token')
            ->toArray();

            if (empty($deviceTokens)) {
                Log::info("No device tokens found for organization {$organizationId}");
                return;
            }

            $fcmService = app(FcmService::class);
            
            $notification = [
                'title' => 'كاميرا غير متصلة',
                'body' => "الكاميرا '{$this->camera->name}' أصبحت غير متصلة",
                'sound' => 'alert_high',
            ];

            $data = [
                'type' => 'camera_offline',
                'camera_id' => (string) $this->camera->id,
                'camera_name' => $this->camera->name,
                'level' => 'high',
                'timestamp' => now()->toIso8601String(),
            ];

            $fcmService->sendToMultipleDevices($deviceTokens, $notification, $data);
            
            Log::info("Camera offline notification sent for camera {$this->camera->id} to " . count($deviceTokens) . " devices");
        } catch (\Exception $e) {
            Log::error("Failed to send camera offline notification: {$e->getMessage()}");
        }
    }
}

