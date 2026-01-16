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

        // FORCE CORS headers on ALL API responses - even on exceptions
        if ($request->is('api/*') || $request->expectsJson()) {
            $origin = $request->header('Origin');
            $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
            $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : 'https://stcsolutions.online';
            
            $corsHeaders = [
                'Access-Control-Allow-Origin' => $allowedOrigin,
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE',
                'Access-Control-Allow-Credentials' => 'true',
                'Access-Control-Max-Age' => '86400',
            ];
            
            foreach ($corsHeaders as $key => $value) {
                $response->headers->set($key, $value);
            }
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
            
            $origin = $request->header('Origin');
            $allowedOrigins = ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'];
            $allowedOrigin = in_array($origin, $allowedOrigins) ? $origin : 'https://stcsolutions.online';
            
            return response()->json([
                'message' => $message,
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], $statusCode)->withHeaders([
                'Access-Control-Allow-Origin' => $allowedOrigin,
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE',
                'Access-Control-Allow-Credentials' => 'true',
            ]);
        }

        return $response;
    }
}
