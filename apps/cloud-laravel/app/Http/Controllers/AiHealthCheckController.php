<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Event;
use App\Models\EdgeServer;
use App\Services\AnalyticsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * AI System Health Check Controller
 * 
 * Provides monitoring and validation endpoints for AI modules performance
 * across all cameras and Edge servers.
 */
class AiHealthCheckController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Overall AI system health check
     * 
     * Returns health status for all AI modules, Edge servers, and cameras
     */
    public function overall(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        // Get health metrics
        $moduleHealth = $this->getModuleHealth($organizationId);
        $edgeHealth = $this->getEdgeServerHealth($organizationId);
        $eventHealth = $this->getEventIngestionHealth($organizationId);
        
        // Calculate overall status
        $overallStatus = 'healthy';
        $issues = [];
        
        if ($moduleHealth['status'] === 'warning' || $edgeHealth['status'] === 'warning' || $eventHealth['status'] === 'warning') {
            $overallStatus = 'warning';
        }
        
        if ($moduleHealth['status'] === 'critical' || $edgeHealth['status'] === 'critical' || $eventHealth['status'] === 'critical') {
            $overallStatus = 'critical';
        }

        return response()->json([
            'status' => $overallStatus,
            'timestamp' => now()->toIso8601String(),
            'modules' => $moduleHealth,
            'edge_servers' => $edgeHealth,
            'event_ingestion' => $eventHealth,
            'issues' => $issues,
        ]);
    }

    /**
     * Get health status for all AI modules
     */
    public function modules(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        $moduleHealth = $this->getModuleHealth($organizationId);

        return response()->json($moduleHealth);
    }

    /**
     * Get health status for a specific AI module
     */
    public function module(Request $request, string $moduleId): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        $moduleMetrics = $this->getModuleMetrics($organizationId, $moduleId);

        return response()->json([
            'module_id' => $moduleId,
            'status' => $moduleMetrics['status'],
            'metrics' => $moduleMetrics,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get module health status with metrics
     */
    private function getModuleHealth(int $organizationId): array
    {
        $allModules = [
            'face', 'counter', 'fire', 'intrusion', 'vehicle',
            'attendance', 'loitering', 'crowd', 'object', 'market'
        ];

        $moduleStats = [];
        $activeModules = 0;
        $inactiveModules = 0;
        $totalEvents = 0;
        $last24Hours = now()->subDay();

        foreach ($allModules as $moduleId) {
            $stats = $this->getModuleMetrics($organizationId, $moduleId);
            $moduleStats[$moduleId] = $stats;
            
            if ($stats['events_last_24h'] > 0) {
                $activeModules++;
                $totalEvents += $stats['events_last_24h'];
            } else {
                $inactiveModules++;
            }
        }

        // Determine overall status
        $status = 'healthy';
        if ($activeModules === 0) {
            $status = 'critical'; // No modules active
        } elseif ($inactiveModules > $activeModules) {
            $status = 'warning'; // More inactive than active
        }

        return [
            'status' => $status,
            'total_modules' => count($allModules),
            'active_modules' => $activeModules,
            'inactive_modules' => $inactiveModules,
            'total_events_last_24h' => $totalEvents,
            'modules' => $moduleStats,
        ];
    }

    /**
     * Get metrics for a specific module
     */
    private function getModuleMetrics(int $organizationId, string $moduleId): array
    {
        $last24Hours = now()->subDay();
        $lastHour = now()->subHour();

        $eventsLast24h = Event::where('organization_id', $organizationId)
            ->where('ai_module', $moduleId)
            ->where('occurred_at', '>=', $last24Hours)
            ->count();

        $eventsLastHour = Event::where('organization_id', $organizationId)
            ->where('ai_module', $moduleId)
            ->where('occurred_at', '>=', $lastHour)
            ->count();

        $lastEvent = Event::where('organization_id', $organizationId)
            ->where('ai_module', $moduleId)
            ->orderByDesc('occurred_at')
            ->first();

        $avgConfidence = Event::where('organization_id', $organizationId)
            ->where('ai_module', $moduleId)
            ->where('occurred_at', '>=', $last24Hours)
            ->whereNotNull('meta->confidence')
            ->avg(DB::raw('CAST(JSON_EXTRACT(meta, "$.confidence") AS DECIMAL(5,2))'));

        $criticalEvents = Event::where('organization_id', $organizationId)
            ->where('ai_module', $moduleId)
            ->where('severity', 'critical')
            ->where('occurred_at', '>=', $last24Hours)
            ->count();

        // Determine status
        $status = 'healthy';
        $lastEventMinutesAgo = $lastEvent ? now()->diffInMinutes($lastEvent->occurred_at) : 9999;
        
        if ($eventsLast24h === 0 && $lastEventMinutesAgo > 1440) { // No events in 24h+
            $status = 'inactive';
        } elseif ($lastEventMinutesAgo > 120) { // No events in 2h+
            $status = 'warning';
        } elseif ($criticalEvents > 10) { // Too many critical events
            $status = 'warning';
        }

        return [
            'status' => $status,
            'events_last_24h' => $eventsLast24h,
            'events_last_hour' => $eventsLastHour,
            'last_event_at' => $lastEvent?->occurred_at?->toIso8601String(),
            'last_event_minutes_ago' => $lastEventMinutesAgo,
            'avg_confidence' => $avgConfidence ? round($avgConfidence, 2) : null,
            'critical_events_24h' => $criticalEvents,
        ];
    }

    /**
     * Get Edge server health status
     */
    private function getEdgeServerHealth(int $organizationId): array
    {
        $edgeServers = EdgeServer::where('organization_id', $organizationId)->get();
        
        $onlineServers = 0;
        $offlineServers = 0;
        $serverDetails = [];

        foreach ($edgeServers as $server) {
            $isOnline = $server->last_seen_at && 
                       now()->diffInMinutes($server->last_seen_at) < 5;
            
            if ($isOnline) {
                $onlineServers++;
            } else {
                $offlineServers++;
            }

            $serverDetails[] = [
                'id' => $server->id,
                'name' => $server->name,
                'online' => $isOnline,
                'last_seen_at' => $server->last_seen_at?->toIso8601String(),
            ];
        }

        $status = 'healthy';
        if ($offlineServers > 0 && $onlineServers === 0) {
            $status = 'critical';
        } elseif ($offlineServers > 0) {
            $status = 'warning';
        }

        return [
            'status' => $status,
            'total_servers' => $edgeServers->count(),
            'online_servers' => $onlineServers,
            'offline_servers' => $offlineServers,
            'servers' => $serverDetails,
        ];
    }

    /**
     * Get event ingestion health
     */
    private function getEventIngestionHealth(int $organizationId): array
    {
        $last24Hours = now()->subDay();
        $lastHour = now()->subHour();

        $eventsLast24h = Event::where('organization_id', $organizationId)
            ->where('occurred_at', '>=', $last24Hours)
            ->count();

        $eventsLastHour = Event::where('organization_id', $organizationId)
            ->where('occurred_at', '>=', $lastHour)
            ->count();

        $lastEvent = Event::where('organization_id', $organizationId)
            ->orderByDesc('occurred_at')
            ->first();

        $lastEventMinutesAgo = $lastEvent ? now()->diffInMinutes($lastEvent->occurred_at) : 9999;

        $status = 'healthy';
        if ($eventsLastHour === 0 && $lastEventMinutesAgo > 120) {
            $status = 'critical'; // No events in last 2 hours
        } elseif ($eventsLastHour === 0) {
            $status = 'warning'; // No events in last hour
        }

        return [
            'status' => $status,
            'events_last_24h' => $eventsLast24h,
            'events_last_hour' => $eventsLastHour,
            'last_event_at' => $lastEvent?->occurred_at?->toIso8601String(),
            'last_event_minutes_ago' => $lastEventMinutesAgo,
        ];
    }

    /**
     * Get performance metrics for AI modules
     */
    public function performance(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;
        
        $last24Hours = now()->subDay();

        $performance = DB::table('events')
            ->where('organization_id', $organizationId)
            ->where('occurred_at', '>=', $last24Hours)
            ->whereNotNull('ai_module')
            ->select([
                'ai_module',
                DB::raw('COUNT(*) as total_events'),
                DB::raw('COUNT(DISTINCT camera_id) as cameras_count'),
                DB::raw('AVG(CASE WHEN JSON_EXTRACT(meta, "$.confidence") IS NOT NULL THEN CAST(JSON_EXTRACT(meta, "$.confidence") AS DECIMAL(5,2)) ELSE NULL END) as avg_confidence'),
                DB::raw('SUM(CASE WHEN severity = "critical" THEN 1 ELSE 0 END) as critical_count'),
                DB::raw('SUM(CASE WHEN severity = "warning" THEN 1 ELSE 0 END) as warning_count'),
            ])
            ->groupBy('ai_module')
            ->get()
            ->map(function ($row) {
                return [
                    'module' => $row->ai_module,
                    'total_events' => (int) $row->total_events,
                    'cameras_count' => (int) $row->cameras_count,
                    'avg_confidence' => $row->avg_confidence ? round($row->avg_confidence, 2) : null,
                    'critical_count' => (int) $row->critical_count,
                    'warning_count' => (int) $row->warning_count,
                ];
            })
            ->toArray();

        return response()->json([
            'period' => 'last_24_hours',
            'modules' => $performance,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
