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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

    public function show(Request $request, $id): JsonResponse
    {
        $origin = $request->header('Origin');
        $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
        $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : 'https://stcsolutions.online';
        
        $corsHeaders = [
            'Access-Control-Allow-Origin' => $allowedOrigin,
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
            'Access-Control-Allow-Credentials' => 'true',
        ];

        try {
            $user = $request->user();
            if (!$user) {
                \Log::warning('Unauthenticated organization view attempt', ['organization_id' => $id]);
                return response()->json(['message' => 'Unauthenticated'], 401)->withHeaders($corsHeaders);
            }

            // Find organization - check both active and soft-deleted
            $organization = Organization::withTrashed()->find($id);
            
            if (!$organization) {
                \Log::warning('Organization not found', [
                    'organization_id' => $id,
                    'user_id' => $user->id,
                    'user_org_id' => $user->organization_id,
                ]);
                
                // CRITICAL FIX: If user's organization_id matches requested ID but org doesn't exist,
                // the organization was deleted - clear user's organization_id immediately
                if ($user->organization_id && (int) $user->organization_id === (int) $id) {
                    \Log::info('Clearing organization_id from user - organization was deleted', [
                        'user_id' => $user->id,
                        'organization_id' => $id,
                    ]);
                    try {
                        $user->organization_id = null;
                        $user->save();
                    } catch (\Exception $e) {
                        \Log::error('Failed to clear organization_id from user', [
                            'user_id' => $user->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
                
                return response()->json(['message' => 'Organization not found'], 404)->withHeaders($corsHeaders);
            }

            // Check if organization is soft deleted
            if ($organization->trashed()) {
                // If user belongs to this organization, allow them to see it (even if deleted)
                // This prevents errors in settings page
                if ($user->organization_id && (int) $user->organization_id === (int) $organization->id) {
                    \Log::info('Loading soft-deleted organization for user', [
                        'organization_id' => $id,
                        'user_id' => $user->id,
                    ]);
                    // Return the organization but mark it as deleted
                    $orgData = $organization->toArray();
                    $orgData['is_deleted'] = true;
                    return response()->json($orgData)->withHeaders($corsHeaders);
                }
                
                // Only super admin can view other soft-deleted organizations
                if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
                    \Log::warning('Attempt to view soft-deleted organization (not user\'s org)', [
                        'organization_id' => $id,
                        'user_id' => $user->id,
                    ]);
                    return response()->json(['message' => 'Organization not found'], 404)->withHeaders($corsHeaders);
                }
            }

            // Use Policy for authorization
            try {
                $this->authorize('view', $organization);
            } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
                \Log::warning('Unauthorized view attempt', [
                    'organization_id' => $id,
                    'user_id' => $user->id,
                    'user_org_id' => $user->organization_id,
                    'org_id' => $organization->id,
                ]);
                
                return response()->json(['message' => 'Unauthorized'], 403)->withHeaders($corsHeaders);
            }

            \Log::info('Organization loaded successfully', [
                'organization_id' => $organization->id,
                'user_id' => $user->id,
            ]);
            
            return response()->json($organization)->withHeaders($corsHeaders);
            
        } catch (\Exception $e) {
            \Log::error('Error loading organization', [
                'organization_id' => $id,
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to load organization',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500)->withHeaders($corsHeaders);
        }
    }

    public function store(OrganizationStoreRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            // Only super admin can create organizations
            if (!RoleHelper::isSuperAdmin($request->user()->role, $request->user()->is_super_admin ?? false)) {
                return response()->json(['message' => 'Only super admin can create organizations'], 403);
            }

            $plan = SubscriptionPlan::where('name', $data['subscription_plan'])->first();
            if (!$plan) {
                return response()->json(['message' => 'Invalid subscription plan'], 422);
            }

            // BUSINESS LOGIC: Camera and server limits ALWAYS come from plan
            $data['max_cameras'] = $plan->max_cameras ?? 8;
            $data['max_edge_servers'] = $plan->max_edge_servers ?? 1;

            DB::beginTransaction();

            $organization = Organization::create($data);

            // Create SMS quota
            if ($plan && property_exists($plan, 'sms_quota')) {
                $organization->smsQuota()->create([
                    'monthly_limit' => $plan->sms_quota ?? 0,
                    'used_this_month' => 0,
                ]);
            }

            // BUSINESS LOGIC: Auto-create license for the organization
            // Licenses are auto-generated based on the organization's subscription plan
            $license = License::create([
                'organization_id' => $organization->id,
                'plan' => $data['subscription_plan'],
                'license_key' => Str::uuid()->toString(),
                'status' => 'active',
                'max_cameras' => $data['max_cameras'],
                'max_edge_servers' => $data['max_edge_servers'],
                'modules' => ['fire', 'face', 'counter', 'vehicle'], // Default modules
                'expires_at' => now()->addYear(), // 1 year expiry
                'activated_at' => now(),
            ]);

            DB::commit();

            \Log::info('Auto-created license for organization', [
                'organization_id' => $organization->id,
                'license_id' => $license->id,
                'license_key' => $license->license_key,
            ]);

            return response()->json($organization->load('licenses'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create organization', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to create organization: ' . $e->getMessage()
            ], 500);
        }
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
        try {
            $this->authorize('delete', $organization);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            \Log::warning('Unauthorized delete attempt', [
                'organization_id' => $organization->id,
                'user_id' => request()->user()?->id,
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            if (!$organization->exists) {
                return response()->json(['message' => 'Organization not found'], 404);
            }

            DB::beginTransaction();
            
            // CRITICAL FIX: Soft delete all users in this organization
            // This prevents users from trying to access deleted organization
            $usersCount = User::where('organization_id', $organization->id)->count();
            if ($usersCount > 0) {
                \Log::info('Soft deleting users in organization', [
                    'organization_id' => $organization->id,
                    'users_count' => $usersCount,
                ]);
                User::where('organization_id', $organization->id)->delete();
            }
            
            // Soft delete organization
            $organization->delete();
            
            DB::commit();
            
            \Log::info("Organization deleted successfully", [
                'organization_id' => $organization->id,
                'users_deleted' => $usersCount,
            ]);
            
            $origin = request()->header('Origin');
            $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
            $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : 'https://stcsolutions.online';
            
            return response()->json(['message' => 'Deleted successfully'], 200)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token')
                ->header('Access-Control-Allow-Credentials', 'true');
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            \Log::error("Failed to delete organization {$organization->id}: " . $e->getMessage());
            
            $origin = request()->header('Origin');
            $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
            $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : 'https://stcsolutions.online';
            
            $status = $e->getCode() == 23000 ? 422 : 500;
            $message = $e->getCode() == 23000 
                ? 'فشل الحذف: لا يمكن حذف المؤسسة لوجود سجلات مرتبطة بها'
                : 'فشل الحذف: ' . $e->getMessage();
            
            return response()->json(['error' => $message], $status)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token')
                ->header('Access-Control-Allow-Credentials', 'true');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Failed to delete organization {$organization->id}: " . $e->getMessage());
            
            $origin = request()->header('Origin');
            $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
            $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : 'https://stcsolutions.online';
            
            return response()->json(['error' => 'فشل الحذف: ' . $e->getMessage()], 500)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token')
                ->header('Access-Control-Allow-Credentials', 'true');
        }
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
        $request->validate([
            'logo' => 'required|file|mimes:png,jpg,jpeg,svg|max:5120', // 5MB max
        ]);

        try {
            $result = $this->organizationService->uploadLogo(
                $organization,
                $request->file('logo'),
                $request->user()
            );
            return response()->json($result);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }
}
