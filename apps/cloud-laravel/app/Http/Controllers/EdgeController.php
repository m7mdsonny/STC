<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Http\Requests\EdgeServerStoreRequest;
use App\Http\Requests\EdgeServerUpdateRequest;
use App\Exceptions\DomainActionException;
use App\Services\EdgeServerService;
use App\Services\PlanEnforcementService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\EdgeServer;
use App\Models\EdgeServerLog;

class EdgeController extends Controller
{
    public function __construct(
        private EdgeServerService $edgeServerService,
        private PlanEnforcementService $planEnforcementService
    ) {
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
        $data = $request->validated();
        $user = $request->user();

        // Note: Plan enforcement is handled inside EdgeServerService::createEdgeServer()
        // via OrganizationCapabilitiesResolver::ensureEdgeServerCreation()

        try {
            $result = $this->edgeServerService->createEdgeServer($data, $user);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        $edgeServer = $result['edge_server'];
        $response = $edgeServer->toArray();
        unset($response['edge_secret']);
        $response['edge_key'] = $result['edge_key'];
        $response['edge_secret'] = $result['edge_secret'];

        return response()->json($response, 201);
    }

    public function update(EdgeServerUpdateRequest $request, EdgeServer $edgeServer): JsonResponse
    {
        $data = $request->validated();

        try {
            $updated = $this->edgeServerService->updateEdgeServer($edgeServer, $data, $request->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json($updated);
    }

    public function destroy(EdgeServer $edgeServer): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('delete', $edgeServer);

        try {
            $this->edgeServerService->deleteEdgeServer($edgeServer, request()->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

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
                // For initial registration, edge_id or license_id must be provided
                $edgeId = $request->input('edge_id');
                $organizationId = $request->input('organization_id');
                $licenseId = $request->input('license_id');
                
                // Try to find Edge Server by edge_id first
                if ($edgeId) {
                    $edge = EdgeServer::where('edge_id', $edgeId)->first();
                } else {
                    $edge = null;
                }
                
                // If not found by edge_id, try to find by license_id and organization_id
                // CRITICAL: Match by license_id regardless of last_seen_at status
                // This allows re-registration even if edge was offline before
                if (!$edge && $licenseId && $organizationId) {
                    // Find edge server by license_id - prioritize servers without credentials
                    // But also allow servers that have credentials (for re-registration)
                    $edge = EdgeServer::where('license_id', $licenseId)
                        ->where('organization_id', $organizationId)
                        ->orderByRaw('CASE WHEN edge_secret IS NULL OR edge_secret = "" THEN 0 ELSE 1 END')
                        ->orderBy('created_at', 'desc')
                        ->first();
                    
                    // If found, update edge_id to match what Edge Server sent
                    if ($edge && $edgeId) {
                        $edge->edge_id = $edgeId;
                        $edge->save();
                    }
                }
                
                // If still not found, try to find any edge server for this organization
                // Match by organization_id and license_id (if provided) or without license_id
                if (!$edge && $organizationId) {
                    $edge = EdgeServer::where('organization_id', $organizationId)
                        ->where(function($query) use ($licenseId) {
                            if ($licenseId) {
                                // Match servers with same license_id, or servers without license_id
                                $query->where('license_id', $licenseId)
                                      ->orWhereNull('license_id');
                            } else {
                                // If no license_id provided, match servers without license_id
                                $query->whereNull('license_id');
                            }
                        })
                        ->orderByRaw('CASE WHEN edge_secret IS NULL OR edge_secret = "" THEN 0 ELSE 1 END')
                        ->orderBy('created_at', 'desc') // Get most recently created
                        ->first();
                    
                    // If found, update edge_id and license_id
                    if ($edge) {
                        if ($edgeId) {
                            $edge->edge_id = $edgeId;
                        }
                        if ($licenseId && !$edge->license_id) {
                            $edge->license_id = $licenseId;
                        }
                        $edge->save();
                    }
                }
                
                if (!$edge) {
                    // Log available edge servers for debugging
                    $availableEdges = EdgeServer::where('organization_id', $organizationId)
                        ->with('license')
                        ->get(['id', 'name', 'edge_id', 'license_id', 'last_seen_at', 'organization_id'])
                        ->map(function($e) {
                            return [
                                'id' => $e->id,
                                'name' => $e->name,
                                'edge_id' => $e->edge_id,
                                'license_id' => $e->license_id,
                                'has_last_seen' => !is_null($e->last_seen_at),
                            ];
                        });
                    
                    \Illuminate\Support\Facades\Log::warning('Edge server not found for heartbeat', [
                        'request_edge_id' => $edgeId,
                        'request_license_id' => $licenseId,
                        'request_organization_id' => $organizationId,
                        'available_edges' => $availableEdges->toArray(),
                    ]);
                    
                    return response()->json([
                        'ok' => false,
                        'message' => 'Edge server not found. Please create the Edge Server in the web portal first, or ensure you provide the correct license_id and organization_id.',
                        'debug' => [
                            'requested_edge_id' => $edgeId,
                            'requested_license_id' => $licenseId,
                            'requested_organization_id' => $organizationId,
                            'available_edges_count' => $availableEdges->count(),
                        ],
                    ], 404);
                }
                
                // If edge already has credentials and was registered AND is currently online (within 5 min), require HMAC
                // But allow re-registration if edge has been offline for more than 5 minutes
                $isCurrentlyOnline = false;
                if ($edge->last_seen_at) {
                    $minutesSinceLastSeen = now()->diffInMinutes($edge->last_seen_at);
                    $isCurrentlyOnline = $minutesSinceLastSeen < 5;
                }
                
                if ($edge->edge_key && $edge->edge_secret && $isCurrentlyOnline) {
                    // Edge is currently online - require HMAC for security
                    return response()->json([
                        'ok' => false,
                        'message' => 'HMAC authentication required. This edge server is already registered and online.',
                    ], 401);
                }
                
                // If edge has credentials but is offline, allow re-registration (will update edge_id if needed)
                // This handles cases where edge server was offline and is coming back online
            }
            
            if (!$edge) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Edge server not found',
                ], 404);
            }

            // Ensure organization_id is set (may be missing for newly created Edge Servers)
            $organizationId = $edge->organization_id ?? $request->input('organization_id');
            if (!$organizationId) {
                \Illuminate\Support\Facades\Log::error('Edge heartbeat: organization_id missing', [
                    'edge_id' => $edge->id,
                    'edge_server_name' => $edge->name,
                    'request_organization_id' => $request->input('organization_id'),
                ]);
                return response()->json([
                    'ok' => false,
                    'message' => 'Organization ID is required. Please ensure Edge Server is properly configured.',
                ], 400);
            }
            
            // If edge doesn't have organization_id, set it from request
            if (!$edge->organization_id && $organizationId) {
                $edge->organization_id = $organizationId;
                $edge->save();
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

    /**
     * Get Edge Server status (for frontend consumption)
     * This endpoint queries the database, NOT the Edge Server directly.
     * Edge status is derived from last heartbeat timestamp.
     * 
     * ARCHITECTURE: Cloud NEVER connects to Edge directly.
     * Edge sends heartbeat to Cloud via POST /api/v1/edges/heartbeat
     */
    public function status(EdgeServer $edgeServer): JsonResponse
    {
        $this->authorize('view', $edgeServer);

        $edgeServer->load(['organization', 'license']);
        
        // Calculate online status based on last_seen_at
        // Edge is considered online if last heartbeat was within 5 minutes
        $heartbeatTimeoutMinutes = 5;
        $isOnline = false;
        $lastSeen = $edgeServer->last_seen_at;
        
        if ($lastSeen) {
            $minutesAgo = now()->diffInMinutes($lastSeen);
            $isOnline = $minutesAgo < $heartbeatTimeoutMinutes;
        }

        // Get camera count for this edge server
        $camerasCount = \App\Models\Camera::where('edge_server_id', $edgeServer->id)->count();

        return response()->json([
            'online' => $isOnline,
            'last_seen_at' => $lastSeen?->toIso8601String(),
            'version' => $edgeServer->version,
            'uptime' => $edgeServer->system_info['uptime'] ?? null,
            'cameras_count' => $camerasCount,
            'organization_id' => $edgeServer->organization_id,
            'license' => [
                'plan' => $edgeServer->license?->plan ?? null,
                'max_cameras' => $edgeServer->license?->max_cameras ?? null,
                'modules' => $edgeServer->license?->modules ?? [],
            ],
            'system_info' => $edgeServer->system_info ?? [],
        ]);
    }

    /**
     * Get cameras for a specific Edge Server (for frontend consumption)
     * This endpoint queries the database, NOT the Edge Server directly.
     * Camera status is updated via Edge heartbeat.
     * 
     * ARCHITECTURE: Cloud NEVER connects to Edge directly.
     * Edge reports camera status via heartbeat POST /api/v1/edges/heartbeat
     */
    public function cameras(Request $request, EdgeServer $edgeServer): JsonResponse
    {
        $this->authorize('view', $edgeServer);

        $query = \App\Models\Camera::where('edge_server_id', $edgeServer->id);

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $perPage = (int) $request->get('per_page', 100);
        $cameras = $query->with(['organization', 'edgeServer'])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        // Transform response
        $cameras->getCollection()->transform(function ($camera) {
            $config = $camera->config ?? [];
            $camera->username = $config['username'] ?? null;
            $camera->password_encrypted = isset($config['password']) ? '***' : null;
            $camera->resolution = $config['resolution'] ?? '1920x1080';
            $camera->fps = $config['fps'] ?? 15;
            $camera->enabled_modules = $config['enabled_modules'] ?? [];
            return $camera;
        });

        return response()->json($cameras);
    }
}
