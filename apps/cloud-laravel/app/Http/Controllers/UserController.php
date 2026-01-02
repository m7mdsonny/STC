<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\User;
use App\Models\Organization;
use App\Services\PlanEnforcementService;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = User::query();

        // Super admin can see all users
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            // Organization users can only see users in their organization
            if ($user->organization_id) {
                $query->where('organization_id', $user->organization_id);
            } else {
                // User without organization can't see any users
                return response()->json(['data' => [], 'total' => 0]);
            }
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        if ($request->filled('role')) {
            $normalizedRole = RoleHelper::normalize($request->get('role'));
            $query->where('role', $normalizedRole);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->get('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = (int) $request->get('per_page', 15);
        $users = $query->orderByDesc('created_at')->paginate($perPage);

        // Normalize roles in response
        $users->getCollection()->transform(function ($u) {
            $u->role = RoleHelper::normalize($u->role);
            return $u;
        });

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('view', $user);

        $user->role = RoleHelper::normalize($user->role);
        return response()->json($user);
    }

    public function store(UserStoreRequest $request): JsonResponse
    {
        // Authorization is handled by UserStoreRequest
        $data = $request->validated();

        // Normalize role
        $data['role'] = RoleHelper::normalize($data['role']);

        // Ensure organization_id is set for non-super-admin roles
        if ($data['role'] !== RoleHelper::SUPER_ADMIN && empty($data['organization_id'])) {
            return response()->json(['message' => 'Organization is required for this role'], 422);
        }

        // Check quota enforcement for organization users
        if ($data['role'] !== RoleHelper::SUPER_ADMIN && !empty($data['organization_id'])) {
            try {
                $org = Organization::findOrFail($data['organization_id']);
                $enforcementService = app(PlanEnforcementService::class);
                $enforcementService->assertCanCreateUser($org);
            } catch (\Exception $e) {
                return response()->json([
                    'message' => $e->getMessage()
                ], 403);
            }
        }

        $user = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
        ]);

        $user->role = RoleHelper::normalize($user->role);
        return response()->json($user, 201);
    }

    public function update(UserUpdateRequest $request, User $user): JsonResponse
    {
        // Authorization is handled by UserUpdateRequest
        $data = $request->validated();

        // Normalize role if provided
        if (isset($data['role'])) {
            $data['role'] = RoleHelper::normalize($data['role']);
        }

        $user->update($data);
        $user->role = RoleHelper::normalize($user->role);

        return response()->json($user);
    }

    public function destroy(User $user): JsonResponse
    {
        // Use Policy for authorization (prevents self-deletion)
        $this->authorize('delete', $user);

        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function toggleActive(User $user): JsonResponse
    {
        // Use Policy for authorization (prevents self-toggle)
        $this->authorize('toggleActive', $user);

        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json($user);
    }

    // SECURITY FIX: resetPassword method removed - use Laravel password reset flow instead
    // This method was a security risk as it returned plaintext passwords in responses
    // Use Laravel's built-in password reset functionality: php artisan make:notification ResetPasswordNotification
}
