<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Http\Requests\LicenseStoreRequest;
use App\Http\Requests\LicenseUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use App\Models\License;
use Illuminate\Support\Str;

class LicenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = License::query();

        // Super admin can see all licenses
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            // Organization owners/admins can see their org's licenses
            if ($user->organization_id) {
                $query->where('organization_id', $user->organization_id);
            } else {
                return response()->json(['data' => [], 'total' => 0]);
            }
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('plan')) {
            $query->where('plan', $request->get('plan'));
        }

        $licenses = $query->orderByDesc('created_at')->paginate((int) $request->get('per_page', 15));

        return response()->json($licenses);
    }

    public function show(License $license): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('view', $license);
        
        return response()->json($license);
    }

    public function store(LicenseStoreRequest $request): JsonResponse
    {
        // Authorization is handled by LicenseStoreRequest
        $data = $request->validated();

        $license = License::create([
            ...$data,
            'license_key' => Str::uuid()->toString(),
            'status' => 'active',
        ]);

        return response()->json($license, 201);
    }

    public function update(LicenseUpdateRequest $request, License $license): JsonResponse
    {
        // Authorization is handled by LicenseUpdateRequest
        $data = $request->validated();

        $license->update($data);

        return response()->json($license);
    }

    public function destroy(License $license): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('delete', $license);
        
        $license->delete();
        return response()->json(['message' => 'License deleted']);
    }

    public function activate(License $license): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $license->update(['status' => 'active', 'activated_at' => now()]);
        return response()->json($license);
    }

    public function suspend(License $license): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $license->update(['status' => 'suspended']);
        return response()->json($license);
    }

    public function renew(Request $request, License $license): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $request->validate(['expires_at' => 'required|date']);
        $license->update(['expires_at' => $request->expires_at, 'status' => 'active']);
        return response()->json($license);
    }

    public function regenerateKey(License $license): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $license->update(['license_key' => Str::uuid()->toString()]);
        return response()->json($license);
    }

    public function validateKey(Request $request): JsonResponse
    {
        try {
            // SECURITY: L1-H2 - STRICT HMAC REQUIREMENT
            // HMAC authentication is now MANDATORY - no license_key-only fallback
            // Edge servers must use heartbeat endpoint first to obtain edge_key/edge_secret
            $edgeKey = $request->header('X-EDGE-KEY');
            $timestamp = $request->header('X-EDGE-TIMESTAMP');
            $signature = $request->header('X-EDGE-SIGNATURE');
            
            // Require all HMAC headers
            if (!$edgeKey || !$timestamp || !$signature) {
                \Illuminate\Support\Facades\Log::warning('License validation: HMAC headers missing', [
                    'ip' => $request->ip(),
                    'has_edge_key' => !empty($edgeKey),
                    'has_timestamp' => !empty($timestamp),
                    'has_signature' => !empty($signature),
                ]);
                return response()->json([
                    'valid' => false,
                    'reason' => 'hmac_required',
                    'message' => 'HMAC authentication required. Use heartbeat endpoint to obtain edge_key and edge_secret first.'
                ], 401);
            }
            
            // HMAC authentication headers present - verify signature
            $edgeServer = \App\Models\EdgeServer::where('edge_key', $edgeKey)->first();
            if (!$edgeServer || !$edgeServer->edge_secret) {
                \Illuminate\Support\Facades\Log::warning('License validation: HMAC headers present but edge server not found or missing secret', [
                    'edge_key' => substr($edgeKey ?? '', 0, 8) . '...',
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'valid' => false,
                    'reason' => 'invalid_credentials',
                    'message' => 'Invalid edge credentials. Use heartbeat endpoint to register and obtain credentials.'
                ], 401);
            }
            
            // Verify timestamp (replay protection)
            $requestTime = (int) $timestamp;
            $currentTime = time();
            $timeDiff = abs($currentTime - $requestTime);
            if ($timeDiff > 300) { // 5 minutes
                \Illuminate\Support\Facades\Log::warning('License validation: HMAC timestamp out of range', [
                    'edge_key' => substr($edgeKey, 0, 8) . '...',
                    'time_diff' => $timeDiff,
                ]);
                return response()->json([
                    'valid' => false,
                    'reason' => 'timestamp_invalid',
                    'message' => 'Request timestamp is too old or too far in the future'
                ], 401);
            }
            
            // Verify signature
            $method = 'POST';
            $path = $request->path();
            $bodyHash = hash('sha256', $request->getContent() ?: '');
            $signatureString = "{$method}|{$path}|{$timestamp}|{$bodyHash}";
            $expectedSignature = hash_hmac('sha256', $signatureString, $edgeServer->edge_secret);
            
            if (!hash_equals($expectedSignature, $signature)) {
                \Illuminate\Support\Facades\Log::warning('License validation: HMAC signature verification failed', [
                    'edge_key' => substr($edgeKey, 0, 8) . '...',
                    'ip' => $request->ip(),
                ]);
                return response()->json([
                    'valid' => false,
                    'reason' => 'invalid_signature',
                    'message' => 'Invalid signature'
                ], 401);
            }
            
            \Illuminate\Support\Facades\Log::debug('License validation: HMAC signature verified', [
                'edge_key' => substr($edgeKey, 0, 8) . '...',
                'edge_server_id' => $edgeServer->id,
            ]);
            
            // HMAC verified - now validate license_key (still required for license lookup)
            $request->validate([
                'license_key' => 'required|string',
                'edge_id' => 'required|string',
            ]);

            $license = License::where('license_key', $request->license_key)->first();
            if (!$license) {
                return response()->json([
                    'valid' => false, 
                    'reason' => 'not_found',
                    'message' => 'License key not found'
                ], 404);
            }

            // Check if license is active
            if ($license->status !== 'active') {
                return response()->json([
                    'valid' => false,
                    'reason' => 'inactive',
                    'message' => 'License is not active',
                    'status' => $license->status
                ], 403);
            }

            $now = Carbon::now();
            $expires = $license->expires_at ? Carbon::parse($license->expires_at) : null;
            $graceDays = (int) config('app.license_grace', 14);

            // Check expiration (with grace period)
            if ($expires && $expires->lt($now)) {
                $daysPastExpiry = $now->diffInDays($expires);
                if ($daysPastExpiry > $graceDays) {
                    return response()->json([
                        'valid' => false,
                        'reason' => 'expired',
                        'message' => 'License has expired beyond grace period',
                        'expires_at' => $license->expires_at,
                        'grace_days' => $graceDays
                    ], 403);
                }
            }

            // Get license modules if available
            $modules = [];
            if ($license->modules) {
                $modules = is_array($license->modules) ? $license->modules : json_decode($license->modules, true) ?? [];
            }

            // Verify organization exists
            $organization = \App\Models\Organization::find($license->organization_id);
            if (!$organization) {
                \Illuminate\Support\Facades\Log::warning("License validation: Organization {$license->organization_id} not found for license {$license->id}");
                return response()->json([
                    'valid' => false,
                    'reason' => 'organization_not_found',
                    'message' => 'License organization not found'
                ], 404);
            }

            return response()->json([
                'valid' => true,
                'edge_id' => $request->edge_id,
                'organization_id' => $license->organization_id,
                'license_id' => $license->id,
                'expires_at' => $license->expires_at?->toIso8601String(),
                'grace_days' => $graceDays,
                'plan' => $license->plan,
                'modules' => $modules,
                'max_cameras' => $license->max_cameras ?? null,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'valid' => false,
                'reason' => 'validation_error',
                'message' => 'Invalid request parameters',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('License validation error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'valid' => false,
                'reason' => 'server_error',
                'message' => 'An error occurred during license validation'
            ], 500);
        }
    }
}
