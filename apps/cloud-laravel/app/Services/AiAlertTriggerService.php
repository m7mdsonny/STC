<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Alert;
use App\Services\FcmService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * AI Alert Trigger Service
 * 
 * Automatically creates alerts based on AI event patterns and thresholds.
 * Monitors events and triggers alerts when specific conditions are met.
 */
class AiAlertTriggerService
{
    protected FcmService $fcmService;

    public function __construct(FcmService $fcmService)
    {
        $this->fcmService = $fcmService;
    }

    /**
     * Evaluate recent events and create alerts based on triggers
     * 
     * Should be called periodically (e.g., every 5 minutes via scheduler)
     */
    public function evaluateAndTrigger(int $organizationId): array
    {
        $triggers = [
            'fire_detection_spike' => $this->checkFireDetectionSpike($organizationId),
            'intrusion_multiple' => $this->checkMultipleIntrusions($organizationId),
            'high_risk_concentration' => $this->checkHighRiskConcentration($organizationId),
            'module_inactivity' => $this->checkModuleInactivity($organizationId),
            'low_confidence_events' => $this->checkLowConfidenceEvents($organizationId),
            'camera_offline_after_events' => $this->checkCameraOfflineAfterEvents($organizationId),
        ];

        $triggeredAlerts = [];
        
        foreach ($triggers as $triggerName => $result) {
            if ($result['triggered']) {
                $alert = $this->createAlert($organizationId, $triggerName, $result['data']);
                if ($alert) {
                    $triggeredAlerts[] = $alert;
                    $this->sendNotification($organizationId, $alert);
                }
            }
        }

        return [
            'evaluated' => count($triggers),
            'triggered' => count($triggeredAlerts),
            'alerts' => $triggeredAlerts,
        ];
    }

    /**
     * Check for fire detection spike (multiple fire events in short time)
     */
    private function checkFireDetectionSpike(int $organizationId): array
    {
        $last5Minutes = now()->subMinutes(5);
        
        $fireEvents = Event::where('organization_id', $organizationId)
            ->where('ai_module', 'fire')
            ->where('occurred_at', '>=', $last5Minutes)
            ->count();

        $triggered = $fireEvents >= 3; // 3+ fire events in 5 minutes

        return [
            'triggered' => $triggered,
            'data' => [
                'count' => $fireEvents,
                'period_minutes' => 5,
                'threshold' => 3,
            ],
        ];
    }

    /**
     * Check for multiple intrusion events from same camera
     */
    private function checkMultipleIntrusions(int $organizationId): array
    {
        $last10Minutes = now()->subMinutes(10);
        
        $intrusions = Event::where('organization_id', $organizationId)
            ->where('ai_module', 'intrusion')
            ->where('occurred_at', '>=', $last10Minutes)
            ->select('camera_id', DB::raw('COUNT(*) as count'))
            ->groupBy('camera_id')
            ->having('count', '>=', 5)
            ->get();

        $triggered = $intrusions->count() > 0;

        return [
            'triggered' => $triggered,
            'data' => [
                'cameras_affected' => $intrusions->pluck('camera_id')->toArray(),
                'counts' => $intrusions->pluck('count', 'camera_id')->toArray(),
                'period_minutes' => 10,
                'threshold' => 5,
            ],
        ];
    }

    /**
     * Check for high risk events concentration
     */
    private function checkHighRiskConcentration(int $organizationId): array
    {
        $last15Minutes = now()->subMinutes(15);
        
        $highRiskEvents = Event::where('organization_id', $organizationId)
            ->where(function ($query) {
                $query->where('severity', 'critical')
                      ->orWhere('risk_score', '>=', 80);
            })
            ->where('occurred_at', '>=', $last15Minutes)
            ->count();

        $triggered = $highRiskEvents >= 10; // 10+ high risk events in 15 minutes

        return [
            'triggered' => $triggered,
            'data' => [
                'count' => $highRiskEvents,
                'period_minutes' => 15,
                'threshold' => 10,
            ],
        ];
    }

    /**
     * Check for AI module inactivity (module not sending events when expected)
     */
    private function checkModuleInactivity(int $organizationId): array
    {
        $last2Hours = now()->subHours(2);
        
        // Check modules that should be active (have events in last 7 days)
        $activeModules = Event::where('organization_id', $organizationId)
            ->where('occurred_at', '>=', now()->subDays(7))
            ->whereNotNull('ai_module')
            ->distinct()
            ->pluck('ai_module')
            ->toArray();

        $inactiveModules = [];
        
        foreach ($activeModules as $module) {
            $lastEvent = Event::where('organization_id', $organizationId)
                ->where('ai_module', $module)
                ->where('occurred_at', '>=', $last2Hours)
                ->exists();
            
            if (!$lastEvent) {
                $inactiveModules[] = $module;
            }
        }

        $triggered = count($inactiveModules) > 0;

        return [
            'triggered' => $triggered,
            'data' => [
                'inactive_modules' => $inactiveModules,
                'period_hours' => 2,
            ],
        ];
    }

