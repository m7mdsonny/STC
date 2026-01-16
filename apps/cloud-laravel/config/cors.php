<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'api/v1/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => ['https://stcsolutions.online', 'http://localhost:5173', 'http://localhost:3000'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token', 'X-EDGE-KEY', 'X-EDGE-TIMESTAMP', 'X-EDGE-SIGNATURE'],
    'exposed_headers' => ['Authorization', 'X-Total-Count'],
    'max_age' => 86400,
    'supports_credentials' => true,
];
