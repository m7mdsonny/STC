<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\RegisteredFace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = RegisteredFace::query();

        // Organization users can only see their org's people
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

        if ($request->filled('department')) {
            $query->where('department', $request->get('department'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->get('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('person_name', 'LIKE', "%{$search}%")
                    ->orWhere('employee_id', 'LIKE', "%{$search}%")
                    ->orWhere('department', 'LIKE', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $people = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($people);
    }

    public function show(RegisteredFace $person): JsonResponse
    {
        $user = request()->user();
        
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $person->organization_id);
        }

        return response()->json($person);
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
            'person_name' => 'required|string|max:255',
            'employee_id' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:255',
            'category' => 'required|string|in:employee,vip,visitor,blacklist',
            'photo_url' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $person = RegisteredFace::create([
            ...$data,
            'organization_id' => $organizationId,
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        return response()->json($person, 201);
    }

    public function update(Request $request, RegisteredFace $person): JsonResponse
    {
        $user = $request->user();

        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess($request, $person->organization_id);
            if (!RoleHelper::canEdit($user->role)) {
                return response()->json(['message' => 'Insufficient permissions'], 403);
            }
        }

        $data = $request->validate([
            'person_name' => 'sometimes|string|max:255',
            'employee_id' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:255',
            'category' => 'sometimes|string|in:employee,vip,visitor,blacklist',
            'photo_url' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $data['updated_by'] = $user->id;
        $person->update($data);

        return response()->json($person);
    }

    public function destroy(RegisteredFace $person): JsonResponse
    {
        $user = request()->user();

        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $person->organization_id);
            if (!RoleHelper::canManageOrganization($user->role)) {
                return response()->json(['message' => 'Insufficient permissions'], 403);
            }
        }

        $person->delete();

        return response()->json(['message' => 'Person deleted']);
    }

    public function toggleActive(RegisteredFace $person): JsonResponse
    {
        $user = request()->user();

        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $person->organization_id);
            if (!RoleHelper::canEdit($user->role)) {
                return response()->json(['message' => 'Insufficient permissions'], 403);
            }
        }

        $person->is_active = !$person->is_active;
        $person->save();

        return response()->json($person);
    }

    public function uploadPhoto(Request $request, RegisteredFace $person): JsonResponse
    {
        $user = request()->user();

        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $person->organization_id);
        }

        $request->validate([
            'photo' => 'required|file|mimes:jpg,jpeg,png|max:5120', // 5MB max
        ]);

        $file = $request->file('photo');
        $path = $file->store('public/people/photos');
        $url = \Storage::url($path);

        $person->update(['photo_url' => $url]);

        return response()->json(['url' => $url, 'person' => $person]);
    }

    public function getDepartments(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = RegisteredFace::query();

        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        }

        $departments = $query->whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->filter()
            ->values();

        return response()->json($departments);
    }
}

