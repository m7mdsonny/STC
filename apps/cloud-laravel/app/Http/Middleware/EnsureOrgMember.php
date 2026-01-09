<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOrgMember
{
    /**
     * Ensure user is a member of an organization
     * Super admin bypasses this check
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Super admin bypasses organization check
        if ($user->is_super_admin) {
            return $next($request);
        }

        // Non-super-admin users must have an organization
        if (!$user->organization_id) {
            abort(403, 'User must belong to an organization');
        }

        return $next($request);
    }
}
