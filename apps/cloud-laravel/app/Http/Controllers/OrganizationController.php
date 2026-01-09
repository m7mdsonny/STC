<?php

namespace App\Http\Controllers;

use App\Models\EdgeServer;
use App\Models\License;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Http\Requests\OrganizationStoreRequest;
use App\Http\Requests\OrganizationUpdateRequest;
use App\Helpers\RoleHelper;
use App\Exceptions\DomainActionException;
use App\Services\OrganizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OrganizationController extends Controller
{
    public function __construct(private OrganizationService $organizationService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Organization::query();

        // SECURITY FIX: Tenant isolation - only super admin can see all organizations
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            // Non-super-admin users can only see their own organization
            if ($user->organization_id) {
                $query->where('id', $user->organization_id);
            } else {
                // User without organization can't see any organizations
                return response()->json(['data' => [], 'total' => 0, 'per_page' => 15, 'current_page' => 1, 'last_page' => 1]);
            }
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->get('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('subscription_plan')) {
            $query->where('subscription_plan', $request->get('subscription_plan'));
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $organizations = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($organizations);
    }

    public function show(Organization $organization): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('view', $organization);
        
        return response()->json($organization);
    }

    public function store(OrganizationStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $organization = $this->organizationService->createOrganization($data, $request->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json($organization, 201);
    }

    public function update(OrganizationUpdateRequest $request, Organization $organization): JsonResponse
    {
        $data = $request->validated();

        try {
            $organization = $this->organizationService->updateOrganization($organization, $data, $request->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json($organization);
    }

    public function destroy(Organization $organization): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('delete', $organization);

        try {
            $this->organizationService->deleteOrganization($organization, request()->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json(['message' => 'Organization deleted']);
    }

    public function toggleActive(Organization $organization): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('toggleActive', $organization);

        try {
            $organization = $this->organizationService->toggleOrganization($organization, request()->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json($organization);
    }

    public function updatePlan(Request $request, Organization $organization): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'subscription_plan' => 'required|string',
            'max_cameras' => 'nullable|integer|min:1',
            'max_edge_servers' => 'nullable|integer|min:1',
        ]);

        try {
            $organization = $this->organizationService->updatePlan($organization, $data, $request->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json($organization);
    }

    public function stats(Organization $organization): JsonResponse
    {
        // Use Policy for authorization (same as view)
        $this->authorize('view', $organization);
        
        return response()->json([
            'users_count' => User::where('organization_id', $organization->id)->count(),
            'edge_servers_count' => EdgeServer::where('organization_id', $organization->id)->count(),
            'cameras_count' => 0,
            'alerts_today' => License::where('organization_id', $organization->id)->count(),
            'storage_used_gb' => 0,
        ]);
    }

    public function uploadLogo(Request $request, Organization $organization): JsonResponse
    {
        $user = $request->user();
        
        // Check if user can manage this organization
        if (!$user->is_super_admin && $user->organization_id !== $organization->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'logo' => 'required|file|mimes:png,jpg,jpeg,svg|max:5120', // 5MB max
        ]);

        $file = $request->file('logo');
        $path = $file->store('public/organizations/logos');
        $url = Storage::url($path);

        $organization->update(['logo_url' => $url]);

        return response()->json([
            'url' => $url,
            'logo_url' => $url,
            'organization' => $organization->fresh(),
        ]);
    }
}
