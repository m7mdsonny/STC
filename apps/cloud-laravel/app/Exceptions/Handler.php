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
                return response()->json($payload, $e->getStatus())
                    ->header('Access-Control-Allow-Origin', $request->header('Origin') ?? '*')
                    ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token')
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
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401)
                ->header('Access-Control-Allow-Origin', $request->header('Origin') ?? '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token')
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

        // Add CORS headers to ALL responses for API requests
        if ($request->is('api/*') || $request->expectsJson()) {
            $response->headers->set('Access-Control-Allow-Origin', $request->header('Origin') ?? '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}
