<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Analytics Debug Controller
 * Helps diagnose analytics pipeline issues
 */
class AnalyticsDebugController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get analytics pipeline status
     */
    public function pipelineStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        // Check last 24 hours
        $last24h = Carbon::now()->subDay();
        $last7d = Carbon::now()->subDays(7);

        // Total events
        $totalEvents = Event::where('organization_id', $organizationId)->count();
        $last24hEvents = Event::where('organization_id', $organizationId)
            ->where('occurred_at', '>=', $last24h)
            ->count();
        $last7dEvents = Event::where('organization_id', $organizationId)
            ->where('occurred_at', '>=', $last7d)
            ->count();

        // Events with ai_module
        $eventsWithModule = Event::where('organization_id', $organizationId)
            ->whereNotNull('ai_module')
            ->count();
        $last24hWithModule = Event::where('organization_id', $organizationId)
            ->whereNotNull('ai_module')
            ->where('occurred_at', '>=', $last24h)
            ->count();

        // Analytics events
        $analyticsEvents = Event::where('organization_id', $organizationId)
            ->where('event_type', 'analytics')
            ->count();
        $last24hAnalytics = Event::where('organization_id', $organizationId)
            ->where('event_type', 'analytics')
            ->where('occurred_at', '>=', $last24h)
            ->count();

        // Module breakdown
        $moduleBreakdown = Event::where('organization_id', $organizationId)
            ->whereNotNull('ai_module')
            ->where('occurred_at', '>=', $last24h)
            ->selectRaw('ai_module, COUNT(*) as count')
            ->groupBy('ai_module')
            ->orderByDesc('count')
            ->get()
            ->map(fn($item) => [
                'module' => $item->ai_module,
                'count' => (int) $item->count,
            ]);

        // Recent events sample (last 10)
        $recentEvents = Event::where('organization_id', $organizationId)
            ->where('occurred_at', '>=', $last24h)
            ->orderByDesc('occurred_at')
            ->limit(10)
            ->get(['id', 'event_type', 'ai_module', 'camera_id', 'occurred_at', 'meta'])
            ->map(function ($event) {
                $meta = $event->meta ?? [];
                return [
                    'id' => $event->id,
                    'event_type' => $event->event_type,
                    'ai_module' => $event->ai_module,
                    'camera_id' => $event->camera_id,
                    'occurred_at' => $event->occurred_at,
                    'meta_has_module' => isset($meta['module']),
                    'meta_module' => $meta['module'] ?? null,
                ];
            });

        return response()->json([
            'organization_id' => $organizationId,
            'statistics' => [
                'total_events' => $totalEvents,
                'last_24h_events' => $last24hEvents,
                'last_7d_events' => $last7dEvents,
                'events_with_ai_module' => $eventsWithModule,
                'last_24h_with_module' => $last24hWithModule,
                'analytics_events' => $analyticsEvents,
                'last_24h_analytics' => $last24hAnalytics,
            ],
            'module_breakdown_24h' => $moduleBreakdown,
            'recent_events_sample' => $recentEvents,
            'pipeline_health' => [
                'events_received' => $last24hEvents > 0,
                'analytics_events_received' => $last24hAnalytics > 0,
                'ai_module_populated' => $last24hWithModule > 0,
                'module_data_available' => $moduleBreakdown->isNotEmpty(),
            ],
        ]);
    }

    /**
     * Test analytics query
     */
    public function testQuery(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        $startDate = $request->filled('start_date') 
            ? Carbon::parse($request->get('start_date')) 
            : Carbon::today()->subDays(30)->startOfDay();
        $endDate = $request->filled('end_date') 
            ? Carbon::parse($request->get('end_date')) 
            : Carbon::today()->endOfDay();

        // Test getModuleActivity
        $moduleActivity = $this->analyticsService->getModuleActivity(
            $organizationId,
            $startDate,
            $endDate
        );

        // Test getByModule
        $byModule = $this->analyticsService->getByModule(
            $organizationId,
            $startDate,
            $endDate
        );

        // Raw SQL query
        $rawQuery = Event::where('organization_id', $organizationId)
            ->whereNotNull('ai_module')
            ->where('occurred_at', '>=', $startDate)
            ->where('occurred_at', '<=', $endDate)
            ->selectRaw('ai_module, COUNT(*) as count')
            ->groupBy('ai_module')
            ->orderByDesc('count')
            ->get();

        return response()->json([
            'date_range' => [
                'start' => $startDate->toIso8601String(),
                'end' => $endDate->toIso8601String(),
            ],
            'module_activity_service' => $moduleActivity,
            'by_module_service' => $byModule,
            'raw_sql_result' => $rawQuery->map(fn($item) => [
                'module' => $item->ai_module,
                'count' => (int) $item->count,
            ]),
            'total_events_in_range' => Event::where('organization_id', $organizationId)
                ->where('occurred_at', '>=', $startDate)
                ->where('occurred_at', '<=', $endDate)
                ->count(),
            'events_with_module_in_range' => Event::where('organization_id', $organizationId)
                ->whereNotNull('ai_module')
                ->where('occurred_at', '>=', $startDate)
                ->where('occurred_at', '<=', $endDate)
                ->count(),
        ]);
    }
}
