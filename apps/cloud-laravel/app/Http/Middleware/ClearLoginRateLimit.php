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
     * Clear rate limit using Laravel's exact throttle key format
     */
    protected function clearRateLimit(Request $request)
    {
        try {
            // Laravel's throttle middleware uses resolveRequestSignature() to get identifier
            $identifier = $request->ip() ?? $request->userAgent() ?? 'unknown';
            
            // Laravel throttle middleware key format:
            // For throttle:20,1, it uses: md5('throttle:20,1' . $identifier)
            $key = md5('throttle:20,1' . $identifier);
            
            // Also try the old key format in case it was cached with old limit
            $oldKey = md5('throttle:10,1' . $identifier);
            
            // Method 1: Use RateLimiter facade to clear (Laravel's official way)
            RateLimiter::clear($key);
            RateLimiter::clear($oldKey); // Clear old key format too
            
            // Method 2: Clear from cache directly (in case RateLimiter doesn't work)
            // Laravel stores throttle data in cache with the key format above
            $cacheStore = Cache::store();
            $cacheStore->forget($key);
            $cacheStore->forget($oldKey);
            
            // Method 3: Try with cache prefix if configured
            $cachePrefix = config('cache.prefix', '');
            if ($cachePrefix) {
                $cacheStore->forget($cachePrefix . $key);
                $cacheStore->forget($cachePrefix . $oldKey);
                $cacheStore->forget($cachePrefix . 'throttle:20,1:' . $identifier);
                $cacheStore->forget($cachePrefix . 'throttle:10,1:' . $identifier);
            }
            
            // Method 4: Clear all possible key variations (comprehensive cleanup)
            $variations = [
                $key,
                $oldKey,
                'throttle:20,1:' . $identifier,
                'throttle:10,1:' . $identifier,
                md5('throttle:20,1:' . $identifier),
                md5('throttle:10,1:' . $identifier),
                sha1('throttle:20,1' . $identifier),
                sha1('throttle:10,1' . $identifier),
                'rate_limit:' . $key,
                'rate_limit:' . $oldKey,
            ];
            
            foreach ($variations as $variation) {
                try {
                    $cacheStore->forget($variation);
                    if ($cachePrefix) {
                        $cacheStore->forget($cachePrefix . $variation);
                    }
                } catch (\Exception $e) {
                    // Ignore individual failures
                }
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
