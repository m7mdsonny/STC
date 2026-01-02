<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\SubscriptionPlan;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Helpers\RoleHelper;

class OrganizationSubscriptionController extends Controller
{
    protected SubscriptionService $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }

    /**
     * Get current user's organization subscription details (for clients)
     */
    public function showCurrent(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->organization_id) {
            return response()->json([
                'has_active_subscription' => false,
                'plan' => null,
                'limits' => [
                    'max_cameras' => 0,
                    'max_edge_servers' => 0,
                    'retention_days' => 0,
                ],
                'enabled_modules' => [],
                'subscription_status' => 'none',
            ]);
        }

        $organization = Organization::find($user->organization_id);
        if (!$organization) {
            return response()->json(['message' => 'Organization not found'], 404);
        }

        $details = $this->subscriptionService->getSubscriptionDetails($organization);
        
        return response()->json($details);
    }

    /**
     * Get subscription details for an organization
     */
    public function show(Organization $organization): JsonResponse
    {
        $user = request()->user();
        
        // Authorization check
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if ($user->organization_id !== $organization->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $details = $this->subscriptionService->getSubscriptionDetails($organization);
        
        return response()->json($details);
    }

    /**
     * Assign a subscription plan to an organization
     */
    public function assign(Request $request, Organization $organization): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        $data = $request->validate([
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
            'notes' => 'nullable|string',
        ]);

        $plan = SubscriptionPlan::findOrFail($data['subscription_plan_id']);
        
        $startsAt = $data['starts_at'] ? new \DateTime($data['starts_at']) : null;
        $endsAt = $data['ends_at'] ? new \DateTime($data['ends_at']) : null;

        $subscription = $this->subscriptionService->assignPlan($organization, $plan, $startsAt, $endsAt);
        
        if (isset($data['notes'])) {
            $subscription->update(['notes' => $data['notes']]);
        }

        return response()->json([
            'message' => 'Subscription assigned successfully',
            'subscription' => $subscription->load('subscriptionPlan'),
            'details' => $this->subscriptionService->getSubscriptionDetails($organization),
        ], 201);
    }

    /**
     * Get all subscriptions for an organization
     */
    public function index(Organization $organization): JsonResponse
    {
        $user = request()->user();
        
        // Authorization check
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if ($user->organization_id !== $organization->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $subscriptions = OrganizationSubscription::where('organization_id', $organization->id)
            ->with('subscriptionPlan')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($subscriptions);
    }

    /**
     * Cancel a subscription
     */
    public function cancel(OrganizationSubscription $organizationSubscription): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        
        $organizationSubscription->update(['status' => 'cancelled']);
        
        return response()->json([
            'message' => 'Subscription cancelled',
            'subscription' => $organizationSubscription->load('subscriptionPlan'),
        ]);
    }
}
