<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\SubstituteBindings;
use App\Http\Middleware\RequireHttps;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            RequireHttps::class,
            SubstituteBindings::class,
            \App\Http\Middleware\EnforceDomainServices::class,
        ]);

        $middleware->web(prepend: [
            \App\Http\Middleware\EnforceDomainServices::class,
        ]);

        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'active.subscription' => \App\Http\Middleware\EnsureActiveSubscription::class,
            'verify.edge.signature' => \App\Http\Middleware\VerifyEdgeSignature::class,
            'require.https' => RequireHttps::class,
            'role' => \App\Http\Middleware\EnsureRole::class,
            'clear.login.rate.limit' => \App\Http\Middleware\ClearLoginRateLimit::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // CRITICAL: Override AuthenticationException redirectTo for API-only app
        // This prevents "Route [login] not defined" errors
        $exceptions->respond(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            // For API routes, always return JSON (never redirect)
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'error' => 'authentication_required'
                ], 401);
            }
            
            // For web routes, also return JSON (API-only app)
            return response()->json([
                'message' => 'Unauthenticated.',
                'error' => 'authentication_required'
            ], 401);
        });
    })
    ->create();
