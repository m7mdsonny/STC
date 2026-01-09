<?php

namespace App\Policies;

use App\Models\License;
use App\Models\User;
use App\Helpers\RoleHelper;

class LicensePolicy
{
    /**
     * Determine if user can view any licenses
     */
    public function viewAny(User $user): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view licenses in their organization
        return $user->organization_id !== null;
    }

    /**
     * Determine if user can view the license
     */
    public function view(User $user, License $license): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view licenses in their organization
        return $user->organization_id === $license->organization_id;
    }

    /**
     * Determine if user can create licenses
     */
    public function create(User $user): bool
    {
        // Super admin can create licenses for any organization
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can create licenses for their organization
        return RoleHelper::canManageOrganization($user->role) && $user->organization_id !== null;
    }

    /**
     * Determine if user can update the license
     */
    public function update(User $user, License $license): bool
    {
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can update licenses in their organization
        if ($user->organization_id === $license->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can delete the license
     */
    public function delete(User $user, License $license): bool
    {
        // Super admin can delete all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can delete licenses in their organization
        if ($user->organization_id === $license->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }
}
