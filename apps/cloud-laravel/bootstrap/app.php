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
            \Illuminate\Http\Middleware\HandleCors::class,
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
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Use the default Laravel exception handling pipeline.
    })
    ->create();
