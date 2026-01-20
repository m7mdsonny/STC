<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Clear login rate limit on successful login
 * This middleware should be applied AFTER throttle middleware
 */
class ClearLoginRateLimit
{
    /**
     * Handle an incoming request.
     * 
     * Clears the login rate limit cache when login is successful.
     * This allows legitimate users to login again after successful authentication.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only clear rate limit if login was successful (status 200)
        if ($response->getStatusCode() === 200) {
            // Laravel throttle middleware uses resolveRequestSignature() which returns IP by default
            $identifier = $request->ip() ?? $request->userAgent();
            
            // Laravel throttle middleware generates keys using resolveRateLimiterKey()
            // For throttle:10,1, the key format is: md5('throttle:10,1' . $identifier)
            $throttleKey = md5('throttle:10,1' . $identifier);
            
            // Clear using RateLimiter facade (proper method)
            RateLimiter::clear($throttleKey);
            
            // Also clear using cache directly (backup method)
            $cachePrefix = config('cache.prefix', 'laravel_cache_');
            \Illuminate\Support\Facades\Cache::forget($cachePrefix . $throttleKey);
            \Illuminate\Support\Facades\Cache::forget($throttleKey);
        }

        return $response;
    }
}
