<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Event;
use App\Models\EdgeServer;
use App\Models\Organization;
use App\Services\SubscriptionService;
use App\Services\EnterpriseMonitoringService;
use App\Services\FcmService;
use Illuminate\Support\Facades\Log;

class EventController extends Controller
{
    protected SubscriptionService $subscriptionService;
    protected EnterpriseMonitoringService $enterpriseMonitoringService;

    public function __construct(
        SubscriptionService $subscriptionService,
        EnterpriseMonitoringService $enterpriseMonitoringService
    ) {
        $this->subscriptionService = $subscriptionService;
        $this->enterpriseMonitoringService = $enterpriseMonitoringService;
    }

    public function ingest(Request $request): JsonResponse
    {
        // Edge server is attached by VerifyEdgeSignature middleware
        $edge = $request->get('edge_server');
        
        if (!$edge) {
            return response()->json(['message' => 'Edge server not authenticated'], 401);
        }

        $request->validate([
            'event_type' => 'required|string',
            'severity' => 'required|string|in:info,warning,critical',
            'occurred_at' => 'required|date',
            'camera_id' => 'nullable|string',
            'meta' => 'array'
        ]);

        // Check if module is enabled (for module-specific events like Market)
        $meta = $request->input('meta', []);
        if (isset($meta['module'])) {
            $organization = $edge->organization;
            if ($organization && !$this->subscriptionService->isModuleEnabled($organization, $meta['module'])) {
                // Silently reject events for disabled modules
                return response()->json([
                    'ok' => false,
                    'message' => 'Module not enabled',
                    'error' => 'module_disabled'
                ], 403);
            }
        }

        // Extract ai_module and risk_score from meta for analytics
        $meta = $request->input('meta', []);
        $aiModule = $meta['module'] ?? null;
        $riskScore = isset($meta['risk_score']) ? (int) $meta['risk_score'] : null;
        
        // Check if this is an enterprise monitoring event (market/factory modules)
        $isEnterpriseEvent = in_array($aiModule, ['market', 'factory']) && 
                             isset($meta['scenario']) && 
                             isset($meta['risk_signals']);

        if ($isEnterpriseEvent) {
            // Use Enterprise Monitoring Service for evaluation
            $eventData = [
                'module' => $aiModule,
                'scenario' => $meta['scenario'],
                'camera_id' => $request->input('camera_id'),
                'risk_signals' => $meta['risk_signals'] ?? [],
                'confidence' => $meta['confidence'] ?? 0.0,
                'timestamp' => $request->occurred_at,
            ];

            $alertData = $this->enterpriseMonitoringService->evaluateEvent(
                $eventData,
                $edge->organization_id,
                $edge->id
            );

            if ($alertData) {
                // Send notifications based on alert policy
                $this->sendEnterpriseNotifications($alertData, $edge->organization_id);
            }

            return response()->json([
                'ok' => true,
                'evaluated' => true,
                'alert_generated' => $alertData !== null,
                'event_id' => $alertData['event_id'] ?? null,
            ]);
        }

        // Standard event creation (non-enterprise monitoring)
        $event = Event::create([
            'organization_id' => $edge->organization_id,
            'edge_server_id' => $edge->id,
            'edge_id' => $edge->edge_id,
            'event_type' => $request->event_type,
            'ai_module' => $aiModule, // Store in dedicated column for analytics
            'severity' => $request->severity,
            'risk_score' => $riskScore, // Store in dedicated column for analytics
            'occurred_at' => $request->occurred_at,
            'camera_id' => $request->input('camera_id'),
            'meta' => [
                ...$meta,
                'camera_id' => $request->input('camera_id'),
            ],
        ]);

        return response()->json(['ok' => true, 'event_id' => $event->id]);
    }

    /**
     * Send notifications for enterprise monitoring alerts
     */
    private function sendEnterpriseNotifications(array $alertData, int $organizationId): void
    {
        $alertPolicy = $alertData['alert_policy'];

        try {
            // Web notifications (always via Event creation, handled by existing system)
            if ($alertPolicy['notify_web']) {
                // Event already created, web notifications will be handled by existing notification system
            }

            // Mobile notifications (FCM)
            if ($alertPolicy['notify_mobile']) {
                $this->sendMobileNotification($alertData, $organizationId);
            }

            // Email notifications (if service exists)
            if ($alertPolicy['notify_email']) {
                // TODO: Implement email notification service
                Log::info('Email notification requested', ['alert_data' => $alertData]);
            }

            // SMS notifications (if service exists)
            if ($alertPolicy['notify_sms']) {
                // TODO: Implement SMS notification service
                Log::info('SMS notification requested', ['alert_data' => $alertData]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send enterprise monitoring notifications', [
                'error' => $e->getMessage(),
                'alert_data' => $alertData,
            ]);
        }
    }

    /**
     * Send mobile notification via FCM
     */
    private function sendMobileNotification(array $alertData, int $organizationId): void
    {
        try {
            $fcmService = app(FcmService::class);
            
            $title = $alertData['scenario_name'] ?? 'Enterprise Monitoring Alert';
            $body = sprintf(
                'Risk Level: %s | Score: %d/100',
                strtoupper($alertData['risk_level']),
                $alertData['risk_score']
            );

            $fcmService->sendToOrganization(
                $organizationId,
                $title,
                $body,
                [
                    'type' => 'enterprise_alert',
                    'event_id' => $alertData['event_id'],
                    'scenario_id' => $alertData['scenario_id'],
                    'risk_level' => $alertData['risk_level'],
                    'risk_score' => $alertData['risk_score'],
                    'camera_id' => $alertData['camera_id'],
                ],
                'high' // Priority
            );
        } catch (\Exception $e) {
            Log::error('Failed to send FCM notification', [
                'error' => $e->getMessage(),
                'alert_data' => $alertData,
            ]);
        }
    }
    }
}
