<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\EdgeServer;
use App\Models\EdgeServerLog;
use App\Models\License;
use Illuminate\Support\Str;

class EdgeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = EdgeServer::query();

        // Organization users can only see their org's edge servers
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
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
            $query->where('online', $request->get('status') === 'online');
        }

        $perPage = (int) $request->get('per_page', 15);

        return response()->json($query->with(['organization', 'license'])->orderByDesc('last_seen_at')->paginate($perPage));
    }

    public function show(EdgeServer $edgeServer): JsonResponse
    {
        return response()->json($edgeServer);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Auto-set organization_id for non-super-admin users
        $organizationId = $user->organization_id;
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false) && $request->filled('organization_id')) {
            $organizationId = $request->get('organization_id');
        }
        
        if (!$organizationId) {
            return response()->json(['message' => 'Organization ID is required'], 422);
        }
        
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'organization_id' => 'sometimes|exists:organizations,id',
            'license_id' => 'nullable|exists:licenses,id',
            'edge_id' => 'nullable|string|unique:edge_servers,edge_id',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        // Override organization_id with auto-detected value
        $data['organization_id'] = $organizationId;

        // Organization users can only create edge servers for their organization
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if (!$user->organization_id) {
                return response()->json(['message' => 'User must belong to an organization'], 403);
            }
            if ((int) $organizationId !== (int) $user->organization_id) {
                return response()->json(['message' => 'You can only create edge servers for your organization'], 403);
            }
            // Only owners and admins can create edge servers
            if (!RoleHelper::canManageOrganization($user->role)) {
                return response()->json(['message' => 'Insufficient permissions to create edge servers'], 403);
            }
        }

        // If license_id provided, verify it belongs to the organization
        if (!empty($data['license_id'])) {
            $license = \App\Models\License::findOrFail($data['license_id']);
            if ($license->organization_id !== (int) $organizationId) {
                return response()->json(['message' => 'License does not belong to the specified organization'], 403);
            }

            // Check if license is already bound to another edge server
            $existingEdge = EdgeServer::where('license_id', $data['license_id'])
                ->where('id', '!=', $request->get('edge_id')) // Exclude current if updating
                ->first();
            if ($existingEdge) {
                return response()->json(['message' => 'License is already bound to another edge server'], 409);
            }
        }

        $edgeServer = EdgeServer::create([
            'name' => $data['name'],
            'organization_id' => $organizationId,
            'license_id' => $data['license_id'] ?? null,
            'edge_id' => $data['edge_id'] ?? Str::uuid()->toString(),
            'location' => $data['location'] ?? null,
            'notes' => $data['notes'] ?? null,
            'online' => false,
        ]);

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

        return response()->json($edgeServer->load(['organization', 'license']), 201);
    }

    public function update(Request $request, EdgeServer $edgeServer): JsonResponse
    {
        $user = $request->user();

        // Check ownership and permissions
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess($request, $edgeServer->organization_id);
            if (!RoleHelper::canManageOrganization($user->role)) {
                return response()->json(['message' => 'Insufficient permissions to update edge servers'], 403);
            }
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'license_id' => 'nullable|exists:licenses,id',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'online' => 'nullable|boolean',
            'system_info' => 'nullable|array',
            'version' => 'nullable|string',
        ]);

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
        $user = request()->user();

        // Check ownership and permissions
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $edgeServer->organization_id);
            if (!RoleHelper::canManageOrganization($user->role)) {
                return response()->json(['message' => 'Insufficient permissions to delete edge servers'], 403);
            }
        }

        $edgeServer->delete();
        return response()->json(['message' => 'Edge server deleted']);
    }

    public function logs(Request $request, EdgeServer $edgeServer): JsonResponse
    {
        $query = EdgeServerLog::where('edge_server_id', $edgeServer->id);

        if ($request->filled('level')) {
            $query->where('level', $request->get('level'));
        }

        return response()->json($query->orderByDesc('created_at')->paginate((int) $request->get('per_page', 15)));
    }

    public function restart(EdgeServer $edgeServer): JsonResponse
    {
        EdgeServerLog::create([
            'edge_server_id' => $edgeServer->id,
            'level' => 'info',
            'message' => 'Restart requested from control panel',
            'meta' => ['requested_at' => now()->toIso8601String()],
        ]);

        return response()->json(['message' => 'Restart signal queued']);
    }

    public function syncConfig(EdgeServer $edgeServer): JsonResponse
    {
        EdgeServerLog::create([
            'edge_server_id' => $edgeServer->id,
            'level' => 'info',
            'message' => 'Configuration sync requested',
            'meta' => ['requested_at' => now()->toIso8601String()],
        ]);

        return response()->json(['message' => 'Sync request recorded']);
    }

    public function config(EdgeServer $edgeServer): JsonResponse
    {
        return response()->json($edgeServer->system_info ?? []);
    }

    public function heartbeat(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'edge_id' => 'required|string',
                'version' => 'required|string',
                'online' => 'required|boolean',
                'organization_id' => 'required|integer|exists:organizations,id',
                'license_id' => 'sometimes|nullable|integer|exists:licenses,id',
                'system_info' => 'sometimes|nullable|array',
                'cameras_status' => 'nullable|array', // Array of {camera_id: string, status: 'online'|'offline'}
            ]);

            $existingEdge = EdgeServer::where('edge_id', $request->edge_id)->first();

            $organizationId = $request->get('organization_id', $existingEdge?->organization_id);

            if ($organizationId === null) {
                return response()->json([
                    'ok' => false,
                    'message' => 'organization_id is required for new edge registrations',
                ], 422);
            }

            // Verify organization exists
            $organization = \App\Models\Organization::find($organizationId);
            if (!$organization) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Organization not found',
                ], 404);
            }

            // Prepare update data
            $updateData = [
                'organization_id' => $organizationId,
                'version' => $request->version,
                'online' => $request->boolean('online'),
                'last_seen_at' => now(),
            ];

            // Handle license_id
            if ($request->has('license_id') && $request->license_id) {
                // Verify license exists and belongs to organization
                $license = License::find($request->license_id);
                if ($license && $license->organization_id == $organizationId) {
                    $updateData['license_id'] = $request->license_id;
                    // Link license to edge server
                    if ($license->edge_server_id != $edge->id) {
                        // Unlink old edge server if exists
                        if ($license->edge_server_id) {
                            $oldEdge = EdgeServer::find($license->edge_server_id);
                            if ($oldEdge && $oldEdge->id != $edge->id) {
                                $oldEdge->update(['license_id' => null]);
                            }
                        }
                        $license->update(['edge_server_id' => $edge->id]);
                    }
                } else {
                    // If license doesn't match, use existing or null
                    $updateData['license_id'] = $existingEdge?->license_id;
                }
            } else {
                // Keep existing license_id if not provided
                $updateData['license_id'] = $existingEdge?->license_id;
            }

            // Handle system_info
            if ($request->has('system_info') && is_array($request->system_info)) {
                $updateData['system_info'] = $request->system_info;
            }

            // Create or update edge server
            $edge = EdgeServer::updateOrCreate(
                ['edge_id' => $request->edge_id],
                $updateData
            );
            
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

            return response()->json([
                'ok' => true,
                'edge' => [
                    'id' => $edge->id,
                    'edge_id' => $edge->edge_id,
                    'organization_id' => $edge->organization_id,
                    'license_id' => $edge->license_id,
                    'online' => $edge->online,
                    'version' => $edge->version,
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Edge heartbeat error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'ok' => false,
                'message' => 'An error occurred processing heartbeat'
            ], 500);
        }
    }

    /**
     * Get cameras for Edge Server (public endpoint - requires organization_id)
     * This allows Edge Server to sync cameras without authentication
     */
    public function getCamerasForEdge(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'organization_id' => 'required|integer|exists:organizations,id',
                'edge_id' => 'sometimes|string',
            ]);

            $organizationId = $request->get('organization_id');
            $edgeId = $request->get('edge_id');

            $query = \App\Models\Camera::where('organization_id', $organizationId);

            // If edge_id provided, filter by edge server
            if ($edgeId) {
                $edgeServer = EdgeServer::where('edge_id', $edgeId)->first();
                if ($edgeServer) {
                    $query->where('edge_server_id', $edgeServer->id);
                }
            }

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
}
