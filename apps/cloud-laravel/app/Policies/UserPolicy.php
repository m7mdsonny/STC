<?php

namespace App\Policies;

use App\Models\User;
use App\Helpers\RoleHelper;

class UserPolicy
{
    /**
     * Determine if user can view any users
     */
    public function viewAny(User $user): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view users in their organization
        return $user->organization_id !== null;
    }

    /**
     * Determine if user can view the user
     */
    public function view(User $user, User $model): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view users in their organization
        return $user->organization_id === $model->organization_id;
    }

    /**
     * Determine if user can create users
     */
    public function create(User $user): bool
    {
        // Super admin can create any user
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can create users in their organization
        return RoleHelper::canManageOrganization($user->role) && $user->organization_id !== null;
    }

    /**
     * Determine if user can update the user
     */
    public function update(User $user, User $model): bool
    {
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Users can update their own profile
        if ($user->id === $model->id) {
            return true;
        }
        
        // Org managers can update users in their organization
        if ($user->organization_id === $model->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can delete the user
     */
    public function delete(User $user, User $model): bool
    {
        // Cannot delete self
        if ($user->id === $model->id) {
            return false;
        }
        
        // Super admin can delete all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can delete users in their organization
        if ($user->organization_id === $model->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can toggle active status
     */
    public function toggleActive(User $user, User $model): bool
    {
        // Cannot toggle own status
        if ($user->id === $model->id) {
            return false;
        }
        
        // Super admin can toggle all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can toggle users in their organization
        if ($user->organization_id === $model->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }
}
