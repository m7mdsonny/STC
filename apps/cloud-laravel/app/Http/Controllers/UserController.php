<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\User;
use App\Models\Organization;
use App\Services\PlanEnforcementService;
use App\Exceptions\DomainActionException;
use App\Services\UserAssignmentService;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(private UserAssignmentService $userAssignmentService)
    {
    }

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
        $data = $request->validated();
        $actor = $request->user();

        // PRODUCTION SAFETY: Enforce organization user limits
        $organization = Organization::find($data['organization_id']);
        if ($organization) {
            try {
                $this->planEnforcementService->assertCanCreateUser($organization);
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

        try {
            $user = $this->userAssignmentService->createUser($data, $actor);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        $user->role = RoleHelper::normalize($user->role);
        return response()->json($user, 201);
    }

    public function update(UserUpdateRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        try {
            $user = $this->userAssignmentService->updateUser($user, $data, $request->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        $user->role = RoleHelper::normalize($user->role);

        return response()->json($user);
    }

    public function destroy(User $user): JsonResponse
    {
        // Use Policy for authorization (prevents self-deletion)
        $this->authorize('delete', $user);

        try {
            $this->userAssignmentService->deleteUser($user, request()->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json(['message' => 'User deleted']);
    }

    public function toggleActive(User $user): JsonResponse
    {
        // Use Policy for authorization (prevents self-toggle)
        $this->authorize('toggleActive', $user);

        try {
            $user = $this->userAssignmentService->toggleActive($user, request()->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json($user);
    }

    // SECURITY FIX: resetPassword method removed - use Laravel password reset flow instead
    // This method was a security risk as it returned plaintext passwords in responses
    // Use Laravel's built-in password reset functionality: php artisan make:notification ResetPasswordNotification
}
