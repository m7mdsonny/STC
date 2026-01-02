<?php

namespace App\Policies;

use App\Models\EdgeServer;
use App\Models\User;
use App\Helpers\RoleHelper;

class EdgeServerPolicy
{
    /**
     * Determine if user can view any edge servers
     */
    public function viewAny(User $user): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view edge servers in their organization
        return $user->organization_id !== null;
    }

    /**
     * Determine if user can view the edge server
     */
    public function view(User $user, EdgeServer $edgeServer): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view edge servers in their organization
        return $user->organization_id === $edgeServer->organization_id;
    }

    /**
     * Determine if user can create edge servers
     */
    public function create(User $user): bool
    {
        // Super admin can create edge servers for any organization
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can create edge servers for their organization
        return RoleHelper::canManageOrganization($user->role) && $user->organization_id !== null;
    }

    /**
     * Determine if user can update the edge server
     */
    public function update(User $user, EdgeServer $edgeServer): bool
    {
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can update edge servers in their organization
        if ($user->organization_id === $edgeServer->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can delete the edge server
     */
    public function delete(User $user, EdgeServer $edgeServer): bool
    {
        // Super admin can delete all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can delete edge servers in their organization
        if ($user->organization_id === $edgeServer->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can view logs
     */
    public function viewLogs(User $user, EdgeServer $edgeServer): bool
    {
        // Super admin can view all logs
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can view logs for edge servers in their organization
        if ($user->organization_id === $edgeServer->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can view config
     */
    public function viewConfig(User $user, EdgeServer $edgeServer): bool
    {
        // Same as viewLogs
        return $this->viewLogs($user, $edgeServer);
    }
}
