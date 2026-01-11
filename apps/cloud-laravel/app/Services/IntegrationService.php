<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\EdgeServer;
use App\Models\Integration;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class IntegrationService
{
    public function __construct(
        private DomainActionService $domainActionService,
    ) {
    }

    /**
     * Create a new integration
     */
    public function createIntegration(array $data, User $actor): Integration
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can create integrations', 403);
        }

        // Verify edge server belongs to organization
        $edgeServer = EdgeServer::findOrFail($data['edge_server_id']);
        if ($edgeServer->organization_id != $data['organization_id']) {
            throw new DomainActionException('Edge server does not belong to the specified organization', 422);
        }

        return $this->domainActionService->execute(request(), function () use ($data) {
            $integration = Integration::create($data);
            return $integration->load(['organization', 'edgeServer']);
        }, function () {
            // Super admin bypass
        });
    }

    /**
     * Update an integration
     */
    public function updateIntegration(Integration $integration, array $data, User $actor): Integration
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can update integrations', 403);
        }

        return $this->domainActionService->execute(request(), function () use ($integration, $data) {
            $integration->update($data);
            return $integration->load(['organization', 'edgeServer']);
        }, function () {
            // Super admin bypass
        });
    }

    /**
     * Delete an integration
     */
    public function deleteIntegration(Integration $integration, User $actor): void
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can delete integrations', 403);
        }

        $this->domainActionService->execute(request(), function () use ($integration) {
            $integration->delete();
        }, function () {
            // Super admin bypass
        });
    }

    /**
     * Toggle integration active status
     */
    public function toggleActive(Integration $integration, User $actor): Integration
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can toggle integrations', 403);
        }

        return $this->domainActionService->execute(request(), function () use ($integration) {
            $integration->is_active = !$integration->is_active;
            $integration->save();
            return $integration;
        }, function () {
            // Super admin bypass
        });
    }
}
