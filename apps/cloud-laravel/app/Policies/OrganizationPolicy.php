<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use App\Helpers\RoleHelper;

class OrganizationPolicy
{
    /**
     * Determine if user can view any organizations
     */
    public function viewAny(User $user): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view their own organization
        return $user->organization_id !== null;
    }

    /**
     * Determine if user can view the organization
     */
    public function view(User $user, Organization $organization): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view their own organization
        return $user->organization_id === $organization->id;
    }

    /**
     * Determine if user can create organizations
     */
    public function create(User $user): bool
    {
        // Only super admin can create organizations
        return RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false);
    }

    /**
     * Determine if user can update the organization
     */
    public function update(User $user, Organization $organization): bool
    {
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can update their own organization
        if ($user->organization_id === $organization->id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can delete the organization
     */
    public function delete(User $user, Organization $organization): bool
    {
        // Only super admin can delete organizations
        return RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false);
    }

    /**
     * Determine if user can toggle active status
     */
    public function toggleActive(User $user, Organization $organization): bool
    {
        // Only super admin can toggle organization active status
        return RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false);
    }
}
