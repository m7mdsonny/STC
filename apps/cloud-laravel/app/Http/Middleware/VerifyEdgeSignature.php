<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\EdgeServer;
use App\Models\EdgeNonce;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VerifyEdgeSignature
{
    /**
     * Handle an incoming request.
     * 
     * Verifies HMAC signature for Edge Server requests.
     * Expected headers:
     * - X-EDGE-KEY: edge_key (unique identifier)
     * - X-EDGE-TIMESTAMP: Unix timestamp
     * - X-EDGE-SIGNATURE: HMAC_SHA256(edge_secret, method|path|timestamp|body_hash)
     * 
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $edgeKey = $request->header('X-EDGE-KEY');
        $timestamp = $request->header('X-EDGE-TIMESTAMP');
        $signature = $request->header('X-EDGE-SIGNATURE');
        $nonce = $request->header('X-EDGE-NONCE'); // Replay protection

        // Check required headers - ALL must be present for HMAC authentication
        if (!$edgeKey || !$timestamp || !$signature) {
            Log::warning('Edge signature verification failed: missing headers', [
                'edge_key' => $edgeKey ? 'present' : 'missing',
                'timestamp' => $timestamp ? 'present' : 'missing',
                'signature' => $signature ? 'present' : 'missing',
                'ip' => $request->ip(),
                'path' => $request->path(),
            ]);
            return response()->json([
                'message' => 'Missing required authentication headers (X-EDGE-KEY, X-EDGE-TIMESTAMP, X-EDGE-SIGNATURE)',
                'error' => 'authentication_required'
            ], 401);
        }

        // REPLAY PROTECTION: Require nonce header
        if (!$nonce) {
            Log::warning('Edge signature verification failed: missing nonce', [
                'edge_key' => $edgeKey,
                'ip' => $request->ip(),
                'path' => $request->path(),
            ]);
            return response()->json([
                'message' => 'Missing required header: X-EDGE-NONCE',
                'error' => 'nonce_required'
            ], 401);
        }

        // Find edge server by edge_key
        $edgeServer = EdgeServer::where('edge_key', $edgeKey)->first();

        if (!$edgeServer) {
            Log::warning('Edge signature verification failed: edge server not found', [
                'edge_key' => $edgeKey,
                'ip' => $request->ip(),
            ]);
            return response()->json([
                'message' => 'Invalid edge server key',
                'error' => 'invalid_credentials'
            ], 401);
        }

        if (!$edgeServer->edge_secret) {
            Log::warning('Edge signature verification failed: edge server has no secret', [
                'edge_key' => $edgeKey,
                'edge_server_id' => $edgeServer->id,
            ]);
            return response()->json([
                'message' => 'Edge server not properly configured',
                'error' => 'configuration_error'
            ], 500);
        }

        // Replay protection: timestamp must be within 5 minutes
        $requestTime = (int) $timestamp;
        $currentTime = time();
        $timeDiff = abs($currentTime - $requestTime);

        if ($timeDiff > 300) { // 5 minutes
            Log::warning('Edge signature verification failed: timestamp out of range', [
                'edge_key' => $edgeKey,
                'request_time' => $requestTime,
                'current_time' => $currentTime,
                'time_diff' => $timeDiff,
                'ip' => $request->ip(),
            ]);
            return response()->json([
                'message' => 'Request timestamp is too old or too far in the future',
                'error' => 'timestamp_invalid'
            ], 401);
        }

        // REPLAY PROTECTION: Check and reserve nonce atomically to prevent race condition
        // CRITICAL: Use atomic insert with try-catch to prevent race conditions in concurrent requests
        // Try to insert nonce first - if duplicate, it means nonce was already used
        try {
            EdgeNonce::create([
                'nonce' => $nonce,
                'edge_server_id' => $edgeServer->id,
                'ip_address' => $request->ip(),
                'used_at' => Carbon::now(),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle duplicate key error (nonce already used or race condition)
            if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                // Check if nonce was actually used (or just race condition)
                $existingNonce = EdgeNonce::where('nonce', $nonce)->first();
                if ($existingNonce) {
                    Log::warning('Edge signature verification failed: nonce already used (replay attack)', [
                        'edge_key' => $edgeKey,
                        'edge_server_id' => $edgeServer->id ?? null,
                        'nonce' => substr($nonce, 0, 16) . '...',
                        'used_at' => $existingNonce->used_at,
                        'ip' => $request->ip(),
                        'path' => $request->path(),
                    ]);
                    return response()->json([
                        'message' => 'Request nonce already used (replay attack detected)',
                        'error' => 'nonce_reused'
                    ], 401);
                }
                // If nonce doesn't exist (shouldn't happen), log error and reject
                Log::error('Duplicate key error but nonce not found - database inconsistency', [
                    'edge_key' => $edgeKey,
                    'nonce' => substr($nonce, 0, 16) . '...',
                    'error' => $e->getMessage(),
                ]);
                return response()->json([
                    'message' => 'Internal server error during nonce verification',
                    'error' => 'nonce_check_failed'
                ], 500);
            }
            // Re-throw if it's a different database error
            throw $e;
        } catch (\Exception $e) {
            // If any other error occurs, log and reject request to be safe
            Log::error('Error storing nonce', [
                'error' => $e->getMessage(),
                'edge_key' => $edgeKey,
                'nonce' => substr($nonce, 0, 16) . '...',
            ]);
            return response()->json([
                'message' => 'Internal server error during nonce verification',
                'error' => 'nonce_check_failed'
            ], 500);
        }

        // Build signature string: method|path|timestamp|body_hash
        $method = strtoupper($request->method());
        $path = $request->path();
        $bodyHash = hash('sha256', $request->getContent() ?: '');
        $signatureString = "{$method}|{$path}|{$timestamp}|{$bodyHash}";

        // Decrypt edge_secret for HMAC calculation
        try {
            $decryptedSecret = \Illuminate\Support\Facades\Crypt::decryptString($edgeServer->edge_secret);
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            Log::error('Failed to decrypt edge_secret for signature verification', [
                'edge_key' => $edgeKey,
                'edge_server_id' => $edgeServer->id,
            ]);
            return response()->json([
                'message' => 'Edge server configuration error',
                'error' => 'decryption_failed'
            ], 500);
        }

        // Calculate expected signature
        $expectedSignature = hash_hmac('sha256', $signatureString, $decryptedSecret);

        // Use hash_equals for timing-safe comparison
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Edge signature verification failed: signature mismatch', [
                'edge_key' => $edgeKey,
                'edge_server_id' => $edgeServer->id,
                'expected' => substr($expectedSignature, 0, 16) . '...',
                'received' => substr($signature, 0, 16) . '...',
                'ip' => $request->ip(),
            ]);
            return response()->json([
                'message' => 'Invalid signature',
                'error' => 'invalid_signature'
            ], 401);
        }

        // Nonce already stored above (atomic insert before signature verification)

        // Cleanup old nonces (older than 10 minutes) - prevent table bloat
        EdgeNonce::where('used_at', '<', Carbon::now()->subMinutes(10))->delete();

        // Attach edge server to request for use in controllers
        $request->merge(['edge_server' => $edgeServer]);
        $request->setUserResolver(function () use ($edgeServer) {
            // Return a minimal user-like object for organization_id access
            return (object) [
                'organization_id' => $edgeServer->organization_id,
                'edge_server_id' => $edgeServer->id,
            ];
        });

        Log::debug('Edge signature verification successful', [
            'edge_key' => $edgeKey,
            'edge_server_id' => $edgeServer->id,
            'organization_id' => $edgeServer->organization_id,
            'nonce' => substr($nonce, 0, 16) . '...',
        ]);

        return $next($request);
    }
}
