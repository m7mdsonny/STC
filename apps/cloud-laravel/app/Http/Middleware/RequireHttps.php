<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class RequireHttps
{
    public function handle(Request $request, Closure $next)
    {
        // Allow OPTIONS requests (CORS preflight) to pass through
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        if (!$request->isSecure()) {
            throw new HttpException(403, 'HTTPS is required');
        }

        return $next($request);
    }
}
