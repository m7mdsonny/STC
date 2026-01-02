<?php

namespace App\Policies;

use App\Models\Camera;
use App\Models\User;
use App\Helpers\RoleHelper;

class CameraPolicy
{
    /**
     * Determine if user can view any cameras
     */
    public function viewAny(User $user): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view cameras in their organization
        return $user->organization_id !== null;
    }

    /**
     * Determine if user can view the camera
     */
    public function view(User $user, Camera $camera): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view cameras in their organization
        return $user->organization_id === $camera->organization_id;
    }

    /**
     * Determine if user can create cameras
     */
    public function create(User $user): bool
    {
        // Super admin can create cameras for any organization
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers and editors can create cameras for their organization
        if ($user->organization_id !== null) {
            return RoleHelper::canEdit($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can update the camera
     */
    public function update(User $user, Camera $camera): bool
    {
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Editors and above can update cameras in their organization
        if ($user->organization_id === $camera->organization_id) {
            return RoleHelper::canEdit($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can delete the camera
     */
    public function delete(User $user, Camera $camera): bool
    {
        // Super admin can delete all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can delete cameras in their organization
        if ($user->organization_id === $camera->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }
}
