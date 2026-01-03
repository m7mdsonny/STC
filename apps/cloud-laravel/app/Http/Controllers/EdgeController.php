<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Http\Requests\EdgeServerStoreRequest;
use App\Http\Requests\EdgeServerUpdateRequest;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\EdgeServer;
use App\Models\EdgeServerLog;
use App\Models\License;
use App\Models\Organization;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class EdgeController extends Controller
{
    protected SubscriptionService $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = EdgeServer::query();

        // Organization users can only see their org's edge servers
        // CRITICAL FIX: Ensure Owner/Admin can see all edge servers in their organization
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if ($user->organization_id) {
                // Filter by organization_id - Owner/Admin should see ALL edge servers in their org
                $query->where('organization_id', $user->organization_id);
            } else {
                // User without organization_id cannot see any edge servers
                return response()->json(['data' => [], 'total' => 0]);
            }
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        if ($request->filled('status')) {
            $query->where('online', $request->get('status') === 'online');
        }

        $perPage = (int) $request->get('per_page', 15);

        // SECURITY: edge_secret is hidden in model, but ensure it's never exposed
        $edgeServers = $query->with(['organization', 'license'])->orderByDesc('last_seen_at')->paginate($perPage);
        
        // Explicitly remove edge_secret from response if somehow present
        $edgeServers->getCollection()->transform(function ($edge) {
            if (isset($edge->edge_secret)) {
                unset($edge->edge_secret);
            }
            return $edge;
        });
        
        return response()->json($edgeServers);
    }

    public function show(EdgeServer $edgeServer): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('view', $edgeServer);
        
        // SECURITY: Never expose edge_secret in show endpoint
        $edgeData = $edgeServer->load(['organization', 'license'])->toArray();
        unset($edgeData['edge_secret']); // Explicitly remove if present
        
        return response()->json($edgeData);
    }

    public function store(EdgeServerStoreRequest $request): JsonResponse
    {
        // Authorization is handled by EdgeServerStoreRequest
        $data = $request->validated();

        $missingColumns = collect([
            'edge_key',
            'edge_secret',
            'secret_delivered_at',
            'internal_ip',
            'public_ip',
            'hostname',
        ])->filter(fn ($column) => !Schema::hasColumn('edge_servers', $column))->values();

        if ($missingColumns->isNotEmpty()) {
            return response()->json([
                'message' => 'Edge server table is missing required columns: ' . $missingColumns->implode(', ') . '. Please run the latest migrations.'
            ], 500);
        }

        Log::info('EdgeController@store received payload', [
            'user_id' => optional($request->user())->id,
            'organization_id' => $data['organization_id'] ?? $request->user()?->organization_id,
            'has_license' => !empty($data['license_id']),
            'ip_address' => $data['ip_address'] ?? null,
        ]);
        
        $user = $request->user();
        
        // CRITICAL FIX: Ensure organization_id is ALWAYS set correctly for Organization Owner/Admin
        // For non-super-admin users (Owner, Admin, etc.), ALWAYS use their organization_id
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            // Force organization_id from authenticated user (Owner/Admin can only create for their org)
            $organizationId = $user->organization_id;
            $data['organization_id'] = $user->organization_id;
            
            // Validate user has organization
            if (!$organizationId) {
                return response()->json([
                    'message' => 'User must be assigned to an organization to create edge servers'
                ], 403);
            }
        } else {
            // Super admin can specify organization_id, but validate it exists
            $organizationId = $data['organization_id'] ?? null;
            if (!$organizationId) {
                return response()->json([
                    'message' => 'organization_id is required'
                ], 422);
            }
        }

        // Check subscription limit enforcement
        try {
            $org = Organization::findOrFail($organizationId);
            $subscriptionService = app(\App\Services\SubscriptionService::class);
            $subscriptionService->assertCanCreateEdge($org);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 403);
        }

        // If license_id provided, verify it belongs to the organization
        if (!empty($data['license_id'])) {
            $license = License::findOrFail($data['license_id']);
            if ($license->organization_id !== (int) $organizationId) {
                return response()->json(['message' => 'License does not belong to the specified organization'], 403);
            }

            // Check if license is already bound to another edge server
            $existingEdge = EdgeServer::where('license_id', $data['license_id'])->first();
            if ($existingEdge) {
                return response()->json(['message' => 'License is already bound to another edge server'], 409);
            }
        }

        // Generate edge_key and edge_secret for HMAC authentication
        $edgeKey = 'edge_' . Str::random(32);
        $edgeSecret = Str::random(64);

        // SECURITY: Encrypt edge_secret before storing
        $encryptedSecret = \Illuminate\Support\Facades\Crypt::encryptString($edgeSecret);

        try {
            $edgeServer = EdgeServer::create([
                'name' => $data['name'],
                'organization_id' => $organizationId,
                'license_id' => $data['license_id'] ?? null,
                'edge_id' => $data['edge_id'] ?? Str::uuid()->toString(),
                'edge_key' => $edgeKey,
                // edge_secret stored encrypted (not in fillable, set directly)
                'ip_address' => $data['ip_address'] ?? null,
                'location' => $data['location'] ?? null,
                'notes' => $data['notes'] ?? null,
                'internal_ip' => $data['internal_ip'] ?? null,
                'public_ip' => $data['public_ip'] ?? null,
                'hostname' => $data['hostname'] ?? null,
                'online' => false,
            ]);

            // Set encrypted secret directly (bypassing fillable)
            $edgeServer->setAttribute('edge_secret', $encryptedSecret);
            $edgeServer->save();
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'Failed to create edge server: ' . $e->getMessage(),
            ], 500);
        }

        // If license_id was provided, update the license to link it to this edge server
        if (!empty($data['license_id'])) {
            $license = License::findOrFail($data['license_id']);
            $license->update(['edge_server_id' => $edgeServer->id]);
        } else {
            // Auto-link first available license if no license was specified
            $availableLicense = License::where('organization_id', $organizationId)
                ->where('status', 'active')
                ->whereNull('edge_server_id')
                ->first();
            
            if ($availableLicense) {
                $edgeServer->update(['license_id' => $availableLicense->id]);
                $availableLicense->update(['edge_server_id' => $edgeServer->id]);
            }
        }

        // Return edge server with keys (only on creation, never on update)
        // SECURITY: Mark secret as delivered immediately to prevent re-exposure
        $edgeServer->update(['secret_delivered_at' => now()]);
        
        $response = $edgeServer->load(['organization', 'license'])->toArray();
        unset($response['edge_secret']); // Remove encrypted secret from response
        $response['edge_key'] = $edgeKey;
        $response['edge_secret'] = $edgeSecret; // Return plaintext secret ONLY ONCE on creation
        
        \Illuminate\Support\Facades\Log::info('Edge server created with secret', [
            'edge_server_id' => $edgeServer->id,
            'edge_key' => $edgeKey,
        ]);
        
        return response()->json($response, 201);
    }

    public function update(EdgeServerUpdateRequest $request, EdgeServer $edgeServer): JsonResponse
    {
        // Authorization is handled by EdgeServerUpdateRequest
        $data = $request->validated();

        // If license_id is being updated, verify ownership and uniqueness
        if (isset($data['license_id'])) {
            // If setting to null, unlink current license
            if ($data['license_id'] === null || $data['license_id'] === '') {
                if ($edgeServer->license_id) {
                    $oldLicense = License::find($edgeServer->license_id);
                    if ($oldLicense) {
                        $oldLicense->update(['edge_server_id' => null]);
                    }
                }
                $data['license_id'] = null;
            } else {
                $license = License::findOrFail($data['license_id']);
                
                // Verify license belongs to the edge server's organization
                if ($license->organization_id !== $edgeServer->organization_id) {
                    return response()->json(['message' => 'License does not belong to this edge server\'s organization'], 403);
                }

                // Check if license is already bound to another edge server
                $existingEdge = EdgeServer::where('license_id', $data['license_id'])
                    ->where('id', '!=', $edgeServer->id)
                    ->first();
                if ($existingEdge) {
                    return response()->json(['message' => 'License is already bound to another edge server'], 409);
                }

                // Unlink old license if exists
                if ($edgeServer->license_id && $edgeServer->license_id != $data['license_id']) {
                    $oldLicense = License::find($edgeServer->license_id);
                    if ($oldLicense) {
                        $oldLicense->update(['edge_server_id' => null]);
                    }
                }

                // Link new license
                $license->update(['edge_server_id' => $edgeServer->id]);
            }
        }

        $edgeServer->update($data);

        return response()->json($edgeServer->load(['organization', 'license']));
    }

    public function destroy(EdgeServer $edgeServer): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('delete', $edgeServer);

        $edgeServer->delete();
        return response()->json(['message' => 'Edge server deleted']);
    }

    public function logs(Request $request, EdgeServer $edgeServer): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('viewLogs', $edgeServer);

        $query = EdgeServerLog::where('edge_server_id', $edgeServer->id);

        if ($request->filled('level')) {
            $query->where('level', $request->get('level'));
        }

        return response()->json($query->orderByDesc('created_at')->paginate((int) $request->get('per_page', 15)));
    }

    public function restart(EdgeServer $edgeServer): JsonResponse
    {
        $user = request()->user();

        // Check ownership and permissions
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $edgeServer->organization_id);
            if (!RoleHelper::canManageOrganization($user->role)) {
                return response()->json(['message' => 'Insufficient permissions to restart edge servers'], 403);
            }
        }

        // Log the request
        EdgeServerLog::create([
            'edge_server_id' => $edgeServer->id,
            'level' => 'info',
            'message' => 'Restart requested from control panel',
            'meta' => ['requested_at' => now()->toIso8601String(), 'requested_by' => $user->id],
        ]);

        // Send restart command using EdgeCommandService with HMAC authentication
        $commandService = app(EdgeCommandService::class);
        $result = $commandService->restart($edgeServer);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['data'] ?? null
            ]);
        } else {
            // Return error with appropriate status code
            $statusCode = $result['status_code'] ?? 500;
            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'error' => $result['error'] ?? 'unknown_error'
            ], $statusCode);
        }
    }

    public function syncConfig(EdgeServer $edgeServer): JsonResponse
    {
        $user = request()->user();

        // Check ownership and permissions
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $edgeServer->organization_id);
            if (!RoleHelper::canManageOrganization($user->role)) {
                return response()->json(['message' => 'Insufficient permissions to sync edge server config'], 403);
            }
        }

        // Log the request
        EdgeServerLog::create([
            'edge_server_id' => $edgeServer->id,
            'level' => 'info',
            'message' => 'Configuration sync requested',
            'meta' => ['requested_at' => now()->toIso8601String(), 'requested_by' => $user->id],
        ]);

        // Send sync command using EdgeCommandService with HMAC authentication
        $commandService = app(EdgeCommandService::class);
        $result = $commandService->syncConfig($edgeServer);

        if ($result['success']) {
            // Also sync all cameras for this edge server
            $cameras = \App\Models\Camera::where('edge_server_id', $edgeServer->id)
                ->where('status', '!=', 'deleted')
                ->get();
            
            $edgeServerService = app(\App\Services\EdgeServerService::class);
            $syncedCount = 0;
            foreach ($cameras as $camera) {
                if ($edgeServerService->syncCameraToEdge($camera)) {
                    $syncedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'cameras_synced' => $syncedCount,
                'total_cameras' => $cameras->count(),
                'data' => $result['data'] ?? null
            ]);
        } else {
            // Return error with appropriate status code
            $statusCode = $result['status_code'] ?? 500;
            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'error' => $result['error'] ?? 'unknown_error'
            ], $statusCode);
        }
    }

    /**
     * Get Edge Server base URL
     */
    private function getEdgeServerUrl(EdgeServer $edgeServer): ?string
    {
        if (!$edgeServer->ip_address) {
            return null;
        }

        $port = $edgeServer->port ?? 8080;
        $protocol = ($edgeServer->use_https ?? false) ? 'https' : 'http';
        
        return "{$protocol}://{$edgeServer->ip_address}:{$port}";
    }

    public function config(EdgeServer $edgeServer): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('viewConfig', $edgeServer);
        
        return response()->json($edgeServer->system_info ?? []);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        try {
            // Check if HMAC authentication is provided (after registration)
            $edgeKey = $request->header('X-EDGE-KEY');
            $timestamp = $request->header('X-EDGE-TIMESTAMP');
            $signature = $request->header('X-EDGE-SIGNATURE');
            
            $edge = $request->get('edge_server'); // Set by middleware if HMAC provided
            
            // If HMAC headers are present, verify authentication
            if ($edgeKey && $timestamp && $signature) {
                // Require HMAC authentication for registered edge servers
                if (!$edge) {
                    // Try to verify signature manually
                    $edgeServer = EdgeServer::where('edge_key', $edgeKey)->first();
                    
                    if (!$edgeServer || !$edgeServer->edge_secret) {
                        return response()->json([
                            'ok' => false,
                            'message' => 'Edge server not found or not properly configured',
                        ], 401);
                    }
                    
                    // Verify timestamp
                    $requestTime = (int) $timestamp;
                    $currentTime = time();
                    if (abs($currentTime - $requestTime) > 300) {
                        return response()->json([
                            'ok' => false,
                            'message' => 'Request timestamp is too old or too far in the future',
                        ], 401);
                    }
                    
                    // Verify signature
                    $method = strtoupper($request->method());
                    $path = $request->path();
                    $bodyHash = hash('sha256', $request->getContent() ?: '');
                    $signatureString = "{$method}|{$path}|{$timestamp}|{$bodyHash}";
                    // Decrypt edge_secret for HMAC calculation
                    try {
                        $decryptedSecret = \Illuminate\Support\Facades\Crypt::decryptString($edgeServer->edge_secret);
                    } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
                        return response()->json([
                            'ok' => false,
                            'message' => 'Edge server configuration error',
                        ], 500);
                    }
                    $expectedSignature = hash_hmac('sha256', $signatureString, $decryptedSecret);
                    
                    if (!hash_equals($expectedSignature, $signature)) {
                        return response()->json([
                            'ok' => false,
                            'message' => 'Invalid signature',
                        ], 401);
                    }
                    
                    $edge = $edgeServer;
                }
            } else {
                // No HMAC provided - check if this is initial registration
                // For initial registration, edge_id must be provided in request body
                $edgeId = $request->input('edge_id');
                
                if (!$edgeId) {
                    return response()->json([
                        'ok' => false,
                        'message' => 'HMAC authentication required for registered edge servers. For initial registration, provide edge_id in request body.',
                    ], 401);
                }
                
                // Find or create edge server for initial registration
                $edge = EdgeServer::where('edge_id', $edgeId)->first();
                
                if (!$edge) {
                    // This should not happen - edge should be created via web portal first
                    return response()->json([
                        'ok' => false,
                        'message' => 'Edge server not found. Please register via web portal first.',
                    ], 404);
                }
                
                // If edge already has credentials, require HMAC
                if ($edge->edge_key && $edge->edge_secret) {
                    return response()->json([
                        'ok' => false,
                        'message' => 'HMAC authentication required. This edge server is already registered.',
                    ], 401);
                }
            }
            
            if (!$edge) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Edge server not found',
                ], 404);
            }

            $request->validate([
                'version' => 'required|string',
                'online' => 'required|boolean',
                'license_id' => 'sometimes|nullable|integer|exists:licenses,id',
                'system_info' => 'sometimes|nullable|array',
                'cameras_status' => 'nullable|array', // Array of {camera_id: string, status: 'online'|'offline'}
                'internal_ip' => 'sometimes|nullable|ip',
                'public_ip' => 'sometimes|nullable|ip',
                'hostname' => 'sometimes|nullable|string|max:255',
            ]);

            $organizationId = $edge->organization_id;

            // Prepare update data (organization_id is already set from authenticated edge)
            $updateData = [
                'version' => $request->version,
                'online' => $request->boolean('online'),
                'last_seen_at' => now(),
            ];

            // Handle IP addresses from request or system_info
            if ($request->has('internal_ip')) {
                $updateData['internal_ip'] = $request->internal_ip;
            }
            if ($request->has('public_ip')) {
                $updateData['public_ip'] = $request->public_ip;
            }
            if ($request->has('hostname')) {
                $updateData['hostname'] = $request->hostname;
            }

            // Extract IP info from system_info if available
            if ($request->has('system_info') && is_array($request->system_info)) {
                $updateData['system_info'] = $request->system_info;
                
                // Extract IP addresses from system_info if not provided directly
                if (!isset($updateData['internal_ip']) && isset($request->system_info['internal_ip'])) {
                    $updateData['internal_ip'] = $request->system_info['internal_ip'];
                }
                if (!isset($updateData['public_ip']) && isset($request->system_info['public_ip'])) {
                    $updateData['public_ip'] = $request->system_info['public_ip'];
                }
                if (!isset($updateData['hostname']) && isset($request->system_info['hostname'])) {
                    $updateData['hostname'] = $request->system_info['hostname'];
                }
            }

            // Handle license_id - validate but don't link yet (edge doesn't exist)
            $requestedLicenseId = null;
            if ($request->has('license_id') && $request->license_id) {
                // Verify license exists and belongs to organization
                $license = License::find($request->license_id);
                if ($license && $license->organization_id == $organizationId) {
                    $updateData['license_id'] = $request->license_id;
                    $requestedLicenseId = $request->license_id;
                } else {
                    // If license doesn't match, keep existing
                    $updateData['license_id'] = $edge->license_id;
                }
            } else {
                // Keep existing license_id if not provided
                $updateData['license_id'] = $edge->license_id;
            }

            // Update edge server (edge is already authenticated by middleware)
            $edge->update($updateData);

            // Now that $edge exists, handle license linking
            if ($requestedLicenseId) {
                $license = License::find($requestedLicenseId);
                if ($license && $license->organization_id == $organizationId) {
                    // Unlink old edge server if license is bound to another edge
                    if ($license->edge_server_id && $license->edge_server_id != $edge->id) {
                        $oldEdge = EdgeServer::find($license->edge_server_id);
                        if ($oldEdge) {
                            $oldEdge->update(['license_id' => null]);
                        }
                    }
                    // Link license to this edge server
                    $license->update(['edge_server_id' => $edge->id]);
                }
            }
            
            // Auto-link first available license if edge doesn't have one
            if (!$edge->license_id) {
                $availableLicense = License::where('organization_id', $organizationId)
                    ->where('status', 'active')
                    ->whereNull('edge_server_id')
                    ->first();
                
                if ($availableLicense) {
                    $edge->update(['license_id' => $availableLicense->id]);
                    $availableLicense->update(['edge_server_id' => $edge->id]);
                }
            } else {
                // Ensure license is linked to this edge server
                $license = License::find($edge->license_id);
                if ($license && $license->edge_server_id != $edge->id) {
                    // Unlink old edge server if exists
                    if ($license->edge_server_id) {
                        $oldEdge = EdgeServer::find($license->edge_server_id);
                        if ($oldEdge && $oldEdge->id != $edge->id) {
                            $oldEdge->update(['license_id' => null]);
                        }
                    }
                    $license->update(['edge_server_id' => $edge->id]);
                }
            }

            // Update camera statuses if provided
            if ($request->has('cameras_status') && is_array($request->cameras_status)) {
                foreach ($request->cameras_status as $cameraStatus) {
                    if (isset($cameraStatus['camera_id']) && isset($cameraStatus['status'])) {
                        try {
                            $camera = \App\Models\Camera::where('camera_id', $cameraStatus['camera_id'])
                                ->where('edge_server_id', $edge->id)
                                ->first();
                            
                            if ($camera) {
                                $oldStatus = $camera->status;
                                $camera->status = $cameraStatus['status'];
                                $camera->save();
                                
                                // CameraObserver will handle offline notification if status changed to offline
                            }
                        } catch (\Exception $e) {
                            // Log but don't fail the heartbeat
                            \Illuminate\Support\Facades\Log::warning('Failed to update camera status', [
                                'camera_id' => $cameraStatus['camera_id'] ?? 'unknown',
                                'error' => $e->getMessage()
                            ]);
                        }
                    }
                }
            }

            // Return edge credentials in response (Edge Server needs these for HMAC signing)
            // SECURITY: edge_secret is returned ONLY ONCE during initial registration
            // After that, it is never returned again to prevent exposure
            $edgeData = $edge->load(['organization', 'license'])->toArray();
            
            // Always return edge_key (it's the identifier)
            $response = [
                'ok' => true,
                'edge' => $edgeData,
                'edge_key' => $edge->edge_key,
            ];
            
            // Return edge_secret ONLY if it hasn't been delivered before
            // Check if secret was already delivered (tracked via secret_delivered_at timestamp)
            $shouldReturnSecret = false;
            
            if ($edge->edge_secret) {
                // Check if this is the first time (secret_delivered_at is null)
                if (!$edge->secret_delivered_at) {
                    // First time - decrypt and return secret, then mark as delivered
                    try {
                        $decryptedSecret = \Illuminate\Support\Facades\Crypt::decryptString($edge->edge_secret);
                        $response['edge_secret'] = $decryptedSecret;
                        $edge->update(['secret_delivered_at' => now()]);
                        \Illuminate\Support\Facades\Log::info('Edge secret delivered for first time', [
                            'edge_server_id' => $edge->id,
                            'edge_key' => $edge->edge_key,
                        ]);
                    } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
                        // If decryption fails, secret may be corrupted - log but don't expose
                        \Illuminate\Support\Facades\Log::error('Failed to decrypt edge_secret', [
                            'edge_server_id' => $edge->id,
                            'edge_key' => $edge->edge_key,
                        ]);
                        // Do not return secret if decryption fails
                    }
                } else {
                    // Secret already delivered - do not return it
                    \Illuminate\Support\Facades\Log::debug('Edge secret not returned - already delivered', [
                        'edge_server_id' => $edge->id,
                        'edge_key' => $edge->edge_key,
                        'delivered_at' => $edge->secret_delivered_at,
                    ]);
                }
            }
            
            return response()->json($response);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Edge heartbeat error', [
                'edge_id' => $request->edge_id ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['password', 'token'])
            ]);
            
            return response()->json([
                'ok' => false,
                'message' => 'An error occurred processing heartbeat',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get cameras for Edge Server (HMAC authenticated)
     * Edge server is authenticated by VerifyEdgeSignature middleware
     */
    public function getCamerasForEdge(Request $request): JsonResponse
    {
        try {
            // Edge server is attached by VerifyEdgeSignature middleware
            $edge = $request->get('edge_server');
            
            if (!$edge) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Edge server not authenticated',
                ], 401);
            }

            // Get cameras for this edge server's organization
            $query = \App\Models\Camera::where('organization_id', $edge->organization_id)
                ->where('edge_server_id', $edge->id);

            $cameras = $query->with(['edgeServer'])
                ->where('status', '!=', 'deleted')
                ->get()
                ->map(function ($camera) {
                    $config = $camera->config ?? [];
                    return [
                        'id' => $camera->id,
                        'camera_id' => $camera->camera_id,
                        'name' => $camera->name,
                        'location' => $camera->location,
                        'rtsp_url' => $camera->rtsp_url,
                        'status' => $camera->status,
                        'edge_server_id' => $camera->edge_server_id,
                        'config' => [
                            'username' => $config['username'] ?? null,
                            'password' => isset($config['password']) ? '***' : null, // Don't expose password
                            'resolution' => $config['resolution'] ?? '1920x1080',
                            'fps' => $config['fps'] ?? 15,
                            'enabled_modules' => $config['enabled_modules'] ?? [],
                        ],
                    ];
                });

            return response()->json([
                'cameras' => $cameras,
                'count' => $cameras->count(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Edge cameras fetch error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'An error occurred fetching cameras'
            ], 500);
        }
    }

    /**
     * Get edge server statistics
     * Mobile app endpoint: GET /edge-servers/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = EdgeServer::query();

        // Filter by organization
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if ($user->organization_id) {
                $query->where('organization_id', $user->organization_id);
            } else {
                // Return empty stats for non-admin users without organization
                return response()->json([
                    'total' => 0,
                    'online' => 0,
                    'offline' => 0,
                ]);
            }
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        $total = (clone $query)->count();
        $online = (clone $query)->where('online', true)->count();
        $offline = $total - $online;

        return response()->json([
            'total' => $total,
            'online' => $online,
            'offline' => $offline,
        ]);
    }
}
