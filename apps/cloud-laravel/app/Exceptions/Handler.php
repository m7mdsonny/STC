<?php

namespace App\Exceptions;

use App\Exceptions\DomainActionException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // You may report additional exceptions here.
        });

        $this->renderable(function (DomainActionException $e, Request $request) {
            $payload = [
                'message' => $e->getMessage(),
            ];

            $context = $e->getContext();
            if (!empty($context)) {
                $payload['context'] = $context;
            }

            // Always surface domain errors with their intended status code
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json($payload, $e->getStatus());
            }

            return response($payload['message'], $e->getStatus());
        });
        
        // CRITICAL: Add detailed error handling for API endpoints
        $this->renderable(function (Throwable $e, Request $request) {
            // Only for API endpoints and JSON requests
            if (($request->expectsJson() || $request->is('api/*')) && config('app.debug')) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'error' => get_class($e),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ], 500);
            }
            
            // For production, return detailed error for API endpoints (for debugging)
            if ($request->expectsJson() || $request->is('api/*')) {
                \Illuminate\Support\Facades\Log::error('API Error', [
                    'error' => $e->getMessage(),
                    'error_class' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'route' => $request->route()?->getName(),
                ]);
                
                // Return more details for API debugging (even in production)
                return response()->json([
                    'message' => 'Server Error',
                    'error' => $e->getMessage(),
                    'error_type' => get_class($e),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                ], 500);
            }
            
            return null; // Let Laravel handle it
        });
    }

    /**
     * Render an authentication exception into an HTTP response.
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        // CRITICAL: For API routes, always return JSON (never redirect)
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'error' => 'authentication_required'
            ], 401);
        }

        // For web routes, return JSON anyway (API-only app)
        return response()->json([
            'message' => 'Unauthenticated.',
            'error' => 'authentication_required'
        ], 401);
    }

}
