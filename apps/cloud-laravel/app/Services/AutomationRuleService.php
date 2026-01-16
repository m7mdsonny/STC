<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\AutomationRule;
use App\Models\Integration;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AutomationRuleService
{
    public function __construct(
        private DomainActionService $domainActionService,
        private OrganizationCapabilitiesResolver $capabilities,
    ) {
    }

    /**
     * Create a new automation rule
     */
    public function createRule(array $data, User $actor): AutomationRule
    {
        $organizationId = $data['organization_id'] ?? $actor->organization_id;
        
        if (!$organizationId) {
            throw new DomainActionException('Organization ID is required', 422);
        }

        // Check permissions
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            if (!RoleHelper::canEdit($actor->role)) {
                throw new DomainActionException('Insufficient permissions to create automation rules', 403);
            }
            if ($actor->organization_id !== (int) $organizationId) {
                throw new DomainActionException('Cannot create rules for other organizations', 403);
            }
        }

        // Verify integration belongs to organization if provided
        if (isset($data['integration_id'])) {
            $integration = Integration::findOrFail($data['integration_id']);
            if ($integration->organization_id !== (int) $organizationId) {
                throw new DomainActionException('Integration does not belong to your organization', 403);
            }
        }

        return $this->domainActionService->execute(request(), function () use ($data, $organizationId) {
            $rule = AutomationRule::create([
                ...$data,
                'organization_id' => $organizationId,
                'cooldown_seconds' => $data['cooldown_seconds'] ?? 60,
                'is_active' => $data['is_active'] ?? true,
                'priority' => $data['priority'] ?? 0,
            ]);

            $rule->load(['organization', 'integration']);
            return $rule;
        });
    }

    /**
     * Update an automation rule
     */
    public function updateRule(AutomationRule $rule, array $data, User $actor): AutomationRule
    {
        // Check ownership and permissions
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            if ($actor->organization_id !== $rule->organization_id) {
                throw new DomainActionException('Cannot update rules for other organizations', 403);
            }
            if (!RoleHelper::canEdit($actor->role)) {
                throw new DomainActionException('Insufficient permissions to update automation rules', 403);
            }
        }

        // Verify integration belongs to organization if changed
        if (isset($data['integration_id'])) {
            $integration = Integration::findOrFail($data['integration_id']);
            if ($integration->organization_id !== $rule->organization_id) {
                throw new DomainActionException('Integration does not belong to your organization', 403);
            }
        }

        return $this->domainActionService->execute(request(), function () use ($rule, $data) {
            $rule->update($data);
            $rule->load(['organization', 'integration']);
            return $rule;
        });
    }

    /**
     * Delete an automation rule
     */
    public function deleteRule(AutomationRule $rule, User $actor): void
    {
        // Check ownership and permissions
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            if ($actor->organization_id !== $rule->organization_id) {
                throw new DomainActionException('Cannot delete rules for other organizations', 403);
            }
            if (!RoleHelper::canManageOrganization($actor->role)) {
                throw new DomainActionException('Insufficient permissions to delete automation rules', 403);
            }
        }

        $this->domainActionService->execute(request(), function () use ($rule) {
            $rule->delete();
        });
    }

    /**
     * Toggle rule active status
     */
    public function toggleActive(AutomationRule $rule, User $actor): AutomationRule
    {
        // Check ownership
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            if ($actor->organization_id !== $rule->organization_id) {
                throw new DomainActionException('Cannot toggle rules for other organizations', 403);
            }
        }

        return $this->domainActionService->execute(request(), function () use ($rule) {
            $rule->update(['is_active' => !$rule->is_active]);
            return $rule;
        });
    }
}
