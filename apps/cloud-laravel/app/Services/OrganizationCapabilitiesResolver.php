<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use App\Services\PlanEnforcementService;

class OrganizationCapabilitiesResolver
{
    public function ensureEdgeServerCreation(User $actor, int $organizationId): Organization
    {
        $organization = Organization::find($organizationId);
        if (!$organization) {
            throw new DomainActionException('Organization not found', 404);
        }

        $this->ensureOrganizationAccess($actor, $organization);

        $planEnforcer = app(PlanEnforcementService::class);
        $planEnforcer->assertCanCreateEdge($organization);

        return $organization;
    }

    public function ensureCameraCreation(User $actor, int $organizationId): Organization
    {
        $organization = Organization::find($organizationId);
        if (!$organization) {
            throw new DomainActionException('Organization not found', 404);
        }

        $this->ensureOrganizationAccess($actor, $organization);

        $planEnforcer = app(PlanEnforcementService::class);
        $planEnforcer->assertCanCreateCamera($organization);

        return $organization;
    }

    public function ensureLicenseCreation(User $actor, int $organizationId): Organization
    {
        $organization = Organization::find($organizationId);
        if (!$organization) {
            throw new DomainActionException('Organization not found', 404);
        }

        $this->ensureOrganizationAccess($actor, $organization, true);

        return $organization;
    }

    public function ensureUserAssignment(User $actor, int $organizationId): Organization
    {
        $organization = Organization::find($organizationId);
        if (!$organization) {
            throw new DomainActionException('Organization not found', 404);
        }

        $this->ensureOrganizationAccess($actor, $organization, true);

        return $organization;
    }

    /**
     * Generic organization mutation guard used by DomainActionService
     */
    public function ensureOrganizationCanMutate(int $organizationId): Organization
    {
        $organization = Organization::find($organizationId);

        if (!$organization) {
            throw new DomainActionException('Organization not found', 404);
        }

        if (!$organization->is_active) {
            throw new DomainActionException('Organization is inactive', 403);
        }

        return $organization;
    }

    private function ensureOrganizationAccess(User $actor, Organization $organization, bool $allowAdmin = false): void
    {
        if (RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            return;
        }

        if ($allowAdmin && RoleHelper::canManageOrganization($actor->role) && $actor->organization_id === $organization->id) {
            return;
        }

        if ($actor->organization_id !== $organization->id) {
            Log::warning('Capability denied for organization', [
                'user_id' => $actor->id,
                'organization_id' => $organization->id,
                'role' => $actor->role,
            ]);
            throw new DomainActionException('You are not allowed to manage this organization', 403);
        }
    }
}
