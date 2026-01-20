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
        try {
            $user = $request->user();
            $organizationId = $user?->organization_id ?? $request->get('organization_id');

            if (!$organizationId) {
                return response()->json(['error' => 'Organization ID required'], 400);
            }

            try {
                $totalEvents = Event::where('organization_id', $organizationId)->count();
                $eventsWithAiModule = Event::where('organization_id', $organizationId)
                    ->whereNotNull('ai_module')
                    ->count();
                $eventsWithMetaModule = Event::where('organization_id', $organizationId)
                    ->whereRaw('JSON_EXTRACT(meta, "$.module") IS NOT NULL')
                    ->count();
                
                $eventsByModule = [];
                try {
                    $eventsByModule = Event::where('organization_id', $organizationId)
                        ->whereNotNull('ai_module')
                        ->selectRaw('ai_module, COUNT(*) as count')
                        ->groupBy('ai_module')
                        ->get()
                        ->pluck('count', 'ai_module')
                        ->toArray();
                } catch (\Exception $e) {
                    Log::warning('Error getting events by module', ['error' => $e->getMessage()]);
                }

                $recentEvents = [];
                try {
                    $recentEvents = Event::where('organization_id', $organizationId)
                        ->orderByDesc('occurred_at')
                        ->limit(10)
                        ->get()
                        ->map(function ($event) {
                            return [
                                'id' => $event->id,
                                'event_type' => $event->event_type,
                                'ai_module' => $event->ai_module,
                                'meta_module' => is_array($event->meta) ? ($event->meta['module'] ?? null) : null,
                                'occurred_at' => $event->occurred_at?->toIso8601String(),
                                'organization_id' => $event->organization_id,
                            ];
                        })
                        ->toArray();
                } catch (\Exception $e) {
                    Log::warning('Error getting recent events', ['error' => $e->getMessage()]);
                }

                $edgeServers = [];
                try {
                    $edgeServers = EdgeServer::where('organization_id', $organizationId)
                        ->get()
                        ->map(function ($edge) {
                            return [
                                'id' => $edge->id,
                                'edge_key' => $edge->edge_key,
                                'online' => $edge->online,
                            ];
                        })
                        ->toArray();
                } catch (\Exception $e) {
                    Log::warning('Error getting edge servers', ['error' => $e->getMessage()]);
                }

                return response()->json([
                    'organization_id' => $organizationId,
                    'total_events' => $totalEvents,
                    'events_with_ai_module' => $eventsWithAiModule,
                    'events_with_meta_module' => $eventsWithMetaModule,
                    'events_by_module' => $eventsByModule,
                    'recent_events' => $recentEvents,
                    'edge_servers' => $edgeServers,
                ]);
            } catch (\Exception $e) {
                Log::error('Error in pipelineStatus', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'organization_id' => $organizationId,
                ]);
                return response()->json([
                    'error' => 'Failed to get pipeline status',
                    'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Fatal error in pipelineStatus', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Fatal error',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Test query to verify analytics queries work
     */
    public function testQuery(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $organizationId = $user?->organization_id ?? $request->get('organization_id');

            if (!$organizationId) {
                return response()->json(['error' => 'Organization ID required'], 400);
            }

            try {
                // Test the exact query used in getByModule
                $baseQuery = Event::where('organization_id', $organizationId)
                    ->where(function ($q) {
                        $q->whereNotNull('ai_module')
                          ->orWhereRaw('JSON_EXTRACT(meta, "$.module") IS NOT NULL');
                    });

                $events = $baseQuery->get();

                $moduleCounts = [];
                foreach ($events as $event) {
                    $meta = is_array($event->meta) ? $event->meta : [];
                    $module = $event->ai_module ?? ($meta['module'] ?? null);
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

                $sampleEvents = [];
                foreach ($events->take(5) as $event) {
                    $meta = is_array($event->meta) ? $event->meta : [];
                    $sampleEvents[] = [
                        'id' => $event->id,
                        'ai_module' => $event->ai_module,
                        'meta_module' => $meta['module'] ?? null,
                        'occurred_at' => $event->occurred_at?->toIso8601String(),
                    ];
                }

                return response()->json([
                    'total_events_found' => $events->count(),
                    'modules_found' => count($moduleCounts),
                    'module_activity' => $results,
                    'sample_events' => $sampleEvents,
                ]);
            } catch (\Exception $e) {
                Log::error('Error in testQuery', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'organization_id' => $organizationId,
                ]);
                return response()->json([
                    'error' => 'Failed to execute test query',
                    'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Fatal error in testQuery', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Fatal error',
                'message' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
