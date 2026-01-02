<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Helpers\RoleHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class AlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Event::query()->where('event_type', 'alert');

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

        // Filters - Use 'meta' column (not 'metadata')
        if ($request->filled('status')) {
            $query->where('meta->status', $request->get('status'));
        }

        if ($request->filled('severity')) {
            $query->where('meta->severity', $request->get('severity'));
        }

        if ($request->filled('module')) {
            $query->where('meta->module', $request->get('module'));
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->get('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->get('end_date'));
        }

        $perPage = (int) $request->get('per_page', 15);
        $page = (int) $request->get('page', 1);
        
        $events = $query->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);

        // Transform events to alerts format
        $alerts = $events->getCollection()->map(function ($event) {
            $meta = is_array($event->meta) ? $event->meta : [];
            return [
                'id' => (string) $event->id,
                'title' => $event->title ?? $meta['title'] ?? $meta['message'] ?? 'تنبيه',
                'message' => $event->description ?? $meta['message'] ?? '',
                'severity' => $event->severity ?? $meta['severity'] ?? 'medium',
                'status' => $meta['status'] ?? ($event->resolved_at ? 'resolved' : ($event->acknowledged_at ? 'acknowledged' : 'new')),
                'module' => $meta['module'] ?? null,
                'camera_id' => $event->camera_id ?? null,
                'organization_id' => $event->organization_id ?? null,
                'created_at' => $event->occurred_at ? $event->occurred_at->toISOString() : $event->created_at->toISOString(),
                'updated_at' => $event->updated_at ? $event->updated_at->toISOString() : $event->created_at->toISOString(),
            ];
        });

        return response()->json([
            'data' => $alerts,
            'total' => $events->total(),
            'per_page' => $events->perPage(),
            'current_page' => $events->currentPage(),
            'last_page' => $events->lastPage(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $event = Event::where('event_type', 'alert')->findOrFail($id);
        $meta = is_array($event->meta) ? $event->meta : [];
        
        $alert = [
            'id' => (string) $event->id,
            'title' => $event->title ?? $meta['title'] ?? $meta['message'] ?? 'تنبيه',
            'message' => $event->description ?? $meta['message'] ?? '',
            'severity' => $event->severity ?? $meta['severity'] ?? 'medium',
            'status' => $meta['status'] ?? ($event->resolved_at ? 'resolved' : ($event->acknowledged_at ? 'acknowledged' : 'new')),
            'module' => $meta['module'] ?? null,
            'camera_id' => $event->camera_id ?? null,
            'organization_id' => $event->organization_id ?? null,
            'created_at' => $event->occurred_at ? $event->occurred_at->toISOString() : $event->created_at->toISOString(),
            'updated_at' => $event->updated_at ? $event->updated_at->toISOString() : $event->created_at->toISOString(),
        ];

        return response()->json($alert);
    }

    public function acknowledge(string $id): JsonResponse
    {
        $user = request()->user();
        $event = Event::where('event_type', 'alert')->findOrFail($id);
        
        // Check ownership
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if ($event->organization_id !== (int) $user->organization_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }
        
        $meta = is_array($event->meta) ? $event->meta : [];
        if (!is_array($meta)) {
            $meta = [];
        }
        $meta['status'] = 'acknowledged';
        $meta['acknowledged_by'] = $user->id;
        $event->update([
            'meta' => $meta,
        ]);

        return response()->json(['message' => 'Alert acknowledged']);
    }

    public function resolve(string $id): JsonResponse
    {
        $user = request()->user();
        $event = Event::where('event_type', 'alert')->findOrFail($id);
        
        // Check ownership
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if ($event->organization_id !== (int) $user->organization_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }
        
        $meta = is_array($event->meta) ? $event->meta : [];
        if (!is_array($meta)) {
            $meta = [];
        }
        $meta['status'] = 'resolved';
        $meta['resolved_by'] = $user->id;
        $event->update([
            'meta' => $meta,
        ]);

        return response()->json(['message' => 'Alert resolved']);
    }

    public function markFalseAlarm(string $id): JsonResponse
    {
        $event = Event::where('event_type', 'alert')->findOrFail($id);
        $meta = is_array($event->meta) ? $event->meta : [];
        $meta['status'] = 'false_alarm';
        $event->update(['meta' => $meta]);

        return response()->json(['message' => 'Alert marked as false alarm']);
    }

    public function bulkAcknowledge(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:events,id',
        ]);

        $query = Event::whereIn('id', $data['ids'])
            ->where('event_type', 'alert');

        // Filter by organization
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } elseif (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Update meta field for each event
        $events = $query->get();
        $updated = 0;
        foreach ($events as $event) {
            $meta = is_array($event->meta) ? $event->meta : [];
            if (!is_array($meta)) {
                $meta = [];
            }
            $meta['status'] = 'acknowledged';
            $meta['acknowledged_by'] = $user->id;
            $event->update(['meta' => $meta]);
            $updated++;
        }

        return response()->json([
            'message' => "{$updated} alerts acknowledged",
            'count' => $updated,
        ]);
    }

    public function bulkResolve(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:events,id',
        ]);

        $query = Event::whereIn('id', $data['ids'])
            ->where('event_type', 'alert');

        // Filter by organization
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } elseif (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Update meta field for each event
        $events = $query->get();
        $updated = 0;
        foreach ($events as $event) {
            $meta = is_array($event->meta) ? $event->meta : [];
            if (!is_array($meta)) {
                $meta = [];
            }
            $meta['status'] = 'resolved';
            $meta['resolved_by'] = $user->id;
            $event->update(['meta' => $meta]);
            $updated++;
        }

        return response()->json([
            'message' => "{$updated} alerts resolved",
            'count' => $updated,
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Event::query()->where('event_type', 'alert');

        // Filter by organization
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } elseif (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return response()->json([
                'new' => 0,
                'total' => 0,
                'critical' => 0,
                'high' => 0,
                'today' => 0,
            ]);
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        // Count total alerts
        $total = (clone $query)->count();
        
        // Count new alerts (not acknowledged, not resolved)
        $new = (clone $query)
            ->whereNull('acknowledged_at')
            ->whereNull('resolved_at')
            ->count();

        // Count by severity for mobile app compatibility
        $critical = (clone $query)
            ->where(function ($q) {
                $q->where('severity', 'critical')
                  ->orWhere('meta->severity', 'critical');
            })
            ->count();

        $high = (clone $query)
            ->where(function ($q) {
                $q->where('severity', 'high')
                  ->orWhere('meta->severity', 'high');
            })
            ->count();

        // Count today's alerts
        $today = (clone $query)
            ->whereDate('occurred_at', Carbon::today())
            ->count();

        return response()->json([
            'new' => $new,
            'total' => $total,
            'critical' => $critical,
            'high' => $high,
            'today' => $today,
        ]);
    }
}

