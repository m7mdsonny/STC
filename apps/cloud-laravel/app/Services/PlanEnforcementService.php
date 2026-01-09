<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\License;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\Camera;
use App\Models\EdgeServer;
use Illuminate\Support\Facades\Log;

class PlanEnforcementService
{
    /**
     * Assert that organization can create a new user
     * 
     * @param Organization $org
     * @return void
     * @throws \Exception
     */
    public function assertCanCreateUser(Organization $org): void
    {
        $quota = $this->getUserQuota($org);
        
        if ($quota === null) {
            // No quota limit (unlimited)
            return;
        }
        
        $currentUsage = $this->getCurrentUserCount($org);
        
        if ($currentUsage >= $quota) {
            throw new \Exception(
                "User quota exceeded. Current: {$currentUsage}, Limit: {$quota}. " .
                "Please upgrade your subscription plan or contact support."
            );
        }
    }

    /**
     * Assert that organization can create a new camera
     * 
     * @param Organization $org
     * @return void
     * @throws \Exception
     */
    public function assertCanCreateCamera(Organization $org): void
    {
        $quota = $this->getCameraQuota($org);
        
        if ($quota === null) {
            // No quota limit (unlimited)
            return;
        }
        
        $currentUsage = $this->getCurrentCameraCount($org);
        
        if ($currentUsage >= $quota) {
            throw new \Exception(
                "Camera quota exceeded. Current: {$currentUsage}, Limit: {$quota}. " .
                "Please upgrade your subscription plan or contact support."
            );
        }
    }

    /**
     * Assert that organization can create a new edge server
     * 
     * @param Organization $org
     * @return void
     * @throws \Exception
     */
    public function assertCanCreateEdge(Organization $org): void
    {
        $quota = $this->getEdgeServerQuota($org);
        
        if ($quota === null) {
            // No quota limit (unlimited)
            return;
        }
        
        $currentUsage = $this->getCurrentEdgeServerCount($org);
        
        if ($currentUsage >= $quota) {
            throw new \Exception(
                "Edge server quota exceeded. Current: {$currentUsage}, Limit: {$quota}. " .
                "Please upgrade your subscription plan or contact support."
            );
        }
    }

    /**
     * Get current usage statistics for organization
     * 
     * @param Organization $org
     * @return array
     */
    public function getCurrentUsage(Organization $org): array
    {
        return [
            'users' => [
                'current' => $this->getCurrentUserCount($org),
                'quota' => $this->getUserQuota($org),
            ],
            'cameras' => [
                'current' => $this->getCurrentCameraCount($org),
                'quota' => $this->getCameraQuota($org),
            ],
            'edge_servers' => [
                'current' => $this->getCurrentEdgeServerCount($org),
                'quota' => $this->getEdgeServerQuota($org),
            ],
        ];
    }

    /**
     * Get user quota for organization
     * Note: Currently, user quotas are not enforced in the database schema
     * This method returns null (unlimited) for now
     * 
     * @param Organization $org
     * @return int|null Returns null if unlimited
     */
    private function getUserQuota(Organization $org): ?int
    {
        // User quotas are not currently defined in the schema
        // Return null (unlimited) for now
        // TODO: Add max_users to subscription_plans and licenses tables if needed
        return null;
    }

    /**
     * Get camera quota for organization
     * Priority: License > Organization plan > Organization direct limit
     * 
     * @param Organization $org
     * @return int|null Returns null if unlimited
     */
    private function getCameraQuota(Organization $org): ?int
    {
        // Check active licenses first (highest quota wins)
        $licenseQuota = $this->getMaxQuotaFromLicenses($org, 'max_cameras');
        if ($licenseQuota !== null) {
            return $licenseQuota;
        }

        // Check organization's subscription plan
        if ($org->subscription_plan) {
            $plan = SubscriptionPlan::where('name', $org->subscription_plan)->first();
            if ($plan && isset($plan->max_cameras) && $plan->max_cameras > 0) {
                return $plan->max_cameras;
            }
        }

        // Check organization's direct limit (if set)
        if (isset($org->max_cameras) && $org->max_cameras > 0) {
            return $org->max_cameras;
        }

        // No limit (unlimited)
        return null;
    }

    /**
     * Get edge server quota for organization
     * Priority: License > Organization plan > Organization direct limit
     * 
     * @param Organization $org
     * @return int|null Returns null if unlimited
     */
    private function getEdgeServerQuota(Organization $org): ?int
    {
        // Check active licenses first (highest quota wins)
        $licenseQuota = $this->getMaxQuotaFromLicenses($org, 'max_edge_servers');
        if ($licenseQuota !== null) {
            return $licenseQuota;
        }

        // Check organization's subscription plan
        if ($org->subscription_plan) {
            $plan = SubscriptionPlan::where('name', $org->subscription_plan)->first();
            if ($plan && isset($plan->max_edge_servers) && $plan->max_edge_servers > 0) {
                return $plan->max_edge_servers;
            }
        }

        // Check organization's direct limit (if set)
        if (isset($org->max_edge_servers) && $org->max_edge_servers > 0) {
            return $org->max_edge_servers;
        }

        // No limit (unlimited)
        return null;
    }

    /**
     * Get maximum quota from active licenses
     * Returns the highest quota from all active licenses
     * 
     * @param Organization $org
     * @param string $quotaType 'max_users', 'max_cameras', or 'max_edge_servers'
     * @return int|null Returns null if no active licenses or no quota set
     */
    private function getMaxQuotaFromLicenses(Organization $org, string $quotaType): ?int
    {
        $activeLicenses = License::where('organization_id', $org->id)
            ->where('status', 'active')
            ->whereNotNull($quotaType)
            ->get();

        if ($activeLicenses->isEmpty()) {
            return null;
        }

        // Return the highest quota from all active licenses
        $maxQuota = $activeLicenses->max($quotaType);
        
        return $maxQuota > 0 ? $maxQuota : null;
    }

    /**
     * Get current user count for organization
     * 
     * @param Organization $org
     * @return int
     */
    private function getCurrentUserCount(Organization $org): int
    {
        return User::where('organization_id', $org->id)
            ->where('is_active', true)
            ->count();
    }

    /**
     * Get current camera count for organization
     * 
     * @param Organization $org
     * @return int
     */
    private function getCurrentCameraCount(Organization $org): int
    {
        return Camera::where('organization_id', $org->id)
            ->where('status', '!=', 'deleted')
            ->count();
    }

    /**
     * Get current edge server count for organization
     * 
     * @param Organization $org
     * @return int
     */
    private function getCurrentEdgeServerCount(Organization $org): int
    {
        return EdgeServer::where('organization_id', $org->id)->count();
    }
}
