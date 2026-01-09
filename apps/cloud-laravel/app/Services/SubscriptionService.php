<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\Log;

class SubscriptionService
{
    /**
     * Get the active subscription for an organization
     */
    public function getActiveSubscription(Organization $organization): ?OrganizationSubscription
    {
        return OrganizationSubscription::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->latest()
            ->with('subscriptionPlan')
            ->first();
    }

    /**
     * Get the effective subscription plan for an organization
     * Falls back to organization's subscription_plan field if no active subscription exists
     */
    public function getEffectivePlan(Organization $organization): ?SubscriptionPlan
    {
        $subscription = $this->getActiveSubscription($organization);
        
        if ($subscription && $subscription->subscriptionPlan) {
            return $subscription->subscriptionPlan;
        }

        // Fallback to organization's subscription_plan field (backward compatibility)
        if ($organization->subscription_plan) {
            return SubscriptionPlan::where('name', $organization->subscription_plan)->first();
        }

        return null;
    }

    /**
     * Check if organization can perform an action based on subscription limits
     */
    public function checkLimit(Organization $organization, string $limitType, int $currentCount = 0): array
    {
        $plan = $this->getEffectivePlan($organization);
        
        if (!$plan) {
            return [
                'allowed' => false,
                'message' => 'No active subscription plan found',
                'limit' => 0,
                'current' => $currentCount,
            ];
        }

        $limit = match ($limitType) {
            'cameras' => $plan->max_cameras ?? 0,
            'edge_servers' => $plan->max_edge_servers ?? 0,
            default => 0,
        };

        $allowed = $limit === 0 || $currentCount < $limit;

        return [
            'allowed' => $allowed,
            'message' => $allowed ? 'Limit check passed' : "Limit exceeded: {$currentCount}/{$limit}",
            'limit' => $limit,
            'current' => $currentCount,
        ];
    }

    /**
     * Check if a module is enabled for the organization's plan
     */
    public function isModuleEnabled(Organization $organization, string $module): bool
    {
        $plan = $this->getEffectivePlan($organization);
        
        if (!$plan) {
            return false;
        }

        $modules = $plan->available_modules ?? [];
        
        return in_array($module, $modules);
    }

    /**
     * Assert that organization can create a camera (throws exception if limit exceeded)
     */
    public function assertCanCreateCamera(Organization $organization): void
    {
        $currentCount = \App\Models\Camera::where('organization_id', $organization->id)
            ->where('status', '!=', 'deleted')
            ->count();
        
        $check = $this->checkLimit($organization, 'cameras', $currentCount);
        
        if (!$check['allowed']) {
            throw new \Exception($check['message']);
        }
    }

    /**
     * Assert that organization can create an edge server (throws exception if limit exceeded)
     */
    public function assertCanCreateEdge(Organization $organization): void
    {
        $currentCount = \App\Models\EdgeServer::where('organization_id', $organization->id)
            ->count();
        
        $check = $this->checkLimit($organization, 'edge_servers', $currentCount);
        
        if (!$check['allowed']) {
            throw new \Exception($check['message']);
        }
    }

    /**
     * Assert that a module is enabled for the organization (throws exception if disabled)
     */
    public function assertModuleEnabled(Organization $organization, string $module): void
    {
        if (!$this->isModuleEnabled($organization, $module)) {
            throw new \Exception("Module '{$module}' is not enabled for your organization's subscription plan");
        }
    }

    /**
     * Get subscription details for an organization (for API responses)
     */
    public function getSubscriptionDetails(Organization $organization): array
    {
        $subscription = $this->getActiveSubscription($organization);
        $plan = $this->getEffectivePlan($organization);

        if (!$plan) {
            return [
                'has_active_subscription' => false,
                'plan' => null,
                'limits' => [
                    'max_cameras' => 0,
                    'max_edge_servers' => 0,
                    'retention_days' => 0,
                ],
                'enabled_modules' => [],
                'subscription_status' => 'none',
            ];
        }

        return [
            'has_active_subscription' => $subscription !== null,
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'name_ar' => $plan->name_ar,
            ],
            'limits' => [
                'max_cameras' => $plan->max_cameras ?? 0,
                'max_edge_servers' => $plan->max_edge_servers ?? 0,
                'retention_days' => $plan->retention_days ?? 30,
                'sms_quota' => $plan->sms_quota ?? 0,
            ],
            'enabled_modules' => $plan->available_modules ?? [],
            'subscription_status' => $subscription?->status ?? 'legacy',
            'starts_at' => $subscription?->starts_at?->toISOString(),
            'ends_at' => $subscription?->ends_at?->toISOString(),
        ];
    }

    /**
     * Assign a subscription plan to an organization
     */
    public function assignPlan(
        Organization $organization,
        SubscriptionPlan $plan,
        ?\DateTime $startsAt = null,
        ?\DateTime $endsAt = null
    ): OrganizationSubscription {
        // Cancel any existing active subscriptions
        OrganizationSubscription::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);

        // Create new subscription
        $subscription = OrganizationSubscription::create([
            'organization_id' => $organization->id,
            'subscription_plan_id' => $plan->id,
            'starts_at' => $startsAt ?? now(),
            'ends_at' => $endsAt,
            'status' => 'active',
        ]);

        // Update organization's subscription_plan field for backward compatibility
        $organization->update([
            'subscription_plan' => $plan->name,
            'max_cameras' => $plan->max_cameras,
            'max_edge_servers' => $plan->max_edge_servers,
        ]);

        Log::info("Subscription assigned", [
            'organization_id' => $organization->id,
            'plan_id' => $plan->id,
            'subscription_id' => $subscription->id,
        ]);

        return $subscription;
    }
}
