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
                $origin = $request->header('Origin');
                $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
                $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : ($allowedOrigins[0] ?? '*');
                
                return response()->json($payload, $e->getStatus())
                    ->header('Access-Control-Allow-Origin', $allowedOrigin)
                    ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE')
                    ->header('Access-Control-Allow-Credentials', 'true');
            }

            return response($payload['message'], $e->getStatus());
        });
    }

    /**
     * Render an authentication exception into an HTTP response.
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            $origin = $request->header('Origin');
            $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
            $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : ($allowedOrigins[0] ?? '*');
            
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        return redirect()->guest('/login');
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        $response = parent::render($request, $e);

        // Add CORS headers to ALL responses for API requests - even on exceptions
        if ($request->is('api/*') || $request->expectsJson()) {
            $origin = $request->header('Origin');
            $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
            
            // Check if origin is in allowed list
            $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : ($allowedOrigins[0] ?? '*');
            
            $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Max-Age', '86400');
        }

        // Ensure JSON error responses for API requests
        if ($request->is('api/*') && !($response instanceof \Illuminate\Http\JsonResponse)) {
            $statusCode = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 500;
            $message = $e->getMessage() ?: 'An error occurred';
            
            \Log::error('API Exception', [
                'message' => $message,
                'status' => $statusCode,
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => $message,
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], $statusCode)->withHeaders([
                'Access-Control-Allow-Origin' => in_array($request->header('Origin'), ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000']) 
                    ? $request->header('Origin') 
                    : 'https://stcsolutions.online',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE',
                'Access-Control-Allow-Credentials' => 'true',
            ]);
        }

        return $response;
    }
}
