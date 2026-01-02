<?php

namespace App\Http\Middleware;

use App\Helpers\RoleHelper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $userRole = RoleHelper::normalize($user->role);

        // Super admin has access to everything
        if (RoleHelper::isSuperAdmin($userRole, $user->is_super_admin ?? false)) {
            return $next($request);
        }

        // Check if user has one of the required roles
        $hasAccess = false;
        foreach ($roles as $requiredRole) {
            $normalizedRequired = RoleHelper::normalize($requiredRole);
            if (RoleHelper::hasPermissionLevel($userRole, $normalizedRequired)) {
                $hasAccess = true;
                break;
            }
        }

        if (!$hasAccess) {
            abort(403, 'Insufficient permissions');
        }

        return $next($request);
    }
}



