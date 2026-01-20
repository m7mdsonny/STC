<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EdgeServer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnalyticsDebugController extends Controller
{
    /**
     * Debug endpoint to check analytics pipeline status
     */
    public function pipelineStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        $stats = [
            'organization_id' => $organizationId,
            'total_events' => Event::where('organization_id', $organizationId)->count(),
            'events_with_ai_module' => Event::where('organization_id', $organizationId)
                ->whereNotNull('ai_module')
                ->count(),
            'events_with_meta_module' => Event::where('organization_id', $organizationId)
                ->whereRaw('JSON_EXTRACT(meta, "$.module") IS NOT NULL')
                ->count(),
            'events_by_module' => Event::where('organization_id', $organizationId)
                ->whereNotNull('ai_module')
                ->selectRaw('ai_module, COUNT(*) as count')
                ->groupBy('ai_module')
                ->get()
                ->pluck('count', 'ai_module')
                ->toArray(),
            'recent_events' => Event::where('organization_id', $organizationId)
                ->orderByDesc('occurred_at')
                ->limit(10)
                ->get()
                ->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'event_type' => $event->event_type,
                        'ai_module' => $event->ai_module,
                        'meta_module' => $event->meta['module'] ?? null,
                        'occurred_at' => $event->occurred_at?->toIso8601String(),
                        'organization_id' => $event->organization_id,
                    ];
                })
                ->toArray(),
            'edge_servers' => EdgeServer::where('organization_id', $organizationId)
                ->get()
                ->map(function ($edge) {
                    return [
                        'id' => $edge->id,
                        'edge_key' => $edge->edge_key,
                        'online' => $edge->online,
                    ];
                })
                ->toArray(),
        ];

        return response()->json($stats);
    }

    /**
     * Test query to verify analytics queries work
     */
    public function testQuery(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        // Test the exact query used in getByModule
        $baseQuery = Event::where('organization_id', $organizationId)
            ->where(function ($q) {
                $q->whereNotNull('ai_module')
                  ->orWhereRaw('JSON_EXTRACT(meta, "$.module") IS NOT NULL');
            });

        $events = $baseQuery->get();

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

        return response()->json([
            'total_events_found' => $events->count(),
            'modules_found' => count($moduleCounts),
            'module_activity' => $results,
            'sample_events' => $events->take(5)->map(function ($event) {
                return [
                    'id' => $event->id,
                    'ai_module' => $event->ai_module,
                    'meta_module' => $event->meta['module'] ?? null,
                    'occurred_at' => $event->occurred_at?->toIso8601String(),
                ];
            })->toArray(),
        ]);
    }
}
