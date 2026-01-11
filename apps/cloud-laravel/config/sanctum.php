<?php

use Laravel\Sanctum\Sanctum;

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s%s',
        'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1',
        Sanctum::currentApplicationUrlWithPort(),
        ',stcsolutions.online,api.stcsolutions.online,www.stcsolutions.online'
    ))),

    'guard' => ['web'],

    // SECURITY FIX: Token expiration set to 7 days (in minutes)
    // Tokens will automatically expire after this period
    'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 60 * 24 * 7), // 10080 minutes = 7 days

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
