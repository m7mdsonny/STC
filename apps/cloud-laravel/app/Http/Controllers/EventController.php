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

        // CRITICAL: Log event creation for debugging analytics
        if ($request->event_type === 'analytics') {
            Log::info('Analytics event created', [
                'event_id' => $event->id,
                'ai_module' => $aiModule,
                'ai_module_source' => 'meta.module',
                'meta_has_module' => isset($meta['module']),
                'meta_module_value' => $meta['module'] ?? null,
                'camera_id' => $request->input('camera_id'),
                'organization_id' => $edge->organization_id,
                'event_type' => $request->event_type,
            ]);
            
            // CRITICAL: Log warning if ai_module is null for analytics events
            if (!$aiModule) {
                Log::warning('Analytics event created without ai_module', [
                    'event_id' => $event->id,
                    'meta' => $meta,
                    'camera_id' => $request->input('camera_id'),
                    'organization_id' => $edge->organization_id,
                ]);
            }
        }

        // Send notifications for standard AI events based on severity
        // Critical and warning events should trigger mobile notifications
        if (in_array($request->severity, ['critical', 'warning'])) {
            $this->sendStandardEventNotification($event, $edge->organization_id, $aiModule);
        }

        return response()->json(['ok' => true, 'event_id' => $event->id]);
    }

    /**
     * Batch ingest multiple events in a single request
     * This reduces nonce collisions by using only one nonce for multiple events
     */
    public function batchIngest(Request $request): JsonResponse
    {
        try {
            // Edge server is attached by VerifyEdgeSignature middleware
            $edge = $request->get('edge_server');
            
            if (!$edge) {
                Log::error('Batch ingest: Edge server not authenticated', [
                    'headers' => $request->headers->all(),
                ]);
                return response()->json(['message' => 'Edge server not authenticated'], 401);
            }

            // Validate request with better error handling
            try {
                $request->validate([
                    'events' => 'required|array|min:1|max:100', // Limit to 100 events per batch
                    'events.*.event_type' => 'required|string',
                    'events.*.severity' => 'required|string|in:info,warning,critical',
                    'events.*.occurred_at' => 'required|date',
                    'events.*.camera_id' => 'nullable|string',
                    'events.*.meta' => 'nullable|array',
                ]);
            } catch (\Illuminate\Validation\ValidationException $e) {
                Log::error('Batch ingest validation failed', [
                    'errors' => $e->errors(),
                    'edge_id' => $edge->id ?? null,
                ]);
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }

            $events = $request->input('events', []);
            $created = [];
            $failed = [];

            foreach ($events as $eventData) {
                try {
                    // Extract ai_module from meta - ensure meta is always an array
                    $meta = is_array($eventData['meta'] ?? []) ? ($eventData['meta'] ?? []) : [];
                    $aiModule = $meta['module'] ?? null;
                    $riskScore = isset($meta['risk_score']) ? (int) $meta['risk_score'] : null;

                    // Check if module is enabled
                    if ($aiModule) {
                        try {
                            $organization = $edge->organization;
                            if ($organization && !$this->subscriptionService->isModuleEnabled($organization, $aiModule)) {
                                $failed[] = [
                                    'index' => count($created) + count($failed),
                                    'error' => 'module_disabled',
                                    'module' => $aiModule,
                                ];
                                continue;
                            }
                        } catch (\Exception $e) {
                            Log::warning('Error checking module enabled status', [
                                'error' => $e->getMessage(),
                                'ai_module' => $aiModule,
                                'edge_id' => $edge->id,
                            ]);
                            // Continue processing - don't fail entire batch
                        }
                    }

                // Check if this is an enterprise monitoring event
                $isEnterpriseEvent = in_array($aiModule, ['market', 'factory']) && 
                                     isset($meta['scenario']) && 
                                     isset($meta['risk_signals']);

                if ($isEnterpriseEvent) {
                    $eventDataForEval = [
                        'module' => $aiModule,
                        'scenario' => $meta['scenario'],
                        'camera_id' => $eventData['camera_id'] ?? null,
                        'risk_signals' => $meta['risk_signals'] ?? [],
                        'confidence' => $meta['confidence'] ?? 0.0,
                        'timestamp' => $eventData['occurred_at'],
                    ];

                    $alertData = $this->enterpriseMonitoringService->evaluateEvent(
                        $eventDataForEval,
                        $edge->organization_id,
                        $edge->id
                    );

                    if ($alertData) {
                        $this->sendEnterpriseNotifications($alertData, $edge->organization_id);
                    }
                } else {
                    // Standard event creation
                    // CRITICAL: Ensure all required fields are present and valid
                    try {
                        // Parse occurred_at to ensure it's a valid datetime
                        $occurredAt = $eventData['occurred_at'];
                        if (is_string($occurredAt)) {
                            try {
                                $occurredAt = \Carbon\Carbon::parse($occurredAt);
                            } catch (\Exception $e) {
                                Log::warning('Invalid occurred_at format', [
                                    'occurred_at' => $occurredAt,
                                    'error' => $e->getMessage(),
                                ]);
                                $occurredAt = now(); // Fallback to current time
                            }
                        }
                        
                        // CRITICAL: Ensure edge_id is always present (required by database)
                        $edgeId = $edge->edge_id ?? $edge->edge_key ?? (string) $edge->id;
                        if (empty($edgeId)) {
                            throw new \Exception('Edge ID is required but not available');
                        }
                        
                        // CRITICAL: Ensure organization_id is present
                        if (empty($edge->organization_id)) {
                            Log::error('Edge server missing organization_id', [
                                'edge_id' => $edge->id,
                                'edge_key' => $edge->edge_key ?? null,
                            ]);
                            throw new \Exception('Edge server organization_id is required');
                        }
                        
                        $eventDataForCreate = [
                            'organization_id' => $edge->organization_id,
                            'edge_server_id' => $edge->id,
                            'edge_id' => $edgeId,
                            'event_type' => $eventData['event_type'],
                            'ai_module' => $aiModule,
                            'severity' => $eventData['severity'],
                            'risk_score' => $riskScore,
                            'occurred_at' => $occurredAt,
                            'camera_id' => $eventData['camera_id'] ?? null,
                            'meta' => array_merge($meta, [
                                'camera_id' => $eventData['camera_id'] ?? null,
                            ]),
                        ];
                        
                        // Log before creation for debugging
                        Log::debug('Creating event', [
                            'edge_id' => $edgeId,
                            'organization_id' => $edge->organization_id,
                            'event_type' => $eventData['event_type'],
                            'ai_module' => $aiModule,
                        ]);
                        
                        $event = Event::create($eventDataForCreate);
                        
                        Log::debug('Event created successfully', [
                            'event_id' => $event->id,
                            'event_type' => $event->event_type,
                        ]);

                        $created[] = [
                            'event_id' => $event->id,
                            'event_type' => $event->event_type,
                            'ai_module' => $aiModule,
                        ];
                    } catch (\Illuminate\Database\QueryException $e) {
                        // Database constraint errors - don't re-throw, handle gracefully
                        Log::error('Database error creating event', [
                            'error' => $e->getMessage(),
                            'sql_state' => $e->getSqlState() ?? null,
                            'error_code' => $e->getCode(),
                            'sql' => $e->getSql() ?? null,
                            'bindings' => $e->getBindings() ?? null,
                            'event_data' => $eventData,
                            'edge_id' => $edge->id ?? null,
                            'edge_organization_id' => $edge->organization_id ?? null,
                        ]);
                        $failed[] = [
                            'index' => count($created) + count($failed),
                            'error' => 'database_error',
                            'message' => 'Database constraint error: ' . $e->getMessage(),
                        ];
                    } catch (\Exception $e) {
                        Log::error('Error processing batch event', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString(),
                            'event_data' => $eventData,
                            'edge_id' => $edge->id ?? null,
                            'edge_organization_id' => $edge->organization_id ?? null,
                        ]);
                        $failed[] = [
                            'index' => count($created) + count($failed),
                            'error' => 'processing_failed',
                            'message' => $e->getMessage(),
                        ];
                    }
                }
            }
        }

        return response()->json([
            'ok' => true,
            'created' => count($created),
            'failed' => count($failed),
            'events' => $created,
            'errors' => $failed,
        ]);
        } catch (\Exception $e) {
            // Catch any top-level exceptions (validation, database, etc.)
            Log::error('Batch ingest failed with exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'ok' => false,
                'message' => 'Server error processing batch request',
                'error' => $e->getMessage(),
            ], 500);
        }
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
     * Send notifications for standard AI events (non-enterprise)
     */
    private function sendStandardEventNotification(Event $event, int $organizationId, ?string $aiModule): void
    {
        try {
            $fcmService = app(FcmService::class);
            
            // Map AI modules to friendly names
            $moduleNames = [
                'face' => 'Face Recognition',
                'counter' => 'People Counter',
                'fire' => 'Fire Detection',
                'intrusion' => 'Intrusion Detection',
                'vehicle' => 'Vehicle Recognition',
                'attendance' => 'Attendance',
                'loitering' => 'Loitering Detection',
                'crowd' => 'Crowd Detection',
                'object' => 'Object Detection',
            ];
            
            $moduleName = $moduleNames[$aiModule] ?? ucfirst($aiModule ?? 'AI Detection');
            $severityUpper = strtoupper($event->severity);
            
            $title = sprintf('%s Alert - %s', $moduleName, $severityUpper);
            $body = sprintf(
                '%s detected on camera %s',
                $moduleName,
                $event->camera_id ?? 'unknown'
            );

            // Build notification data
            $data = [
                'type' => 'ai_event',
                'event_id' => $event->id,
                'event_type' => $event->event_type,
                'ai_module' => $aiModule,
                'severity' => $event->severity,
                'camera_id' => $event->camera_id,
                'risk_score' => $event->risk_score,
            ];

            // Add priority based on severity
            $priority = $event->severity === 'critical' ? 'high' : 'normal';

            $fcmService->sendToOrganization(
                $organizationId,
                $title,
                $body,
                $data,
                $priority
            );

            Log::info('Standard AI event notification sent', [
                'event_id' => $event->id,
                'module' => $aiModule,
                'severity' => $event->severity,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send standard event notification', [
                'error' => $e->getMessage(),
                'event_id' => $event->id,
            ]);
        }
    }

    /**
     * Send mobile notification via FCM (for enterprise alerts)
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
