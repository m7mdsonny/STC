<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any}', function () {
    $indexPath = public_path('index.html');

    if (file_exists($indexPath)) {
        return response()->file($indexPath, [
            'Content-Type' => 'text/html',
        ]);
    }

    return response()->json([
        'message' => 'React build not found. Please run the build script.',
        'instructions' => 'cd apps/web-portal && npm run build && cp -r dist/* ../cloud-laravel/public/'
    ], 404);
})->where('any', '^(?!api|sanctum|install).*$');
