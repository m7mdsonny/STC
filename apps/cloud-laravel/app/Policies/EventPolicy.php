<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use App\Helpers\RoleHelper;

class EventPolicy
{
    /**
     * Determine if user can view any events
     */
    public function viewAny(User $user): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view events in their organization
        return $user->organization_id !== null;
    }

    /**
     * Determine if user can view the event
     */
    public function view(User $user, Event $event): bool
    {
        // Super admin can view all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Others can only view events in their organization
        return $user->organization_id === $event->organization_id;
    }

    /**
     * Determine if user can create events
     */
    public function create(User $user): bool
    {
        // Events are typically created by Edge Servers, not users
        // But if needed, org members can create events
        return $user->organization_id !== null;
    }

    /**
     * Determine if user can update the event
     */
    public function update(User $user, Event $event): bool
    {
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Editors and above can update events in their organization
        if ($user->organization_id === $event->organization_id) {
            return RoleHelper::canEdit($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can delete the event
     */
    public function delete(User $user, Event $event): bool
    {
        // Super admin can delete all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can delete events in their organization
        if ($user->organization_id === $event->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can acknowledge the event
     */
    public function acknowledge(User $user, Event $event): bool
    {
        // Super admin can acknowledge all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Editors and above can acknowledge events in their organization
        if ($user->organization_id === $event->organization_id) {
            return RoleHelper::canEdit($user->role);
        }
        
        return false;
    }

    /**
     * Determine if user can resolve the event
     */
    public function resolve(User $user, Event $event): bool
    {
        // Same as acknowledge
        return $this->acknowledge($user, $event);
    }
}
