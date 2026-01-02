<?php

namespace App\Http\Middleware;

use App\Helpers\RoleHelper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOrganizationAccess
{
    /**
     * Ensure user can access organization-scoped resources
     * Super admin can access all, others only their organization
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Super admin has access to all organizations
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return $next($request);
        }

        // Non-super-admin users must have an organization
        if (!$user->organization_id) {
            abort(403, 'User must belong to an organization');
        }

        // Check if request is trying to access a different organization
        $requestedOrgId = $request->route('organization')?->id 
            ?? $request->route('organization_id')
            ?? $request->input('organization_id');

        if ($requestedOrgId && (int) $requestedOrgId !== (int) $user->organization_id) {
            abort(403, 'Access denied to this organization');
        }

        return $next($request);
    }
}



