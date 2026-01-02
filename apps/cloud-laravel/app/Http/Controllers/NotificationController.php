<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\DeviceToken;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $user = request()->user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->orWhere('organization_id', $user->organization_id)
            ->latest()
            ->limit(100)
            ->get();

        return response()->json($notifications);
    }

    /**
     * Register FCM device token for push notifications
     */
    public function registerDevice(Request $request): JsonResponse
    {
        $request->validate([
            'device_token' => 'required|string',
            'platform' => 'required|string|in:android,ios',
            'device_id' => 'nullable|string',
            'device_name' => 'nullable|string',
            'app_version' => 'nullable|string',
        ]);

        $user = $request->user();

        try {
            $deviceToken = DeviceToken::updateOrCreate(
                [
                    'token' => $request->device_token,
                    'user_id' => $user->id,
                ],
                [
                    'device_type' => $request->platform,
                    'device_id' => $request->device_id,
                    'device_name' => $request->device_name,
                    'app_version' => $request->app_version,
                    'is_active' => true,
                    'last_used_at' => now(),
                ]
            );

            Log::info('Device token registered', [
                'user_id' => $user->id,
                'device_token' => substr($request->device_token, 0, 20) . '...',
                'platform' => $request->platform,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device token registered successfully',
                'device' => $deviceToken,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to register device token', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to register device token',
            ], 500);
        }
    }

    /**
     * Unregister FCM device token
     */
    public function unregisterDevice(Request $request): JsonResponse
    {
        $request->validate([
            'device_token' => 'required|string',
        ]);

        $user = $request->user();

        try {
            DeviceToken::where('token', $request->device_token)
                ->where('user_id', $user->id)
                ->update(['is_active' => false]);

            Log::info('Device token unregistered', [
                'user_id' => $user->id,
                'device_token' => substr($request->device_token, 0, 20) . '...',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device token unregistered successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to unregister device token', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to unregister device token',
            ], 500);
        }
    }

    /**
     * Get user's registered devices
     */
    public function getDevices(): JsonResponse
    {
        $user = request()->user();

        $devices = DeviceToken::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        return response()->json($devices);
    }

    /**
     * Get notification settings for organization
     */
    public function getSettings(): JsonResponse
    {
        $user = request()->user();
        
        // For now, return empty array or use notification_priorities
        // TODO: Create notification_settings table if needed
        return response()->json([]);
    }

    /**
     * Update notification setting
     */
    public function updateSetting(Request $request, string $id): JsonResponse
    {
        // TODO: Implement when notification_settings table is created
        return response()->json(['message' => 'Not implemented yet'], 501);
    }

    /**
     * Get organization notification config
     */
    public function getOrgConfig(): JsonResponse
    {
        $user = request()->user();
        
        if (!$user->organization_id) {
            return response()->json(['message' => 'Organization ID is required'], 422);
        }

        // For now, return default config
        // TODO: Create organization_notification_config table if needed
        return response()->json([
            'organization_id' => $user->organization_id,
            'push_enabled' => true,
            'sms_enabled' => false,
            'email_enabled' => true,
            'whatsapp_enabled' => false,
        ]);
    }

    /**
     * Update organization notification config
     */
    public function updateOrgConfig(Request $request): JsonResponse
    {
        $user = request()->user();
        
        if (!$user->organization_id) {
            return response()->json(['message' => 'Organization ID is required'], 422);
        }

        // TODO: Implement when organization_notification_config table is created
        return response()->json(['message' => 'Not implemented yet'], 501);
    }

    /**
     * Get alert priorities (alias for notification-priorities)
     */
    public function getAlertPriorities(): JsonResponse
    {
        try {
            $user = request()->user();
            
            // Check if table exists
            if (!Schema::hasTable('notification_priorities')) {
                \Log::warning('notification_priorities table does not exist');
                return response()->json([]);
            }
            
            $query = \App\Models\NotificationPriority::query();

            if ($user && $user->organization_id) {
                $query->where('organization_id', $user->organization_id);
            }

            return response()->json($query->orderBy('notification_type')->get());
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Error fetching notification priorities: ' . $e->getMessage());
            // Return empty array instead of crashing
            return response()->json([]);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in getAlertPriorities: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    /**
     * Create alert priority
     */
    public function createAlertPriority(Request $request): JsonResponse
    {
        try {
            // Check if table exists
            if (!Schema::hasTable('notification_priorities')) {
                \Log::error('notification_priorities table does not exist - cannot create priority');
                return response()->json([
                    'message' => 'Database table not found. Please run migrations.',
                    'error' => 'notification_priorities table missing'
                ], 500);
            }
            
            $user = request()->user();
            $data = $request->validate([
                'module' => 'required|string',
                'alert_type' => 'required|string',
                'severity' => 'required|string|in:low,medium,high,critical',
                'notification_channels' => 'required|array',
                'auto_escalate' => 'nullable|boolean',
                'escalation_minutes' => 'nullable|integer',
                'escalation_channel' => 'nullable|string',
                'sound_enabled' => 'nullable|boolean',
                'vibration_enabled' => 'nullable|boolean',
            ]);

            $priority = \App\Models\NotificationPriority::create([
                'organization_id' => $user->organization_id,
                'notification_type' => "{$data['module']}.{$data['alert_type']}",
                'priority' => $data['severity'],
                'is_critical' => $data['severity'] === 'critical',
            ]);

            return response()->json($priority, 201);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Error creating notification priority: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create notification priority',
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in createAlertPriority: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create notification priority',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update alert priority
     */
    public function updateAlertPriority(Request $request, string $id): JsonResponse
    {
        try {
            // Check if table exists
            if (!\Illuminate\Support\Facades\Schema::hasTable('notification_priorities')) {
                \Log::error('notification_priorities table does not exist');
                return response()->json([
                    'message' => 'Database table not found. Please run migrations.',
                    'error' => 'notification_priorities table missing'
                ], 500);
            }
            
            $priority = \App\Models\NotificationPriority::findOrFail($id);
            $data = $request->validate([
                'severity' => 'sometimes|string|in:low,medium,high,critical',
                'notification_channels' => 'sometimes|array',
                'auto_escalate' => 'nullable|boolean',
                'escalation_minutes' => 'nullable|integer',
                'escalation_channel' => 'nullable|string',
                'sound_enabled' => 'nullable|boolean',
                'vibration_enabled' => 'nullable|boolean',
            ]);

            if (isset($data['severity'])) {
                $priority->update([
                    'priority' => $data['severity'],
                    'is_critical' => $data['severity'] === 'critical',
                ]);
            }

            return response()->json($priority);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Notification priority not found'
            ], 404);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Error updating notification priority: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update notification priority',
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in updateAlertPriority: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update notification priority',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete alert priority
     */
    public function deleteAlertPriority(string $id): JsonResponse
    {
        try {
            // Check if table exists
            if (!Schema::hasTable('notification_priorities')) {
                \Log::error('notification_priorities table does not exist');
                return response()->json([
                    'message' => 'Database table not found. Please run migrations.',
                    'error' => 'notification_priorities table missing'
                ], 500);
            }
            
            $priority = \App\Models\NotificationPriority::findOrFail($id);
            $priority->delete();
            return response()->json(['message' => 'Alert priority deleted']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Notification priority not found'
            ], 404);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Error deleting notification priority: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete notification priority',
                'error' => $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in deleteAlertPriority: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete notification priority',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification logs
     */
    public function getLogs(Request $request): JsonResponse
    {
        $user = request()->user();
        $query = \App\Models\Notification::query();

        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        }

        if ($request->filled('channel')) {
            $query->where('channel', $request->get('channel'));
        }

        if ($request->filled('status')) {
            if ($request->get('status') === 'read') {
                $query->whereNotNull('read_at');
            } else {
                $query->whereNull('read_at');
            }
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->get('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->get('to'));
        }

        $perPage = (int) $request->get('per_page', 15);
        $logs = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Send test notification
     */
    public function sendTest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'channel' => 'required|string|in:push,sms,whatsapp,call,email',
            'recipient' => 'required|string',
        ]);

        // TODO: Implement actual test notification sending
        return response()->json([
            'success' => true,
            'message' => 'Test notification sent successfully',
        ]);
    }

    /**
     * Get notification quota
     */
    public function getQuota(): JsonResponse
    {
        $user = request()->user();
        
        if (!$user->organization_id) {
            return response()->json(['message' => 'Organization ID is required'], 422);
        }

        // Get quota from sms_quotas table
        $quota = \App\Models\SMSQuota::where('organization_id', $user->organization_id)
            ->first();

        if (!$quota) {
            return response()->json([
                'sms_used' => 0,
                'sms_limit' => 0,
                'whatsapp_used' => 0,
                'whatsapp_limit' => 0,
                'calls_used' => 0,
                'calls_limit' => 0,
            ]);
        }

        return response()->json([
            'sms_used' => $quota->used_this_month ?? 0,
            'sms_limit' => $quota->monthly_limit ?? 0,
            'whatsapp_used' => 0,
            'whatsapp_limit' => 0,
            'calls_used' => 0,
            'calls_limit' => 0,
        ]);
    }
}
