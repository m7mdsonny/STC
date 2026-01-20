<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Cache\RateLimiter as CacheRateLimiter;

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
     * Clear rate limit using comprehensive approach
     * Uses Laravel's exact throttle key format + brute force cache clearing
     */
    protected function clearRateLimit(Request $request)
    {
        try {
            // Laravel's throttle middleware uses resolveRequestSignature() to get identifier
            // For unauthenticated requests, it uses: sha1(route()->getDomain() . '|' . $request->ip())
            // For authenticated requests, it uses: sha1($user->getAuthIdentifier())
            
            $identifier = null;
            $route = $request->route();
            
            // Build identifier exactly like Laravel's throttle middleware does
            if ($route) {
                $domain = $route->getDomain();
                $ip = $request->ip();
                $identifier = sha1($domain . '|' . $ip);
            } else {
                // Fallback to IP
                $identifier = sha1($request->ip());
            }
            
            // Laravel throttle middleware key format:
            // For throttle:20,1, it uses the signature directly as key
            // But Laravel also uses md5 for some cache drivers
            $keys = [
                // Laravel's standard format
                'throttle:' . $identifier,
                md5('throttle:20,1' . $identifier),
                md5('throttle:10,1' . $identifier), // Old format
                
                // Alternative formats
                'throttle:20,1:' . $identifier,
                'throttle:10,1:' . $identifier,
                sha1('throttle:20,1' . $identifier),
                sha1('throttle:10,1' . $identifier),
                
                // With IP directly
                md5('throttle:20,1' . $request->ip()),
                md5('throttle:10,1' . $request->ip()),
            ];
            
            // Method 1: Use RateLimiter facade to clear all keys
            foreach ($keys as $key) {
                try {
                    RateLimiter::clear($key);
                } catch (\Exception $e) {
                    // Ignore individual failures
                }
            }
            
            // Method 2: Clear from cache directly (brute force)
            $cacheStore = Cache::store();
            $cachePrefix = config('cache.prefix', '');
            
            foreach ($keys as $key) {
                try {
                    // Clear without prefix
                    $cacheStore->forget($key);
                    
                    // Clear with prefix
                    if ($cachePrefix) {
                        $cacheStore->forget($cachePrefix . $key);
                        $cacheStore->forget($cachePrefix . md5($key));
                    }
                    
                    // Try with 'laravel_cache' prefix (Laravel default)
                    $cacheStore->forget('laravel_cache' . $key);
                    $cacheStore->forget('laravel_cache:' . $key);
                } catch (\Exception $e) {
                    // Ignore individual failures
                }
            }
            
            // Method 3: Clear all throttle-related keys for this IP (nuclear option)
            // This ensures we catch any variation Laravel might use
            try {
                $allKeys = [
                    'throttle:' . $request->ip(),
                    'throttle:20,1:' . $request->ip(),
                    'throttle:10,1:' . $request->ip(),
                    md5('throttle:20,1' . $request->ip()),
                    md5('throttle:10,1' . $request->ip()),
                ];
                
                foreach ($allKeys as $key) {
                    $cacheStore->forget($key);
                    if ($cachePrefix) {
                        $cacheStore->forget($cachePrefix . $key);
                    }
                }
            } catch (\Exception $e) {
                // Ignore
            }
            
        } catch (\Exception $e) {
            // Log but don't throw - clearing rate limit is a best-effort operation
            Log::debug('Error clearing rate limit (non-critical)', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);
        }
    }
}
