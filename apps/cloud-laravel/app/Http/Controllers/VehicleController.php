<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\RegisteredVehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = RegisteredVehicle::query();

        // Organization users can only see their org's vehicles
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } elseif (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->get('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('plate_number', 'LIKE', "%{$search}%")
                    ->orWhere('plate_ar', 'LIKE', "%{$search}%")
                    ->orWhere('owner_name', 'LIKE', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $vehicles = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($vehicles);
    }

    public function show(RegisteredVehicle $vehicle): JsonResponse
    {
        $user = request()->user();
        
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $vehicle->organization_id);
        }

        return response()->json($vehicle);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        // Super admin can specify organization
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false) && $request->filled('organization_id')) {
            $organizationId = $request->get('organization_id');
        }
        
        if (!$organizationId) {
            return response()->json(['message' => 'Organization ID is required'], 422);
        }

        // Check permissions
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if (!RoleHelper::canEdit($user->role)) {
                return response()->json(['message' => 'Insufficient permissions'], 403);
            }
            $this->ensureOrganizationAccess($request, $organizationId);
        }

        $data = $request->validate([
            'plate_number' => 'required|string|max:50',
            'plate_ar' => 'nullable|string|max:50',
            'owner_name' => 'nullable|string|max:255',
            'vehicle_type' => 'nullable|string|max:50',
            'vehicle_color' => 'nullable|string|max:50',
            'category' => 'required|string|in:employee,vip,visitor,delivery,blacklist',
            'is_active' => 'nullable|boolean',
        ]);

        $vehicle = RegisteredVehicle::create([
            ...$data,
            'organization_id' => $organizationId,
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        return response()->json($vehicle, 201);
    }

    public function update(Request $request, RegisteredVehicle $vehicle): JsonResponse
    {
        $user = $request->user();

        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess($request, $vehicle->organization_id);
            if (!RoleHelper::canEdit($user->role)) {
                return response()->json(['message' => 'Insufficient permissions'], 403);
            }
        }

        $data = $request->validate([
            'plate_number' => 'sometimes|string|max:50',
            'plate_ar' => 'nullable|string|max:50',
            'owner_name' => 'nullable|string|max:255',
            'vehicle_type' => 'nullable|string|max:50',
            'vehicle_color' => 'nullable|string|max:50',
            'category' => 'sometimes|string|in:employee,vip,visitor,delivery,blacklist',
            'is_active' => 'nullable|boolean',
        ]);

        $data['updated_by'] = $user->id;
        $vehicle->update($data);

        return response()->json($vehicle);
    }

    public function destroy(RegisteredVehicle $vehicle): JsonResponse
    {
        $user = request()->user();

        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $vehicle->organization_id);
            if (!RoleHelper::canManageOrganization($user->role)) {
                return response()->json(['message' => 'Insufficient permissions'], 403);
            }
        }

        $vehicle->delete();

        return response()->json(['message' => 'Vehicle deleted']);
    }

    public function toggleActive(RegisteredVehicle $vehicle): JsonResponse
    {
        $user = request()->user();

        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $vehicle->organization_id);
            if (!RoleHelper::canEdit($user->role)) {
                return response()->json(['message' => 'Insufficient permissions'], 403);
            }
        }

        $vehicle->is_active = !$vehicle->is_active;
        $vehicle->save();

        return response()->json($vehicle);
    }

    public function getAccessLogs(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = \App\Models\VehicleAccessLog::query();

        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        }

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->get('vehicle_id'));
        }

        if ($request->filled('camera_id')) {
            $query->where('camera_id', $request->get('camera_id'));
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->get('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->get('to'));
        }

        $perPage = (int) $request->get('per_page', 15);
        $logs = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($logs);
    }
}

