<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\AiModule;
use App\Models\AiModuleConfig;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Models\Event;
use App\Models\License;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function admin(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        $totalOrganizations = Organization::count();
        $activeOrganizations = Organization::where('is_active', true)->count();
        $totalEdgeServers = EdgeServer::count();
        $onlineServers = EdgeServer::where('online', true)->count();
        $totalCameras = Camera::count();
        $alertsToday = Event::whereDate('occurred_at', now()->toDateString())->count();
        $totalUsers = User::count();
        $activeLicenses = License::where('status', 'active')->count();

        // Calculate revenue from active licenses
        $revenueThisMonth = License::where('status', 'active')
            ->whereNotNull('subscription_plan_id')
            ->with('subscriptionPlan')
            ->get()
            ->sum(function ($license) {
                return $license->subscriptionPlan?->price_monthly ?? 0;
            });

        // Organizations by plan distribution
        $organizationsByPlan = Organization::select('subscription_plan', DB::raw('count(*) as count'))
            ->groupBy('subscription_plan')
            ->get()
            ->map(function ($item) {
                return [
                    'plan' => $item->subscription_plan ?? 'none',
                    'count' => $item->count,
                ];
            });

        // Calculate revenue previous month
        $revenuePreviousMonth = License::where('status', 'active')
            ->whereNotNull('subscription_plan_id')
            ->with('subscriptionPlan')
            ->get()
            ->sum(function ($license) {
                return $license->subscriptionPlan?->price_monthly ?? 0;
            }); // Same as current month for now (TODO: track historical data)

        // Calculate revenue year total
        $revenueYearTotal = License::where('status', 'active')
            ->whereNotNull('subscription_plan_id')
            ->with('subscriptionPlan')
            ->get()
            ->sum(function ($license) {
                $monthlyPrice = $license->subscriptionPlan?->price_monthly ?? 0;
                // Estimate year total from current month (multiply by 12)
                // TODO: Track actual historical revenue
                return $monthlyPrice * 12;
            });

        // Module status summary
        $moduleStatus = $this->getModuleStatusSummary();

        // Last activity timestamps
        $lastActivity = $this->getLastActivityTimestamps();

        // Error/warning summary (from logs - approximate)
        $errorSummary = $this->getErrorSummary();

        // System health status
        $systemHealth = $this->getSystemHealthStatus();

        return response()->json([
            'total_organizations' => $totalOrganizations,
            'active_organizations' => $activeOrganizations,
            'total_edge_servers' => $totalEdgeServers,
            'online_edge_servers' => $onlineServers,
            'total_cameras' => $totalCameras,
            'alerts_today' => $alertsToday,
            'revenue_this_month' => $revenueThisMonth,
            'revenue_previous_month' => $revenuePreviousMonth,
            'revenue_year_total' => $revenueYearTotal,
            'total_users' => $totalUsers,
            'active_licenses' => $activeLicenses,
            'organizations_by_plan' => $organizationsByPlan,
            'module_status' => $moduleStatus,
            'last_activity' => $lastActivity,
            'error_summary' => $errorSummary,
            'system_health' => $systemHealth,
        ]);
    }

    public function organization(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json([
                'organization_name' => null,
                'edge_servers' => ['online' => 0, 'total' => 0],
                'cameras' => ['online' => 0, 'total' => 0],
                'alerts' => ['today' => 0, 'unresolved' => 0],
                'attendance' => ['today' => 0, 'late' => 0],
                'visitors' => ['today' => 0, 'trend' => 0],
                'recent_alerts' => [],
                'weekly_stats' => [],
            ]);
        }

        // Fetch organization name
        $organization = Organization::find($organizationId);

        $edgeServers = EdgeServer::where('organization_id', $organizationId)->get();
        $cameras = Camera::where('organization_id', $organizationId)->get();
        // Use AnalyticsService for better performance and caching
        $alertsToday = $this->analyticsService->getTodayAlertsCount($organizationId);
        $unresolvedAlerts = Event::where('organization_id', $organizationId)
            ->whereNull('resolved_at')
            ->count();
        $recentAlerts = Event::where('organization_id', $organizationId)
            ->orderByDesc('occurred_at')
            ->limit(10)
            ->get()
            ->map(function ($event) {
                $meta = $event->meta ?? [];
                if (!is_array($meta)) {
                    $meta = is_string($meta) ? json_decode($meta, true) : [];
                }
                return [
                    'id' => (string) $event->id,
                    'module' => $meta['module'] ?? 'unknown',
                    'event_type' => $event->event_type ?? 'unknown',
                    'severity' => $event->severity ?? 'medium',
                    'title' => $event->title ?? $meta['title'] ?? $event->event_type ?? 'تنبيه',
                    'created_at' => $event->occurred_at ? $event->occurred_at->toISOString() : now()->toISOString(),
                    'status' => $event->resolved_at ? 'resolved' : ($event->acknowledged_at ? 'acknowledged' : 'new'),
                ];
            });

        // Calculate weekly stats (last 7 days) using AnalyticsService
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::SATURDAY);
        $weeklyTrend = $this->analyticsService->getWeeklyTrend($organizationId);
        $dayNames = ['السبت', 'الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة'];
        
        $weeklyStats = [];
        for ($i = 0; $i < 7; $i++) {
            $dayStart = $startOfWeek->copy()->addDays($i)->startOfDay();
            $dayDate = $dayStart->format('Y-m-d');
            
            // Find matching period in trend data
            $dayAlerts = 0;
            foreach ($weeklyTrend as $trendItem) {
                if (str_starts_with($trendItem['period'], $dayDate)) {
                    $dayAlerts = $trendItem['count'];
                    break;
                }
            }
            
            // Visitors count from events with people_counter module
            $dayVisitors = Event::where('organization_id', $organizationId)
                ->whereBetween('occurred_at', [$dayStart, $dayStart->copy()->endOfDay()])
                ->where(function ($query) {
                    $query->where('event_type', 'people_detected')
                        ->orWhere('ai_module', 'people_counter')
                        ->orWhereJsonContains('meta->module', 'people_counter');
                })
                ->count();
            
            $weeklyStats[] = [
                'day' => $dayNames[$i],
                'alerts' => $dayAlerts,
                'visitors' => $dayVisitors,
            ];
        }

        // Calculate visitors today (from people_counter events)
        $visitorsToday = Event::where('organization_id', $organizationId)
            ->whereDate('occurred_at', now()->toDateString())
            ->where(function ($query) {
                $query->where('event_type', 'people_detected')
                    ->orWhereJsonContains('meta->module', 'people_counter');
            })
            ->count();

        // Calculate visitors yesterday for trend
        $visitorsYesterday = Event::where('organization_id', $organizationId)
            ->whereDate('occurred_at', now()->subDay()->toDateString())
            ->where(function ($query) {
                $query->where('event_type', 'people_detected')
                    ->orWhereJsonContains('meta->module', 'people_counter');
            })
            ->count();

        $visitorsTrend = $visitorsYesterday > 0 
            ? round((($visitorsToday - $visitorsYesterday) / $visitorsYesterday) * 100, 1)
            : 0;

        return response()->json([
            'organization_name' => $organization?->name ?? null,
            'edge_servers' => [
                'online' => $edgeServers->where('online', true)->count(),
                'total' => $edgeServers->count(),
            ],
            'cameras' => [
                'online' => $cameras->where('status', 'online')->count(),
                'total' => $cameras->count(),
            ],
            'alerts' => [
                'today' => $alertsToday,
                'unresolved' => $unresolvedAlerts,
            ],
            'attendance' => [
                'today' => 0, // TODO: Implement attendance tracking
                'late' => 0,  // TODO: Implement attendance tracking
            ],
            'visitors' => [
                'today' => $visitorsToday,
                'trend' => $visitorsTrend,
            ],
            'recent_alerts' => $recentAlerts,
            'weekly_stats' => $weeklyStats,
            'module_status' => $this->getOrganizationModuleStatus($organizationId),
            'last_activity' => $this->getOrganizationLastActivity($organizationId),
            'error_summary' => $this->getOrganizationErrorSummary($organizationId),
        ]);
    }

    /**
     * Get module status summary (admin dashboard)
     */
    private function getModuleStatusSummary(): array
    {
        $modules = AiModule::where('is_active', true)->get();
        $moduleStatus = [
            'active' => 0,
            'disabled' => 0,
            'broken' => 0,
            'total' => $modules->count(),
        ];

        foreach ($modules as $module) {
            $configs = AiModuleConfig::where('module_id', $module->id)->get();
            if ($configs->isEmpty()) {
                $moduleStatus['disabled']++;
            } else {
                // Check if any config has errors (simplified check)
                $hasErrors = $configs->where('is_enabled', false)->count() > 0;
                if ($hasErrors) {
                    $moduleStatus['broken']++;
                } else {
                    $moduleStatus['active']++;
                }
            }
        }

        return $moduleStatus;
    }

    /**
     * Get last activity timestamps (admin dashboard)
     */
    private function getLastActivityTimestamps(): array
    {
        $lastUserLogin = User::whereNotNull('last_login_at')
            ->orderByDesc('last_login_at')
            ->value('last_login_at');

        $lastEdgeServerSync = EdgeServer::whereNotNull('last_seen_at')
            ->orderByDesc('last_seen_at')
            ->value('last_seen_at');

        $lastEvent = Event::orderByDesc('occurred_at')
            ->value('occurred_at');

        return [
            'last_user_login' => $lastUserLogin ? Carbon::parse($lastUserLogin)->toISOString() : null,
            'last_edge_server_sync' => $lastEdgeServerSync ? Carbon::parse($lastEdgeServerSync)->toISOString() : null,
            'last_event' => $lastEvent ? Carbon::parse($lastEvent)->toISOString() : null,
        ];
    }

    /**
     * Get error summary (admin dashboard)
     */
    private function getErrorSummary(): array
    {
        // Count errors from events with high severity
        $criticalErrors = Event::where('severity', 'critical')
            ->whereDate('occurred_at', '>=', now()->subDays(7))
            ->count();

        $highErrors = Event::where('severity', 'high')
            ->whereDate('occurred_at', '>=', now()->subDays(7))
            ->count();

        // Count unresolved alerts
        $unresolvedAlerts = Event::whereNull('resolved_at')
            ->whereDate('occurred_at', '>=', now()->subDays(7))
            ->count();

        return [
            'critical_errors' => $criticalErrors,
            'high_errors' => $highErrors,
            'unresolved_alerts' => $unresolvedAlerts,
            'total_errors' => $criticalErrors + $highErrors,
        ];
    }

    /**
     * Get system health status (admin dashboard)
     */
    private function getSystemHealthStatus(): array
    {
        try {
            // Check database connection
            DB::connection()->getPdo();
            $databaseStatus = 'healthy';
            $databaseLatency = 0;
        } catch (\Exception $e) {
            $databaseStatus = 'unhealthy';
            $databaseLatency = -1;
        }

        // Check edge servers online ratio
        $totalServers = EdgeServer::count();
        $onlineServers = EdgeServer::where('online', true)->count();
        $serverHealth = $totalServers > 0 
            ? ($onlineServers / $totalServers) * 100 
            : 100;

        return [
            'database' => [
                'status' => $databaseStatus,
                'latency_ms' => $databaseLatency,
            ],
            'edge_servers' => [
                'status' => $serverHealth >= 80 ? 'healthy' : ($serverHealth >= 50 ? 'degraded' : 'unhealthy'),
                'online_ratio' => round($serverHealth, 2),
            ],
            'overall' => $databaseStatus === 'healthy' && $serverHealth >= 80 ? 'healthy' : 'degraded',
        ];
    }

    /**
     * Get organization module status
     */
    private function getOrganizationModuleStatus(int $organizationId): array
    {
        // Get module configs for this organization
        $moduleConfigs = AiModuleConfig::where('organization_id', $organizationId)->get();

        $modules = AiModule::where('is_active', true)->get();
        $moduleStatus = [];

        foreach ($modules as $module) {
            $configs = $moduleConfigs->where('module_id', $module->id);
            $enabledCount = $configs->where('is_enabled', true)->count();
            $totalCount = $configs->count();

            $moduleStatus[] = [
                'module_id' => $module->id,
                'module_name' => $module->name,
                'display_name' => $module->display_name_ar ?? $module->display_name,
                'status' => $totalCount === 0 ? 'disabled' : ($enabledCount > 0 ? 'active' : 'broken'),
                'enabled_count' => $enabledCount,
                'total_count' => $totalCount,
            ];
        }

        return $moduleStatus;
    }

    /**
     * Get organization last activity
     */
    private function getOrganizationLastActivity(int $organizationId): array
    {
        $lastEvent = Event::where('organization_id', $organizationId)
            ->orderByDesc('occurred_at')
            ->value('occurred_at');

        $lastServerSync = EdgeServer::where('organization_id', $organizationId)
            ->whereNotNull('last_seen_at')
            ->orderByDesc('last_seen_at')
            ->value('last_seen_at');

        $lastCameraUpdate = Camera::where('organization_id', $organizationId)
            ->orderByDesc('updated_at')
            ->value('updated_at');

        return [
            'last_event' => $lastEvent ? Carbon::parse($lastEvent)->toISOString() : null,
            'last_server_sync' => $lastServerSync ? Carbon::parse($lastServerSync)->toISOString() : null,
            'last_camera_update' => $lastCameraUpdate ? Carbon::parse($lastCameraUpdate)->toISOString() : null,
        ];
    }

    /**
     * Get organization error summary
     */
    private function getOrganizationErrorSummary(int $organizationId): array
    {
        $criticalErrors = Event::where('organization_id', $organizationId)
            ->where('severity', 'critical')
            ->whereDate('occurred_at', '>=', now()->subDays(7))
            ->count();

        $highErrors = Event::where('organization_id', $organizationId)
            ->where('severity', 'high')
            ->whereDate('occurred_at', '>=', now()->subDays(7))
            ->count();

        $unresolvedAlerts = Event::where('organization_id', $organizationId)
            ->whereNull('resolved_at')
            ->whereDate('occurred_at', '>=', now()->subDays(7))
            ->count();

        return [
            'critical_errors' => $criticalErrors,
            'high_errors' => $highErrors,
            'unresolved_alerts' => $unresolvedAlerts,
            'total_errors' => $criticalErrors + $highErrors,
        ];
    }
}
