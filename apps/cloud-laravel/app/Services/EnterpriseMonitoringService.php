<?php

namespace App\Services;

use App\Models\AiScenario;
use App\Models\AiCameraBinding;
use App\Models\AiAlertPolicy;
use App\Models\Event;
use App\Models\Camera;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EnterpriseMonitoringService
{
    /**
     * Evaluate enterprise monitoring event and generate alert if needed
     * 
     * @param array $eventData Event data from Edge Server
     * @param int $organizationId Organization ID
     * @param int $edgeServerId Edge Server ID
     * @return array|null Alert data if generated, null otherwise
     */
    public function evaluateEvent(array $eventData, int $organizationId, int $edgeServerId): ?array
    {
        // Extract event details
        $module = $eventData['module'] ?? null;
        $scenarioType = $eventData['scenario'] ?? null;
        $cameraId = $eventData['camera_id'] ?? null;
        $riskSignals = $eventData['risk_signals'] ?? [];
        $confidence = $eventData['confidence'] ?? 0.0;
        $timestamp = $eventData['timestamp'] ?? now()->toIso8601String();

        if (!$module || !$scenarioType || !$cameraId) {
            Log::warning('Enterprise monitoring event missing required fields', [
                'organization_id' => $organizationId,
                'event_data' => $eventData,
            ]);
            return null;
        }

        // Find active scenario
        $scenario = AiScenario::where('organization_id', $organizationId)
            ->where('module', $module)
            ->where('scenario_type', $scenarioType)
            ->where('enabled', true)
            ->first();

        if (!$scenario) {
            Log::debug('Scenario not found or disabled', [
                'organization_id' => $organizationId,
                'module' => $module,
                'scenario_type' => $scenarioType,
            ]);
            return null;
        }

        // Check camera binding
        // Note: camera_id in events is the string identifier, not the database ID
        $camera = Camera::where('organization_id', $organizationId)
            ->where('camera_id', $cameraId)
            ->first();

        if (!$camera) {
            Log::warning('Camera not found', [
                'organization_id' => $organizationId,
                'camera_id' => $cameraId,
            ]);
            return null;
        }

        $binding = AiCameraBinding::where('camera_id', $camera->id) // camera_id in binding table is FK to cameras.id
            ->where('scenario_id', $scenario->id)
            ->where('enabled', true)
            ->first();

        if (!$binding) {
            Log::debug('Camera not bound to scenario or binding disabled', [
                'camera_id' => $camera->id,
                'scenario_id' => $scenario->id,
            ]);
            return null;
        }

        // Calculate risk score
        $riskScore = $this->calculateRiskScore($scenario, $riskSignals, $confidence);

        // Check if risk threshold is met
        if ($riskScore < $scenario->severity_threshold) {
            Log::debug('Risk score below threshold', [
                'risk_score' => $riskScore,
                'threshold' => $scenario->severity_threshold,
            ]);
            return null;
        }

        // Check cooldown
        if ($this->isInCooldown($organizationId, $scenario->id, $camera->id, $riskScore)) {
            Log::debug('Event in cooldown period', [
                'scenario_id' => $scenario->id,
                'camera_id' => $camera->id,
            ]);
            return null;
        }

        // Determine risk level
        $riskLevel = $this->determineRiskLevel($riskScore);

        // Get alert policy
        $alertPolicy = AiAlertPolicy::where('organization_id', $organizationId)
            ->where('risk_level', $riskLevel)
            ->first();

        if (!$alertPolicy) {
            Log::warning('Alert policy not found', [
                'organization_id' => $organizationId,
                'risk_level' => $riskLevel,
            ]);
            return null;
        }

        // Create event record
        $event = Event::create([
            'organization_id' => $organizationId,
            'edge_server_id' => $edgeServerId,
            'edge_id' => $edgeServerId, // Will be updated with actual edge_id
            'event_type' => $scenarioType,
            'ai_module' => $module,
            'severity' => $this->mapRiskLevelToSeverity($riskLevel),
            'risk_score' => $riskScore,
            'occurred_at' => $timestamp,
            'title' => $scenario->name,
            'description' => $this->generateEventDescription($scenario, $riskSignals, $riskScore),
            'camera_id' => $cameraId,
            'meta' => [
                'module' => $module,
                'scenario' => $scenarioType,
                'scenario_id' => $scenario->id,
                'risk_signals' => $riskSignals,
                'confidence' => $confidence,
                'risk_level' => $riskLevel,
                'alert_policy_id' => $alertPolicy->id,
            ],
        ]);

        // Return alert data for notification
        return [
            'event_id' => $event->id,
            'organization_id' => $organizationId,
            'scenario_id' => $scenario->id,
            'scenario_name' => $scenario->name,
            'risk_level' => $riskLevel,
            'risk_score' => $riskScore,
            'camera_id' => $cameraId,
            'alert_policy' => [
                'notify_web' => $alertPolicy->notify_web,
                'notify_mobile' => $alertPolicy->notify_mobile,
                'notify_email' => $alertPolicy->notify_email,
                'notify_sms' => $alertPolicy->notify_sms,
            ],
            'cooldown_minutes' => $alertPolicy->cooldown_minutes,
        ];
    }

    /**
     * Calculate risk score based on scenario rules and risk signals
     */
    private function calculateRiskScore(AiScenario $scenario, array $riskSignals, float $confidence): int
    {
        $rules = $scenario->rules()->ordered()->get();
        $baseScore = 0;
        $maxWeight = 0;

        foreach ($rules as $rule) {
            $maxWeight += $rule->weight;
            $ruleScore = $this->evaluateRule($rule, $riskSignals);
            $baseScore += ($ruleScore * $rule->weight);
        }

        if ($maxWeight === 0) {
            return 0;
        }

        // Normalize to 0-100 scale
        $normalizedScore = ($baseScore / $maxWeight) * 100;

        // Apply confidence multiplier
        $finalScore = (int) round($normalizedScore * $confidence);

        return min(100, max(0, $finalScore));
    }

    /**
     * Evaluate a single rule against risk signals
     */
    private function evaluateRule($rule, array $riskSignals): float
    {
        $ruleType = $rule->rule_type;
        $ruleValue = $rule->rule_value;
        $signalValue = $riskSignals[$ruleType] ?? null;

        if ($signalValue === null) {
            return 0.0;
        }

        // Rule evaluation logic based on type
        switch ($ruleType) {
            case 'duration':
                $minSeconds = $ruleValue['min_seconds'] ?? 0;
                $actualSeconds = (float) ($signalValue['seconds'] ?? 0);
                return $actualSeconds >= $minSeconds ? 1.0 : ($actualSeconds / $minSeconds);

            case 'location':
                $requiredZone = $ruleValue['zone'] ?? null;
                $actualZone = $signalValue['zone'] ?? null;
                return $requiredZone === $actualZone ? 1.0 : 0.0;

            case 'pattern':
                $requiredPattern = $ruleValue;
                $actualPattern = $signalValue;
                // Simple pattern matching
                $matches = 0;
                $total = 0;
                foreach ($requiredPattern as $key => $value) {
                    $total++;
                    if (isset($actualPattern[$key]) && $actualPattern[$key] == $value) {
                        $matches++;
                    }
                }
                return $total > 0 ? ($matches / $total) : 0.0;

            case 'detection':
                $required = $ruleValue['required'] ?? false;
                $detected = $signalValue['detected'] ?? false;
                return ($required && $detected) || (!$required && !$detected) ? 1.0 : 0.0;

            case 'proximity':
                $maxDistance = $ruleValue['max_distance_meters'] ?? 0;
                $actualDistance = (float) ($signalValue['distance_meters'] ?? 999);
                return $actualDistance <= $maxDistance ? 1.0 : max(0, 1.0 - ($actualDistance - $maxDistance) / $maxDistance);

            case 'count':
                $minCount = $ruleValue['min_workers'] ?? 0;
                $actualCount = (int) ($signalValue['count'] ?? 0);
                return $actualCount >= $minCount ? 1.0 : ($actualCount / $minCount);

            case 'activity':
                $requiredActivity = $ruleValue['activity_level'] ?? null;
                $actualActivity = $signalValue['activity_level'] ?? null;
                return $requiredActivity === $actualActivity ? 1.0 : 0.0;

            case 'authorization':
                $required = $ruleValue['required'] ?? false;
                $authorized = $signalValue['authorized'] ?? false;
                return ($required && $authorized) || (!$required) ? 1.0 : 0.0;

            default:
                return 0.0;
        }
    }

    /**
     * Determine risk level from risk score
     */
    private function determineRiskLevel(int $riskScore): string
    {
        if ($riskScore >= 85) {
            return 'critical';
        } elseif ($riskScore >= 70) {
            return 'high';
        } else {
            return 'medium';
        }
    }

    /**
     * Map risk level to event severity
     */
    private function mapRiskLevelToSeverity(string $riskLevel): string
    {
        return match ($riskLevel) {
            'critical' => 'critical',
            'high' => 'high',
            default => 'medium',
        };
    }

    /**
     * Check if event is in cooldown period
     */
    private function isInCooldown(int $organizationId, int $scenarioId, int $cameraId, int $riskScore): bool
    {
        $riskLevel = $this->determineRiskLevel($riskScore);
        $alertPolicy = AiAlertPolicy::where('organization_id', $organizationId)
            ->where('risk_level', $riskLevel)
            ->first();

        if (!$alertPolicy || $alertPolicy->cooldown_minutes <= 0) {
            return false;
        }

        $cooldownStart = now()->subMinutes($alertPolicy->cooldown_minutes);

        // Find camera by camera_id string to get database ID
        $camera = Camera::where('organization_id', $organizationId)
            ->where('camera_id', $cameraId)
            ->first();

        if (!$camera) {
            return false;
        }

        $recentEvent = Event::where('organization_id', $organizationId)
            ->where('camera_id', $cameraId) // camera_id in events is the string identifier
            ->whereJsonContains('meta->scenario_id', $scenarioId)
            ->where('occurred_at', '>=', $cooldownStart)
            ->where('occurred_at', '<=', now())
            ->exists();

        return $recentEvent;
    }

    /**
     * Generate event description
     */
    private function generateEventDescription(AiScenario $scenario, array $riskSignals, int $riskScore): string
    {
        $description = $scenario->description ?? '';
        $description .= "\n\nRisk Score: {$riskScore}/100";
        
        if (!empty($riskSignals)) {
            $description .= "\n\nDetected Signals:";
            foreach ($riskSignals as $signalType => $signalData) {
                if (is_array($signalData)) {
                    $description .= "\n- {$signalType}: " . json_encode($signalData);
                } else {
                    $description .= "\n- {$signalType}: {$signalData}";
                }
            }
        }

        return $description;
    }
}
