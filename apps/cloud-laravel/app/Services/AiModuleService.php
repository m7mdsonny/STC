<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\AiModule;
use App\Models\AiModuleConfig;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AiModuleService
{
    public function __construct(
        private DomainActionService $domainActionService,
        private OrganizationCapabilitiesResolver $capabilities,
    ) {
    }

    /**
     * Update AI module (Super Admin only)
     */
    public function updateModule(AiModule $module, array $data, User $actor): AiModule
    {
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            throw new DomainActionException('Only super admins can update AI modules', 403);
        }

        return $this->domainActionService->execute(request(), function () use ($module, $data) {
            $module->update($data);
            return $module->fresh();
        }, function () {
            // Super admin bypass capability check
        });
    }

    /**
     * Update or create module config for organization
     */
    public function updateConfig(int $moduleId, array $data, User $actor): AiModuleConfig
    {
        $organizationId = $actor->organization_id;
        
        if (!$organizationId) {
            throw new DomainActionException('No organization assigned', 403);
        }

        $module = AiModule::find($moduleId);
        if (!$module) {
            throw new DomainActionException('Module not found', 404);
        }

        return $this->domainActionService->execute(request(), function () use ($organizationId, $moduleId, $data) {
            // If enabling, mark as licensed
            if (isset($data['is_enabled']) && $data['is_enabled']) {
                $data['is_licensed'] = true;
            }

            $config = AiModuleConfig::updateOrCreate(
                [
                    'organization_id' => $organizationId,
                    'module_id' => $moduleId,
                ],
                $data
            );

            $config->load('module');
            return $config;
        });
    }

    /**
     * Enable module for organization
     */
    public function enableModule(int $moduleId, User $actor): AiModuleConfig
    {
        $organizationId = $actor->organization_id;
        
        if (!$organizationId) {
            throw new DomainActionException('No organization assigned', 403);
        }

        $module = AiModule::find($moduleId);
        if (!$module) {
            throw new DomainActionException('Module not found', 404);
        }

        $organization = Organization::find($organizationId);
        if (!$organization) {
            throw new DomainActionException('Organization not found', 404);
        }

        return $this->domainActionService->execute(request(), function () use ($organizationId, $moduleId) {
            $config = AiModuleConfig::updateOrCreate(
                [
                    'organization_id' => $organizationId,
                    'module_id' => $moduleId,
                ],
                [
                    'is_enabled' => true,
                    'is_licensed' => true,
                ]
            );

            $config->load('module');
            return $config;
        });
    }

    /**
     * Disable module for organization
     */
    public function disableModule(int $moduleId, User $actor): AiModuleConfig
    {
        $organizationId = $actor->organization_id;
        
        if (!$organizationId) {
            throw new DomainActionException('No organization assigned', 403);
        }

        $config = AiModuleConfig::where('organization_id', $organizationId)
            ->where('module_id', $moduleId)
            ->first();

        if (!$config) {
            throw new DomainActionException('Config not found', 404);
        }

        return $this->domainActionService->execute(request(), function () use ($config) {
            $config->update(['is_enabled' => false]);
            $config->load('module');
            return $config;
        });
    }
}
