<?php

namespace App\Http\Middleware;

use App\Helpers\RoleHelper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOrgManager
{
    /**
     * Ensure user can manage organization resources
     * Super admin or admin/manager roles only
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Super admin has full access
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return $next($request);
        }

        // Check if user can manage organization
        if (!RoleHelper::canManageOrganization($user->role)) {
            abort(403, 'Organization management access required');
        }

        return $next($request);
    }
}
