<?php

namespace App\Services;

use App\Models\Event;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class AnalyticsService
{
    /**
     * Cache TTL in seconds
     */
    private const CACHE_TTL = 300; // 5 minutes

    /**
     * Get time series data for events
     * 
     * @param int $organizationId
     * @param string $granularity hour|day|week|month
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @param array $filters Additional filters (camera_id, ai_module, severity)
     * @return array
     */
    public function getTimeSeries(
        int $organizationId,
        string $granularity = 'day',
        ?Carbon $startDate = null,
        ?Carbon $endDate = null,
        array $filters = []
    ): array {
        $cacheKey = $this->getCacheKey('time_series', [
            $organizationId,
            $granularity,
            $startDate?->toDateString(),
            $endDate?->toDateString(),
            md5(json_encode($filters)),
        ]);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use (
            $organizationId,
            $granularity,
            $startDate,
            $endDate,
            $filters
        ) {
            $query = Event::where('organization_id', $organizationId);

            // Apply date range
            if ($startDate) {
                $query->where('occurred_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->where('occurred_at', '<=', $endDate);
            }

            // Apply filters
            if (isset($filters['camera_id'])) {
                $query->where('camera_id', $filters['camera_id']);
            }
            if (isset($filters['ai_module'])) {
                $query->where('ai_module', $filters['ai_module']);
            }
            if (isset($filters['severity'])) {
                $query->where('severity', $filters['severity']);
            }

            // Determine date format based on granularity
            $dateFormat = match ($granularity) {
                'hour' => '%Y-%m-%d %H:00:00',
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d',
            };

            // Group by time period
            $results = $query
                ->selectRaw("DATE_FORMAT(occurred_at, '{$dateFormat}') as period, COUNT(*) as count")
                ->groupBy('period')
                ->orderBy('period')
                ->get();

            return $results->map(function ($item) {
                return [
                    'period' => $item->period,
                    'count' => (int) $item->count,
                ];
            })->toArray();
        });
    }

    /**
     * Get events grouped by AI module
     * 
     * @param int $organizationId
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getByModule(
        int $organizationId,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $cacheKey = $this->getCacheKey('by_module', [
            $organizationId,
            $startDate?->toDateString(),
            $endDate?->toDateString(),
        ]);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use (
            $organizationId,
            $startDate,
            $endDate
        ) {
            $query = Event::where('organization_id', $organizationId)
                ->whereNotNull('ai_module');

            if ($startDate) {
                $query->where('occurred_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->where('occurred_at', '<=', $endDate);
            }

            return $query
                ->selectRaw('ai_module, COUNT(*) as count')
                ->groupBy('ai_module')
                ->orderByDesc('count')
                ->get()
                ->map(function ($item) {
                    return [
                        'module' => $item->ai_module,
                        'count' => (int) $item->count,
                    ];
                })
                ->toArray();
        });
    }

    /**
     * Get events grouped by camera
     * 
     * @param int $organizationId
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getByCamera(
        int $organizationId,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $cacheKey = $this->getCacheKey('by_camera', [
            $organizationId,
            $startDate?->toDateString(),
            $endDate?->toDateString(),
        ]);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use (
            $organizationId,
            $startDate,
            $endDate
        ) {
            $query = Event::where('organization_id', $organizationId)
                ->whereNotNull('camera_id');

            if ($startDate) {
                $query->where('occurred_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->where('occurred_at', '<=', $endDate);
            }

            return $query
                ->selectRaw('camera_id, COUNT(*) as count')
                ->groupBy('camera_id')
                ->orderByDesc('count')
                ->limit(20) // Top 20 cameras
                ->get()
                ->map(function ($item) {
                    return [
                        'camera_id' => $item->camera_id,
                        'count' => (int) $item->count,
                    ];
                })
                ->toArray();
        });
    }

    /**
     * Get events grouped by severity
     * 
     * @param int $organizationId
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getBySeverity(
        int $organizationId,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $cacheKey = $this->getCacheKey('by_severity', [
            $organizationId,
            $startDate?->toDateString(),
            $endDate?->toDateString(),
        ]);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use (
            $organizationId,
            $startDate,
            $endDate
        ) {
            $query = Event::where('organization_id', $organizationId);

            if ($startDate) {
                $query->where('occurred_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->where('occurred_at', '<=', $endDate);
            }

            return $query
                ->selectRaw('severity, COUNT(*) as count')
                ->groupBy('severity')
                ->orderByRaw("FIELD(severity, 'critical', 'high', 'medium', 'warning', 'info')")
                ->get()
                ->map(function ($item) {
                    return [
                        'severity' => $item->severity,
                        'count' => (int) $item->count,
                    ];
                })
                ->toArray();
        });
    }

    /**
     * Get high risk events (risk_score >= threshold)
     * 
     * @param int $organizationId
     * @param int $threshold Risk score threshold (default: 80)
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getHighRiskEvents(
        int $organizationId,
        int $threshold = 80,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $cacheKey = $this->getCacheKey('high_risk', [
            $organizationId,
            $threshold,
            $startDate?->toDateString(),
            $endDate?->toDateString(),
        ]);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use (
            $organizationId,
            $threshold,
            $startDate,
            $endDate
        ) {
            $query = Event::where('organization_id', $organizationId)
                ->whereNotNull('risk_score')
                ->where('risk_score', '>=', $threshold);

            if ($startDate) {
                $query->where('occurred_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->where('occurred_at', '<=', $endDate);
            }

            return $query
                ->orderByDesc('risk_score')
                ->orderByDesc('occurred_at')
                ->limit(100)
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'event_type' => $event->event_type,
                        'ai_module' => $event->ai_module,
                        'severity' => $event->severity,
                        'risk_score' => $event->risk_score,
                        'camera_id' => $event->camera_id,
                        'occurred_at' => $event->occurred_at->toIso8601String(),
                        'title' => $event->title,
                    ];
                })
                ->toArray();
        });
    }

    /**
     * Get today's alerts count
     * 
     * @param int $organizationId
     * @return int
     */
    public function getTodayAlertsCount(int $organizationId): int
    {
        $cacheKey = $this->getCacheKey('today_alerts', [$organizationId, Carbon::today()->toDateString()]);

        return Cache::remember($cacheKey, 60, function () use ($organizationId) {
            return Event::where('organization_id', $organizationId)
                ->whereDate('occurred_at', Carbon::today())
                ->count();
        });
    }

    /**
     * Get weekly trend (last 7 days)
     * 
     * @param int $organizationId
     * @return array
     */
    public function getWeeklyTrend(int $organizationId): array
    {
        $cacheKey = $this->getCacheKey('weekly_trend', [$organizationId, Carbon::today()->toDateString()]);

        return Cache::remember($cacheKey, 300, function () use ($organizationId) {
            $startDate = Carbon::today()->subDays(6)->startOfDay();
            $endDate = Carbon::today()->endOfDay();

            return $this->getTimeSeries($organizationId, 'day', $startDate, $endDate);
        });
    }

    /**
     * Get module activity summary
     * 
     * @param int $organizationId
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getModuleActivity(
        int $organizationId,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        if (!$startDate) {
            $startDate = Carbon::today()->subDays(7)->startOfDay();
        }
        if (!$endDate) {
            $endDate = Carbon::today()->endOfDay();
        }

        return $this->getByModule($organizationId, $startDate, $endDate);
    }

    /**
     * Get top N most active cameras
     * 
     * @param int $organizationId
     * @param int $limit
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return array
     */
    public function getTopCameras(
        int $organizationId,
        int $limit = 10,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $results = $this->getByCamera($organizationId, $startDate, $endDate);
        return array_slice($results, 0, $limit);
    }

    /**
     * Generate cache key
     * 
     * @param string $type
     * @param array $params
     * @return string
     */
    private function getCacheKey(string $type, array $params): string
    {
        return 'analytics:' . $type . ':' . md5(json_encode($params));
    }

    /**
     * Clear analytics cache for organization
     * 
     * @param int $organizationId
     * @return void
     */
    public function clearCache(int $organizationId): void
    {
        // Clear all analytics cache keys for this organization
        // Note: In production, use Redis tags or a more sophisticated cache invalidation
        Cache::flush(); // Simple approach - clear all cache
    }
}
