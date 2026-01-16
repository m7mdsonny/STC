<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\DeviceToken;
use App\Models\NotificationPriority;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationSettingsService
{
    public function __construct(
        private DomainActionService $domainActionService,
    ) {
    }

    /**
     * Register a device token
     */
    public function registerDevice(array $data, User $actor): DeviceToken
    {
        return $this->domainActionService->execute(request(), function () use ($data, $actor) {
            return DeviceToken::updateOrCreate(
                [
                    'token' => $data['device_token'],
                    'user_id' => $actor->id,
                ],
                [
                    'device_type' => $data['platform'],
                    'device_id' => $data['device_id'] ?? null,
                    'device_name' => $data['device_name'] ?? null,
                    'app_version' => $data['app_version'] ?? null,
                    'is_active' => true,
                    'last_used_at' => now(),
                ]
            );
        });
    }

    /**
     * Unregister a device token
     */
    public function unregisterDevice(string $token, User $actor): void
    {
        $this->domainActionService->execute(request(), function () use ($token, $actor) {
            DeviceToken::where('token', $token)
                ->where('user_id', $actor->id)
                ->update(['is_active' => false]);
        });
    }

    /**
     * Update organization notification config
     */
    public function updateOrgConfig(array $config, User $actor): array
    {
        if (!$actor->organization_id) {
            throw new DomainActionException('Organization ID is required', 422);
        }

        // Authorization: Only org admin or super admin can update org config
        $isSuperAdmin = RoleHelper::isSuperAdmin($actor->role ?? '', $actor->is_super_admin ?? false);
        $isOrgAdmin = in_array($actor->role ?? '', ['admin', 'owner', 'organization_admin', 'org_admin']);
        
        if (!$isSuperAdmin && !$isOrgAdmin) {
            throw new DomainActionException('Unauthorized: Only organization administrators can update notification config', 403);
        }

        return $this->domainActionService->execute(request(), function () use ($config, $actor) {
            $fullConfig = [
                'push_enabled' => $config['push_enabled'] ?? true,
                'sms_enabled' => $config['sms_enabled'] ?? false,
                'email_enabled' => $config['email_enabled'] ?? true,
                'whatsapp_enabled' => $config['whatsapp_enabled'] ?? false,
                'default_channels' => $config['default_channels'] ?? ['push', 'email'],
                'cooldown_minutes' => $config['cooldown_minutes'] ?? 5,
                'updated_at' => now()->toIso8601String(),
                'updated_by' => $actor->id,
            ];

            DB::table('organizations')
                ->where('id', $actor->organization_id)
                ->update([
                    'notification_config' => json_encode($fullConfig),
                    'updated_at' => now(),
                ]);

            return $fullConfig;
        });
    }

    /**
     * Create alert priority
     */
    public function createAlertPriority(array $data, User $actor): NotificationPriority
    {
        return $this->domainActionService->execute(request(), function () use ($data, $actor) {
            return NotificationPriority::create([
                'organization_id' => $actor->organization_id,
                'notification_type' => "{$data['module']}.{$data['alert_type']}",
                'priority' => $data['severity'],
                'is_critical' => $data['severity'] === 'critical',
            ]);
        });
    }

    /**
     * Update alert priority
     */
    public function updateAlertPriority(NotificationPriority $priority, array $data, User $actor): NotificationPriority
    {
        return $this->domainActionService->execute(request(), function () use ($priority, $data) {
            if (isset($data['severity'])) {
                $priority->update([
                    'priority' => $data['severity'],
                    'is_critical' => $data['severity'] === 'critical',
                ]);
            }
            return $priority->fresh();
        });
    }

    /**
     * Delete alert priority
     */
    public function deleteAlertPriority(NotificationPriority $priority, User $actor): void
    {
        $this->domainActionService->execute(request(), function () use ($priority) {
            $priority->delete();
        });
    }
}
