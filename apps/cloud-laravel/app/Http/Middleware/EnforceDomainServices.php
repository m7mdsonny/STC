<?php

namespace App\Http\Middleware;

use App\Support\DomainExecutionContext;
use Closure;
use Illuminate\Http\Request;

class EnforceDomainServices
{
    public function handle(Request $request, Closure $next)
    {
        DomainExecutionContext::start($request);

        try {
            $response = $next($request);
            DomainExecutionContext::assertServiceUsage($request);
            return $response;
        } finally {
            DomainExecutionContext::stop($request);
        }
    }
}