    /**
     * Check for low confidence events (potential false positives)
     */
    private function checkLowConfidenceEvents(int $organizationId): array
    {
        $lastHour = now()->subHour();
        
        $lowConfidenceCount = Event::where('organization_id', $organizationId)
            ->where('occurred_at', '>=', $lastHour)
            ->whereNotNull('meta->confidence')
            ->where(DB::raw('CAST(JSON_EXTRACT(meta, "$.confidence") AS DECIMAL(5,2))'), '<', 0.60)
            ->count();

        $triggered = $lowConfidenceCount >= 20; // 20+ low confidence events in 1 hour

        return [
            'triggered' => $triggered,
            'data' => [
                'count' => $lowConfidenceCount,
                'confidence_threshold' => 0.60,
                'period_hours' => 1,
                'threshold' => 20,
            ],
        ];
    }

    /**
     * Check for camera going offline after receiving events
     */
    private function checkCameraOfflineAfterEvents(int $organizationId): array
    {
        // This would need integration with camera status monitoring
        // For now, return not triggered
        return [
            'triggered' => false,
            'data' => [],
        ];
    }

    /**
     * Create alert from trigger
     */
    private function createAlert(int $organizationId, string $triggerName, array $data): ?Alert
    {
        $triggerTitles = [
            'fire_detection_spike' => 'Fire Detection Spike Detected',
            'intrusion_multiple' => 'Multiple Intrusion Events',
            'high_risk_concentration' => 'High Risk Events Concentration',
            'module_inactivity' => 'AI Module Inactivity',
            'low_confidence_events' => 'Low Confidence Events Detected',
        ];

        $title = $triggerTitles[$triggerName] ?? 'AI Alert Triggered';
        
        // Check if similar alert was created recently (avoid duplicates)
        $recentAlert = Alert::where('organization_id', $organizationId)
            ->where('title', 'LIKE', "%{$title}%")
            ->where('created_at', '>=', now()->subMinutes(30))
            ->first();

        if ($recentAlert) {
            return null; // Don't create duplicate alert
        }

        $description = $this->formatTriggerDescription($triggerName, $data);

        $alert = Alert::create([
            'organization_id' => $organizationId,
            'title' => $title,
            'body' => $description,
            'severity' => $this->getTriggerSeverity($triggerName),
            'status' => 'new',
            'meta' => [
                'trigger_type' => $triggerName,
                'trigger_data' => $data,
            ],
        ]);

        return $alert;
    }

    /**
     * Format trigger description
     */
    private function formatTriggerDescription(string $triggerName, array $data): string
    {
        switch ($triggerName) {
            case 'fire_detection_spike':
                return sprintf(
                    'Fire detection module triggered %d times in the last %d minutes. Immediate attention required.',
                    $data['count'],
                    $data['period_minutes']
                );
            
            case 'intrusion_multiple':
                return sprintf(
                    'Multiple intrusion events detected on %d camera(s). Highest count: %d events.',
                    count($data['cameras_affected']),
                    max($data['counts'])
                );
            
            case 'high_risk_concentration':
                return sprintf(
                    '%d high-risk events detected in the last %d minutes. Review required.',
                    $data['count'],
                    $data['period_minutes']
                );
            
            case 'module_inactivity':
                return sprintf(
                    'The following AI modules have been inactive for %d hours: %s',
                    $data['period_hours'],
                    implode(', ', $data['inactive_modules'])
                );
            
            case 'low_confidence_events':
                return sprintf(
                    '%d low-confidence events (confidence < %.0f%%) detected in the last hour. Consider recalibrating AI modules.',
                    $data['count'],
                    $data['confidence_threshold'] * 100
                );
            
            default:
                return 'AI alert trigger activated.';
        }
    }

    /**
     * Get severity for trigger type
     */
    private function getTriggerSeverity(string $triggerName): string
    {
        $severityMap = [
            'fire_detection_spike' => 'critical',
            'intrusion_multiple' => 'warning',
            'high_risk_concentration' => 'warning',
            'module_inactivity' => 'warning',
            'low_confidence_events' => 'info',
        ];

        return $severityMap[$triggerName] ?? 'warning';
    }

    /**
     * Send notification for triggered alert
     */
    private function sendNotification(int $organizationId, Alert $alert): void
    {
        try {
            $this->fcmService->sendToOrganization(
                $organizationId,
                $alert->title,
                $alert->body,
                [
                    'type' => 'ai_alert_trigger',
                    'alert_id' => $alert->id,
                    'trigger_type' => $alert->meta['trigger_type'] ?? null,
                    'severity' => $alert->severity,
                ],
                $alert->severity === 'critical' ? 'high' : 'normal'
            );
        } catch (\Exception $e) {
            Log::error('Failed to send alert trigger notification', [
                'alert_id' => $alert->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
