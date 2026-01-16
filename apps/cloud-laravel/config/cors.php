<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    // SECURITY FIX: Explicit allowed origins instead of wildcard
    // Use CORS_ALLOWED_ORIGINS env variable for production domains
    'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:8000'))),
    'allowed_origins_patterns' => [
        // Allow subdomains of stcsolutions.online in production
        '#^https?://.*\.stcsolutions\.online$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400, // Cache preflight for 24 hours
    'supports_credentials' => true,
];
