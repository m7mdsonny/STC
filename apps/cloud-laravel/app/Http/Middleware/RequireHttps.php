<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class RequireHttps
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->isSecure()) {
            throw new HttpException(403, 'HTTPS is required');
        }

        return $next($request);
    }
}
