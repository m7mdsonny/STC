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
use Illuminate\Support\Facades\DB;

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
            // Use organization_id directly to avoid authorization issues with relationship loading
            $organizationId = $edge->organization_id;
            if ($organizationId) {
                try {
                    $organization = \App\Models\Organization::find($organizationId);
                    if ($organization && !$this->subscriptionService->isModuleEnabled($organization, $meta['module'])) {
                        // Silently reject events for disabled modules
                        return response()->json([
                            'ok' => false,
                            'message' => 'Module not enabled',
                            'error' => 'module_disabled'
                        ], 403);
                    }
                } catch (\Exception $e) {
                    // Log error but continue processing (don't fail entire request)
                    Log::debug('Error checking module enabled status (ingest)', [
                        'error' => $e->getMessage(),
                        'organization_id' => $organizationId,
                        'module' => $meta['module'],
                    ]);
                    // Continue processing - don't block event ingestion
                }
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

            // CRITICAL: Validate edge server has required fields
            if (empty($edge->organization_id)) {
                Log::error('Batch ingest: Edge server missing organization_id', [
                    'edge_id' => $edge->id ?? null,
                    'edge_key' => $edge->edge_key ?? null,
                ]);
                return response()->json([
                    'message' => 'Edge server configuration error: missing organization_id',
                    'error' => 'configuration_error'
                ], 403); // Changed from 500 to 403 - this is a configuration issue, not a server error
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
            
            // CRITICAL: Use database transaction for atomicity
            DB::beginTransaction();

            foreach ($events as $eventData) {
                try {
                    // Extract ai_module from meta - ensure meta is always an array
                    $meta = is_array($eventData['meta'] ?? []) ? ($eventData['meta'] ?? []) : [];
                    $aiModule = $meta['module'] ?? null;
                    $riskScore = isset($meta['risk_score']) ? (int) $meta['risk_score'] : null;

                    // Check if module is enabled
                    if ($aiModule) {
                        try {
                            // Use organization_id directly instead of loading relationship to avoid authorization issues
                            $organizationId = $edge->organization_id;
                            if ($organizationId) {
                                $organization = \App\Models\Organization::find($organizationId);
                                if ($organization && !$this->subscriptionService->isModuleEnabled($organization, $aiModule)) {
                                    $failed[] = [
                                        'index' => count($created) + count($failed),
                                        'error' => 'module_disabled',
                                        'module' => $aiModule,
                                    ];
                                    continue;
                                }
                            }
                        } catch (\Exception $e) {
                            // Log error only once per minute to reduce noise (suppress if locking fails)
                            $logKey = "module_check_error_{$edge->id}_{$aiModule}";
                            
                            try {
                                $lock = cache()->lock("lock_{$logKey}", 10);
                                
                                if ($lock->get(0)) {
                                    try {
                                        if (!cache()->has($logKey)) {
                                            Log::warning('Error checking module enabled status', [
                                                'error' => $e->getMessage(),
                                                'ai_module' => $aiModule,
                                                'edge_id' => $edge->id,
                                                'organization_id' => $edge->organization_id ?? null,
                                            ]);
                                            cache()->put($logKey, true, now()->addMinute());
                                        }
                                    } finally {
                                        $lock->release();
                                    }
                                }
                            } catch (\Exception $lockError) {
                                // Suppress log if locking fails (prevent duplicate logs)
                            }
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
                        
                        // CRITICAL: Validate all required fields before creating
                        // Ensure all values are properly typed and not null for required fields
                        $eventDataForCreate = [];
                        
                        // Required fields - must not be null
                        $eventDataForCreate['organization_id'] = (int) $edge->organization_id;
                        $eventDataForCreate['edge_server_id'] = (int) $edge->id;
                        $eventDataForCreate['edge_id'] = (string) $edgeId;
                        $eventDataForCreate['event_type'] = (string) ($eventData['event_type'] ?? 'analytics');
                        $eventDataForCreate['severity'] = (string) ($eventData['severity'] ?? 'info');
                        
                        // Optional fields - can be null
                        $eventDataForCreate['ai_module'] = $aiModule ? (string) $aiModule : null;
                        $eventDataForCreate['risk_score'] = $riskScore !== null ? (int) $riskScore : null;
                        $eventDataForCreate['camera_id'] = $eventData['camera_id'] ? (string) $eventData['camera_id'] : null;
                        
                        // Handle occurred_at - must be valid datetime
                        if ($occurredAt instanceof \Carbon\Carbon) {
                            $eventDataForCreate['occurred_at'] = $occurredAt;
                        } else {
                            try {
                                $eventDataForCreate['occurred_at'] = \Carbon\Carbon::parse($occurredAt);
                            } catch (\Exception $e) {
                                $eventDataForCreate['occurred_at'] = now();
                            }
                        }
                        
                        // Handle meta - must be array
                        $eventDataForCreate['meta'] = is_array($meta) ? array_merge($meta, [
                            'camera_id' => $eventData['camera_id'] ?? null,
                        ]) : [];
                        
                        // CRITICAL: Final validation - ensure no null/empty values for required fields
                        $requiredFields = ['organization_id', 'edge_server_id', 'edge_id', 'event_type', 'severity', 'occurred_at'];
                        foreach ($requiredFields as $field) {
                            if (!isset($eventDataForCreate[$field]) || $eventDataForCreate[$field] === null || $eventDataForCreate[$field] === '') {
                                throw new \Exception("Required field '{$field}' is missing or empty");
                            }
                        }
                        
                        // Additional validation
                        if ($eventDataForCreate['organization_id'] <= 0) {
                            throw new \Exception('organization_id must be a positive integer');
                        }
                        if ($eventDataForCreate['edge_server_id'] <= 0) {
                            throw new \Exception('edge_server_id must be a positive integer');
                        }
                        
                        // Log before creation for debugging
                        Log::debug('Creating event', [
                            'edge_id' => $edgeId,
                            'organization_id' => $edge->organization_id,
                            'event_type' => $eventData['event_type'],
                            'ai_module' => $aiModule,
                        ]);
                        
                        // CRITICAL: Use DB transaction and handle all exceptions
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
                        Log::error('Error creating event', [
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
            } // Close foreach loop
            
            // CRITICAL: Commit transaction only if we processed all events
            DB::commit();
            
            // Log based on results - only log when there's something meaningful
            $createdCount = count($created);
            $failedCount = count($failed);
            $totalCount = count($events);
            
            // Check if all failures are due to module_disabled (expected behavior, not an error)
            $allModuleDisabled = $failedCount > 0 && $createdCount == 0 && 
                                 count(array_filter($failed, fn($e) => ($e['error'] ?? null) === 'module_disabled')) === $failedCount;
            
            if ($createdCount > 0 && $failedCount == 0) {
                // All events created successfully - use DEBUG to reduce log noise
                Log::debug('Batch ingest completed successfully', [
                    'edge_id' => $edge->id ?? null,
                    'edge_key' => $edge->edge_key ?? null,
                    'organization_id' => $edge->organization_id ?? null,
                    'total_events' => $totalCount,
                    'created' => $createdCount,
                ]);
            } elseif ($createdCount > 0 && $failedCount > 0) {
                // Partial success - log as WARNING (only once per minute to reduce noise)
                $logKey = "batch_partial_{$edge->id}_{$edge->organization_id}";
                
                try {
                    // Use lock to prevent duplicate logs
                    $lock = cache()->lock("lock_{$logKey}", 30);
                    
                    if ($lock->get(0)) {
                        try {
                            if (!cache()->has($logKey)) {
                                Log::warning('Batch ingest partially completed', [
                                    'edge_id' => $edge->id ?? null,
                                    'edge_key' => $edge->edge_key ?? null,
                                    'organization_id' => $edge->organization_id ?? null,
                                    'total_events' => $totalCount,
                                    'created' => $createdCount,
                                    'failed' => $failedCount,
                                ]);
                                cache()->put($logKey, true, now()->addMinute());
                            }
                        } finally {
                            $lock->release();
                        }
                    }
                } catch (\Exception $e) {
                    // Suppress duplicate logs if locking fails
                }
            } elseif ($createdCount == 0 && $failedCount > 0) {
                if ($allModuleDisabled) {
                    // All events failed due to disabled modules - log as WARNING once per hour (not an error)
                    // Use database-based locking to prevent duplicate logs from concurrent requests
                    $logKey = "batch_all_modules_disabled_{$edge->id}_{$edge->organization_id}";
                    
                    try {
                        // Try to acquire lock with blocking timeout (prevents duplicates)
                        $lock = cache()->lock("lock_{$logKey}", 60); // 60 second lock
                        
                        if ($lock->get(0)) { // Non-blocking, return immediately if lock unavailable
                            try {
                                // Double-check: only log if not logged in the last hour
                                if (!cache()->has($logKey)) {
                                    Log::warning('Batch ingest: all modules disabled for organization', [
                                        'edge_id' => $edge->id ?? null,
                                        'edge_key' => $edge->edge_key ?? null,
                                        'organization_id' => $edge->organization_id ?? null,
                                        'total_events' => $totalCount,
                                        'failed_modules' => array_column($failed, 'module'),
                                    ]);
                                    // Set cache with hour-long TTL
                                    cache()->put($logKey, time(), now()->addHour());
                                }
                            } finally {
                                $lock->release();
                            }
                        }
                        // If lock is unavailable, another request is logging - skip
                    } catch (\Exception $e) {
                        // If locking fails completely, suppress the log (better than duplicates)
                        // Log only the locking error (once per minute)
                        $lockErrorKey = "lock_error_{$logKey}";
                        if (!cache()->has($lockErrorKey)) {
                            Log::debug('Failed to acquire lock for batch ingest log (suppressing duplicate)', [
                                'error' => $e->getMessage(),
                                'log_key' => $logKey,
                            ]);
                            cache()->put($lockErrorKey, true, now()->addMinute());
                        }
                    }
                } else {
                    // All events failed for other reasons - log as ERROR (but rate limit to once per minute)
                    $logKey = "batch_all_failed_{$edge->id}_{$edge->organization_id}";
                    $lock = cache()->lock("log_lock_{$logKey}", 10); // 10 second lock
                    
                    try {
                        if ($lock->get()) {
                            // Double-check: if already logged recently, skip
                            if (!cache()->has($logKey)) {
                                Log::error('Batch ingest failed - all events failed', [
                                    'edge_id' => $edge->id ?? null,
                                    'edge_key' => $edge->edge_key ?? null,
                                    'organization_id' => $edge->organization_id ?? null,
                                    'total_events' => $totalCount,
                                    'failed' => $failedCount,
                                    'errors' => $failed,
                                ]);
                                // Set cache with minute-long TTL
                                cache()->put($logKey, true, now()->addMinute());
                            }
                        }
                    } finally {
                        optional($lock)->release();
                    }
                }
            }
            
            return response()->json([
                'ok' => true,
                'created' => count($created),
                'failed' => count($failed),
                'events' => $created,
                'errors' => $failed,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Batch ingest validation exception', [
                'error' => $e->getMessage(),
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'ok' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            Log::error('Batch ingest database exception', [
                'error' => $e->getMessage(),
                'sql_state' => $e->getSqlState() ?? null,
                'error_code' => $e->getCode(),
                'sql' => $e->getSql() ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'ok' => false,
                'message' => 'Database error processing batch request',
                'error' => $e->getMessage(),
                'sql_state' => $e->getSqlState() ?? null,
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            // Catch any top-level exceptions (validation, database, etc.)
            Log::error('Batch ingest failed with exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'ok' => false,
                'message' => 'Server error processing batch request',
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
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
