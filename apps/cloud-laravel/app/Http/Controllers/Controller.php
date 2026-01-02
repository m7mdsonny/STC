<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Ensure user is super admin
     */
    protected function ensureSuperAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            abort(403, 'Super admin access required');
        }
    }

    /**
     * Ensure user can manage organization (owner or admin)
     */
    protected function ensureCanManage(Request $request): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        if (!RoleHelper::canManageOrganization($user->role)) {
            abort(403, 'Insufficient permissions to manage this resource');
        }
    }

    /**
     * Ensure user can edit (owner, admin, or editor)
     */
    protected function ensureCanEdit(Request $request): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        if (!RoleHelper::canEdit($user->role)) {
            abort(403, 'Insufficient permissions to edit this resource');
        }
    }

    /**
     * Ensure user belongs to organization or is super admin
     */
    protected function ensureOrganizationAccess(Request $request, ?int $organizationId): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Super admin can access all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return;
        }

        // Must have organization_id
        if (!$user->organization_id) {
            abort(403, 'User must belong to an organization');
        }

        // Must match organization
        if ($organizationId && (int) $organizationId !== (int) $user->organization_id) {
            abort(403, 'Access denied to this organization');
        }
    }
}
