<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\Event;
use App\Models\Camera;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MarketController extends Controller
{
    /**
     * Get Market dashboard statistics
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json([
                'total_events' => 0,
                'today_events' => 0,
                'high_risk_count' => 0,
                'critical_risk_count' => 0,
                'risk_distribution' => [],
                'recent_events' => [],
            ]);
        }

        // Query Market module events only
        $baseQuery = Event::where('organization_id', $organizationId)
            ->where('meta->module', 'market');

        // Total events
        $totalEvents = (clone $baseQuery)->count();

        // Today's events
        $todayEvents = (clone $baseQuery)
            ->whereDate('occurred_at', now()->toDateString())
            ->count();

        // Risk distribution
        $events = (clone $baseQuery)
            ->whereDate('occurred_at', '>=', now()->subDays(30))
            ->get();

        $riskDistribution = [
            'low' => 0,
            'medium' => 0,
            'high' => 0,
            'critical' => 0,
        ];

        $highRiskCount = 0;
        $criticalRiskCount = 0;

        foreach ($events as $event) {
            $meta = is_array($event->meta) ? $event->meta : [];
            $riskLevel = $meta['risk_level'] ?? 'low';
            
            if (isset($riskDistribution[$riskLevel])) {
                $riskDistribution[$riskLevel]++;
            }
            
            if ($riskLevel === 'high') {
                $highRiskCount++;
            } elseif ($riskLevel === 'critical') {
                $criticalRiskCount++;
            }
        }

        // Recent events (last 20)
        $recentEvents = (clone $baseQuery)
            ->orderByDesc('occurred_at')
            ->limit(20)
            ->get()
            ->map(function ($event) {
                $meta = is_array($event->meta) ? $event->meta : [];
                return [
                    'id' => (string) $event->id,
                    'event_type' => $meta['event_type'] ?? 'suspicious_behavior',
                    'risk_score' => $meta['risk_score'] ?? 0,
                    'risk_level' => $meta['risk_level'] ?? 'low',
                    'camera_id' => $meta['camera_id'] ?? null,
                    'track_id' => $meta['track_id'] ?? null,
                    'occurred_at' => $event->occurred_at ? $event->occurred_at->toISOString() : now()->toISOString(),
                    'snapshot_url' => $meta['snapshot_url'] ?? null,
                    'confidence' => $meta['confidence'] ?? 0,
                ];
            });

        return response()->json([
            'total_events' => $totalEvents,
            'today_events' => $todayEvents,
            'high_risk_count' => $highRiskCount,
            'critical_risk_count' => $criticalRiskCount,
            'risk_distribution' => $riskDistribution,
            'recent_events' => $recentEvents,
        ]);
    }

    /**
     * Get Market events with filters
     */
    public function events(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Event::query()
            ->where('meta->module', 'market');

        // Filter by organization
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } elseif (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return response()->json(['data' => [], 'total' => 0, 'per_page' => 15, 'current_page' => 1, 'last_page' => 1]);
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        // Filters
        if ($request->filled('risk_level')) {
            $query->where('meta->risk_level', $request->get('risk_level'));
        }

        if ($request->filled('camera_id')) {
            $query->where('meta->camera_id', $request->get('camera_id'));
        }

        if ($request->filled('start_date')) {
            $query->where('occurred_at', '>=', $request->get('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('occurred_at', '<=', $request->get('end_date'));
        }

        $perPage = (int) $request->get('per_page', 15);
        $page = (int) $request->get('page', 1);
        
        $events = $query->orderByDesc('occurred_at')->paginate($perPage, ['*'], 'page', $page);

        // Transform events
        $marketEvents = $events->getCollection()->map(function ($event) {
            $meta = is_array($event->meta) ? $event->meta : [];
            return [
                'id' => (string) $event->id,
                'event_type' => $meta['event_type'] ?? 'suspicious_behavior',
                'risk_score' => $meta['risk_score'] ?? 0,
                'risk_level' => $meta['risk_level'] ?? 'low',
                'camera_id' => $meta['camera_id'] ?? null,
                'track_id' => $meta['track_id'] ?? null,
                'occurred_at' => $event->occurred_at ? $event->occurred_at->toISOString() : $event->created_at->toISOString(),
                'snapshot_url' => $meta['snapshot_url'] ?? null,
                'confidence' => $meta['confidence'] ?? 0,
                'title' => $meta['title'] ?? 'Suspicious Behavior Detected',
                'description' => $meta['description'] ?? '',
            ];
        });

        return response()->json([
            'data' => $marketEvents,
            'total' => $events->total(),
            'per_page' => $events->perPage(),
            'current_page' => $events->currentPage(),
            'last_page' => $events->lastPage(),
        ]);
    }

    /**
     * Get single Market event
     */
    public function show(string $id): JsonResponse
    {
        $user = request()->user();
        $event = Event::where('meta->module', 'market')->findOrFail($id);
        
        // Check ownership
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if ($event->organization_id !== (int) $user->organization_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $meta = is_array($event->meta) ? $event->meta : [];
        
        $marketEvent = [
            'id' => (string) $event->id,
            'event_type' => $meta['event_type'] ?? 'suspicious_behavior',
            'risk_score' => $meta['risk_score'] ?? 0,
            'risk_level' => $meta['risk_level'] ?? 'low',
            'camera_id' => $meta['camera_id'] ?? null,
            'track_id' => $meta['track_id'] ?? null,
            'occurred_at' => $event->occurred_at ? $event->occurred_at->toISOString() : $event->created_at->toISOString(),
            'snapshot_url' => $meta['snapshot_url'] ?? null,
            'confidence' => $meta['confidence'] ?? 0,
            'title' => $meta['title'] ?? 'Suspicious Behavior Detected',
            'description' => $meta['description'] ?? '',
            'actions' => $meta['actions'] ?? [],
        ];

        return response()->json($marketEvent);
    }
}
