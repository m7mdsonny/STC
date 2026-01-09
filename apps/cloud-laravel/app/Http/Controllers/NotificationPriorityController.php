<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\NotificationPriority;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPriorityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NotificationPriority::query();

        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        return response()->json($query->orderBy('notification_type')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'organization_id' => 'nullable|exists:organizations,id',
            'notification_type' => 'required|string|max:255',
            'priority' => 'required|string',
            'is_critical' => 'nullable|boolean',
        ]);

        $priority = NotificationPriority::create($data);

        return response()->json($priority, 201);
    }

    public function update(Request $request, NotificationPriority $notificationPriority): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'notification_type' => 'sometimes|string|max:255',
            'priority' => 'sometimes|string',
            'is_critical' => 'nullable|boolean',
        ]);

        $notificationPriority->update($data);

        return response()->json($notificationPriority);
    }

    public function destroy(NotificationPriority $notificationPriority): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $notificationPriority->delete();
        return response()->json(['message' => 'Notification priority removed']);
    }
}
