<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Models\Event;
use App\Models\License;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
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

        return response()->json([
            'total_organizations' => $totalOrganizations,
            'active_organizations' => $activeOrganizations,
            'total_edge_servers' => $totalEdgeServers,
            'online_edge_servers' => $onlineServers,
            'total_cameras' => $totalCameras,
            'alerts_today' => $alertsToday,
            'revenue_this_month' => $revenueThisMonth,
            'total_users' => $totalUsers,
            'active_licenses' => $activeLicenses,
            'organizations_by_plan' => $organizationsByPlan,
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
                'edge_servers' => ['online' => 0, 'total' => 0],
                'cameras' => ['online' => 0, 'total' => 0],
                'alerts' => ['today' => 0, 'unresolved' => 0],
                'attendance' => ['today' => 0, 'late' => 0],
                'visitors' => ['today' => 0, 'trend' => 0],
                'recent_alerts' => [],
                'weekly_stats' => [],
            ]);
        }

        $edgeServers = EdgeServer::where('organization_id', $organizationId)->get();
        $cameras = Camera::where('organization_id', $organizationId)->get();
        $alertsToday = Event::where('organization_id', $organizationId)
            ->whereDate('occurred_at', now()->toDateString())
            ->count();
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

        // Calculate weekly stats (last 7 days)
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::SATURDAY);
        $weeklyStats = [];
        $dayNames = ['السبت', 'الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة'];
        
        for ($i = 0; $i < 7; $i++) {
            $dayStart = $startOfWeek->copy()->addDays($i)->startOfDay();
            $dayEnd = $startOfWeek->copy()->addDays($i)->endOfDay();
            
            $dayAlerts = Event::where('organization_id', $organizationId)
                ->whereBetween('occurred_at', [$dayStart, $dayEnd])
                ->count();
            
            // Visitors count from events with people_counter module
            $dayVisitors = Event::where('organization_id', $organizationId)
                ->whereBetween('occurred_at', [$dayStart, $dayEnd])
                ->where(function ($query) {
                    $query->where('event_type', 'people_detected')
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
        ]);
    }
}
