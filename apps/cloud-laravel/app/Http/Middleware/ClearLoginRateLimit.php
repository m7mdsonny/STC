<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

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
        // Use try-catch to prevent middleware from breaking the response
        if ($response->getStatusCode() === 200) {
            try {
                $this->clearRateLimit($request);
            } catch (\Exception $e) {
                // Log but don't throw - clearing rate limit is best-effort
                Log::debug('ClearLoginRateLimit: Failed to clear (non-critical)', [
                    'error' => $e->getMessage(),
                    'ip' => $request->ip(),
                ]);
            }
        }

        return $response;
    }

    /**
     * Clear rate limit using multiple methods to ensure it works
     */
    protected function clearRateLimit(Request $request)
    {
        try {
            // Get identifier (IP address by default)
            $identifier = $request->ip() ?? $request->userAgent() ?? 'unknown';
            
            // Method 1: Try using RateLimiter::clear() with the throttle key format
            // Laravel throttle middleware uses: md5('throttle:{max}:{per}' . $identifier)
            $throttleKey = md5('throttle:10,1' . $identifier);
            RateLimiter::clear($throttleKey);
            
            // Method 2: Clear using cache directly with prefix
            $cachePrefix = config('cache.prefix', '');
            if ($cachePrefix) {
                Cache::forget($cachePrefix . $throttleKey);
                Cache::forget($cachePrefix . 'throttle:10,1:' . $identifier);
            }
            
            // Method 3: Clear without prefix (for some cache drivers)
            Cache::forget($throttleKey);
            Cache::forget('throttle:10,1:' . $identifier);
            
            // Method 4: Try alternative key formats Laravel might use
            Cache::forget(md5('throttle:10,1:' . $identifier));
            Cache::forget(sha1('throttle:10,1' . $identifier));
            
        } catch (\Exception $e) {
            // Log but don't throw - clearing rate limit is a best-effort operation
            Log::debug('Error clearing rate limit (non-critical)', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);
        }
    }
}
