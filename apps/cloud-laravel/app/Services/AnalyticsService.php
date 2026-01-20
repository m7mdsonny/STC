<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\AnalyticsDashboard;
use App\Models\AnalyticsReport;
use App\Models\AnalyticsWidget;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class AnalyticsService
{
    private ?DomainActionService $domainActionService = null;

    public function setDomainActionService(DomainActionService $service): void
    {
        $this->domainActionService = $service;
    }

    // ==================== REPORT MUTATIONS ====================

    /**
     * Create an analytics report
     */
    public function createReport(array $data, User $actor): AnalyticsReport
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can create reports', 403);
        }

        return $this->executeMutation(function () use ($data, $actor) {
            return AnalyticsReport::create([
                ...$data,
                'created_by' => $actor->id,
                'status' => 'draft',
            ]);
        });
    }

    /**
     * Update an analytics report
     */
    public function updateReport(AnalyticsReport $report, array $data, User $actor): AnalyticsReport
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can update reports', 403);
        }

        return $this->executeMutation(function () use ($report, $data) {
            $report->update($data);
            return $report->fresh();
        });
    }

    /**
     * Delete an analytics report
     */
    public function deleteReport(AnalyticsReport $report, User $actor): void
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can delete reports', 403);
        }

        $this->executeMutation(function () use ($report) {
            $report->delete();
        });
    }

    /**
     * Generate a report
     */
    public function generateReport(AnalyticsReport $report, User $actor): AnalyticsReport
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can generate reports', 403);
        }

        return $this->executeMutation(function () use ($report) {
            $report->update([
                'status' => 'generated',
                'last_generated_at' => now(),
                'file_url' => $report->file_url ?? '/api/v1/analytics/reports/' . $report->id . '/download',
            ]);
            return $report->fresh();
        });
    }

    // ==================== DASHBOARD MUTATIONS ====================

    /**
     * Create a dashboard
     */
    public function createDashboard(array $data, User $actor): AnalyticsDashboard
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can create dashboards', 403);
        }

        return $this->executeMutation(function () use ($data) {
            return AnalyticsDashboard::create($data);
        });
    }

    /**
     * Update a dashboard
     */
    public function updateDashboard(AnalyticsDashboard $dashboard, array $data, User $actor): AnalyticsDashboard
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can update dashboards', 403);
        }

        return $this->executeMutation(function () use ($dashboard, $data) {
            $dashboard->update($data);
            return $dashboard->fresh();
        });
    }

    /**
     * Delete a dashboard
     */
    public function deleteDashboard(AnalyticsDashboard $dashboard, User $actor): void
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can delete dashboards', 403);
        }

        $this->executeMutation(function () use ($dashboard) {
            $dashboard->delete();
        });
    }

    // ==================== WIDGET MUTATIONS ====================

    /**
     * Create a widget
     */
    public function createWidget(AnalyticsDashboard $dashboard, array $data, User $actor): AnalyticsWidget
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can create widgets', 403);
        }

        return $this->executeMutation(function () use ($dashboard, $data) {
            return $dashboard->widgets()->create($data);
        });
    }

    /**
     * Update a widget
     */
    public function updateWidget(AnalyticsWidget $widget, array $data, User $actor): AnalyticsWidget
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can update widgets', 403);
        }

        return $this->executeMutation(function () use ($widget, $data) {
            $widget->update($data);
            return $widget->fresh();
        });
    }

    /**
     * Delete a widget
     */
    public function deleteWidget(AnalyticsWidget $widget, User $actor): void
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can delete widgets', 403);
        }

        $this->executeMutation(function () use ($widget) {
            $widget->delete();
        });
    }

    /**
     * Execute a mutation with domain service if available
     */
    private function executeMutation(\Closure $action): mixed
    {
        if ($this->domainActionService) {
            return $this->domainActionService->execute(request(), $action, function () {
                // Super admin bypass
            });
        }
        
        // Fallback to simple transaction
        return DB::transaction($action);
    }
    /**
     * Cache TTL in seconds
     * Reduced for faster updates - analytics should be near real-time
     */
    private const CACHE_TTL = 60; // 1 minute (faster updates for better UX)

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

        return Cache::remember($cacheKey, 30, function () use (
            $organizationId,
            $startDate,
            $endDate
        ) {
            // Unified query: Get all events with module (either in ai_module column or meta->module)
            $baseQuery = Event::where('organization_id', $organizationId)
                ->where(function ($q) {
                    $q->whereNotNull('ai_module')
                      ->orWhereRaw('JSON_EXTRACT(meta, "$.module") IS NOT NULL');
                });

            if ($startDate) {
                $baseQuery->where('occurred_at', '>=', $startDate);
            }
            if ($endDate) {
                $baseQuery->where('occurred_at', '<=', $endDate);
            }

            // Get all events first
            $events = $baseQuery->get();

            // Extract module from either ai_module column or meta->module
            $moduleCounts = [];
            foreach ($events as $event) {
                $module = $event->ai_module ?? ($event->meta['module'] ?? null);
                if (!empty($module)) {
                    if (!isset($moduleCounts[$module])) {
                        $moduleCounts[$module] = 0;
                    }
                    $moduleCounts[$module]++;
                }
            }

            // Convert to array format
            $results = collect($moduleCounts)
                ->map(function ($count, $module) {
                    return [
                        'module' => $module,
                        'count' => (int) $count,
                    ];
                })
                ->values()
                ->sortByDesc('count')
                ->values()
                ->toArray();

            return $results;
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
            $startDate = Carbon::today()->subDays(30)->startOfDay(); // Last 30 days for better data
        }
        if (!$endDate) {
            $endDate = Carbon::today()->endOfDay();
        }

        // Clear cache key for fresh data
        $cacheKey = $this->getCacheKey('by_module', [
            $organizationId,
            $startDate->toDateString(),
            $endDate->toDateString(),
        ]);
        
        // Use shorter cache for module activity (30 seconds for near real-time)
        return Cache::remember($cacheKey, 30, function () use ($organizationId, $startDate, $endDate) {
            return $this->getByModule($organizationId, $startDate, $endDate);
        });
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
