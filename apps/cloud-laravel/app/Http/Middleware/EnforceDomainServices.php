<?php

namespace App\Http\Middleware;

use App\Support\DomainExecutionContext;
use Closure;
use Illuminate\Http\Request;

class EnforceDomainServices
{
    /**
     * Routes that are exempt from domain service enforcement.
     * These are typically public routes, special auth routes, or edge server routes that perform mutations
     * but should not require domain service usage.
     */
    protected array $exemptRoutes = [
        // Public endpoints
        'api/v1/public/contact',
        'api/v1/public/free-trial',
        
        // Special auth endpoints (user self-service operations)
        'api/v1/auth/login',      // Login updates last_login_at
        'api/v1/auth/register',   // User registration
        'api/v1/auth/logout',     // Token deletion only
        'api/v1/auth/profile',    // User updating their own profile
        'api/v1/auth/password',   // User changing their own password
        
        // Edge server endpoints (HMAC-authenticated, not user-authenticated)
        'api/v1/edges/events',
        'api/v1/edges/heartbeat',
    ];

    public function handle(Request $request, Closure $next)
    {
        // Skip enforcement for exempt routes (public routes, edge server routes)
        if ($this->shouldSkipEnforcement($request)) {
            return $next($request);
        }

        DomainExecutionContext::start($request);

        try {
            $response = $next($request);
            // Only enforce domain service usage for authenticated mutation requests
            // Unauthenticated requests are handled by exempt routes
            if ($request->user() && !in_array(strtoupper($request->method()), ['GET', 'HEAD', 'OPTIONS'])) {
                DomainExecutionContext::assertServiceUsage($request);
            }
            return $response;
        } finally {
            DomainExecutionContext::stop($request);
        }
    }

    /**
     * Check if the current route should skip domain service enforcement.
     */
    protected function shouldSkipEnforcement(Request $request): bool
    {
        $path = $request->path();
        
        // Normalize path (remove leading/trailing slashes)
        $path = trim($path, '/');
        
        // Check if path matches any exempt route pattern
        foreach ($this->exemptRoutes as $exemptRoute) {
            $exemptRoute = trim($exemptRoute, '/');
            // Exact match or path starts with exempt route
            if ($path === $exemptRoute || str_starts_with($path, $exemptRoute . '/')) {
                return true;
            }
        }
        
        return false;
    }
}
