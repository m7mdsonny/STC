<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Models\Organization;
use App\Services\EdgeServerService;
use App\Services\SubscriptionService;
use App\Http\Requests\CameraStoreRequest;
use App\Http\Requests\CameraUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class CameraController extends Controller
{
    protected SubscriptionService $subscriptionService;

    public function __construct(SubscriptionService $subscriptionService)
    {
        $this->subscriptionService = $subscriptionService;
    }
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Camera::query();

        // Organization owners/admins can only see their org's cameras
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        if ($request->filled('edge_server_id')) {
            $query->where('edge_server_id', $request->get('edge_server_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('location', 'LIKE', "%{$search}%")
                    ->orWhere('camera_id', 'LIKE', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        $cameras = $query->with(['organization', 'edgeServer'])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        // Transform response to include config fields at top level for frontend compatibility
        $cameras->getCollection()->transform(function ($camera) {
            $config = $camera->config ?? [];
            $camera->username = $config['username'] ?? null;
            $camera->password_encrypted = isset($config['password']) ? '***' : null; // Don't expose password
            $camera->resolution = $config['resolution'] ?? '1920x1080';
            $camera->fps = $config['fps'] ?? 15;
            $camera->enabled_modules = $config['enabled_modules'] ?? [];
            return $camera;
        });

        return response()->json($cameras);
    }

    public function show(Camera $camera): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('view', $camera);

        $camera->load(['organization', 'edgeServer']);
        return response()->json($camera);
    }

    public function store(CameraStoreRequest $request): JsonResponse
    {
        // Authorization is handled by CameraStoreRequest
        $data = $request->validated();
        
        $user = $request->user();
        $organizationId = $data['organization_id'] ?? $user->organization_id;

        // Verify edge server belongs to organization
        $edgeServer = EdgeServer::findOrFail($data['edge_server_id']);
        if ($edgeServer->organization_id !== (int) $organizationId) {
            return response()->json(['message' => 'Edge server does not belong to your organization'], 403);
        }

        // Check subscription limit (skip for super admin)
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $organization = Organization::findOrFail($organizationId);
            $currentCameraCount = Camera::where('organization_id', $organizationId)->count();
            $limitCheck = $this->subscriptionService->checkLimit($organization, 'cameras', $currentCameraCount);
            
            if (!$limitCheck['allowed']) {
                return response()->json([
                    'message' => 'Camera limit exceeded',
                    'error' => 'subscription_limit_exceeded',
                    'limit_type' => 'cameras',
                    'current' => $limitCheck['current'],
                    'limit' => $limitCheck['limit'],
                ], 403);
            }
        }

        // Check subscription limit enforcement
        try {
            $org = Organization::findOrFail($organizationId);
            $subscriptionService = app(SubscriptionService::class);
            $subscriptionService->assertCanCreateCamera($org);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 403);
        }

        // Generate unique camera_id if not provided
        $cameraId = $request->get('camera_id', 'cam_' . Str::random(16));

        // Store sensitive and config data in config JSON field
        $config = [
            'resolution' => $data['resolution'] ?? '1920x1080',
            'fps' => $data['fps'] ?? 15,
            'enabled_modules' => $data['enabled_modules'] ?? [],
        ];

        // Encrypt and store password if provided
        if (isset($data['password']) && $data['password']) {
            $config['password'] = Crypt::encryptString($data['password']);
        }

        if (isset($data['username'])) {
            $config['username'] = $data['username'];
        }

        $camera = Camera::create([
            'organization_id' => $organizationId,
            'edge_server_id' => $data['edge_server_id'],
            'name' => $data['name'],
            'camera_id' => $cameraId,
            'rtsp_url' => $data['rtsp_url'],
            'location' => $data['location'] ?? null,
            'status' => $data['status'] ?? 'offline',
            'config' => $config,
        ]);

        $camera->load(['organization', 'edgeServer']);

        // Sync camera configuration to Edge Server
        try {
            $edgeService = new EdgeServerService();
            $syncResult = $edgeService->syncCameraToEdge($camera);
            
            if (!$syncResult) {
                \Log::warning("Camera {$camera->id} created but failed to sync to Edge Server");
                // Don't fail the request, but log the issue
            } else {
                \Log::info("Camera {$camera->id} successfully synced to Edge Server {$camera->edge_server_id}");
            }
        } catch (\Exception $e) {
            // Log error but don't fail the request
            \Log::error("Failed to sync camera to Edge: {$e->getMessage()}", [
                'camera_id' => $camera->id,
                'edge_server_id' => $camera->edge_server_id,
                'exception' => $e
            ]);
        }

        return response()->json($camera, 201);
    }

    public function update(CameraUpdateRequest $request, Camera $camera): JsonResponse
    {
        // Authorization is handled by CameraUpdateRequest
        $data = $request->validated();

        // Verify edge server belongs to organization if changed
        if (isset($data['edge_server_id'])) {
            $edgeServer = EdgeServer::findOrFail($data['edge_server_id']);
            if ($edgeServer->organization_id !== $camera->organization_id) {
                return response()->json(['message' => 'Edge server does not belong to your organization'], 403);
            }
        }

        // Update config JSON field
        $config = $camera->config ?? [];
        
        if (isset($data['resolution'])) {
            $config['resolution'] = $data['resolution'];
            unset($data['resolution']);
        }
        if (isset($data['fps'])) {
            $config['fps'] = $data['fps'];
            unset($data['fps']);
        }
        if (isset($data['enabled_modules'])) {
            $config['enabled_modules'] = $data['enabled_modules'];
            unset($data['enabled_modules']);
        }
        if (isset($data['username'])) {
            $config['username'] = $data['username'];
            unset($data['username']);
        }
        if (isset($data['password']) && $data['password']) {
            $config['password'] = Crypt::encryptString($data['password']);
            unset($data['password']);
        }

        $data['config'] = $config;

        $camera->update($data);
        $camera->load(['organization', 'edgeServer']);

        // Sync updated camera configuration to Edge Server
        try {
            $edgeService = new EdgeServerService();
            $syncResult = $edgeService->syncCameraToEdge($camera);
            
            if (!$syncResult) {
                \Log::warning("Camera {$camera->id} updated but failed to sync to Edge Server");
            } else {
                \Log::info("Camera {$camera->id} update successfully synced to Edge Server");
            }
        } catch (\Exception $e) {
            \Log::error("Failed to sync camera update to Edge: {$e->getMessage()}", [
                'camera_id' => $camera->id,
                'edge_server_id' => $camera->edge_server_id,
                'exception' => $e
            ]);
        }

        return response()->json($camera);
    }

    public function destroy(Camera $camera): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('delete', $camera);

        // Remove camera from Edge Server before deleting
        try {
            $edgeService = new EdgeServerService();
            $edgeService->removeCameraFromEdge($camera);
        } catch (\Exception $e) {
            \Log::warning("Failed to remove camera from Edge: {$e->getMessage()}");
        }

        $camera->delete();

        return response()->json(['message' => 'Camera deleted']);
    }

    public function getSnapshot(Camera $camera): JsonResponse
    {
        $user = request()->user();

        // Check ownership
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $camera->organization_id);
        }

        // Get snapshot from Edge Server
        try {
            $edgeService = new EdgeServerService();
            $snapshot = $edgeService->getCameraSnapshot($camera);
            
            if ($snapshot) {
                // Ensure snapshot_url is present for frontend compatibility
                $response = $snapshot;
                if (isset($snapshot['image']) && !isset($snapshot['snapshot_url'])) {
                    $response['snapshot_url'] = $snapshot['image'];
                }
                return response()->json($response);
            }
        } catch (\Exception $e) {
            \Log::warning("Failed to get camera snapshot: {$e->getMessage()}");
        }

        // Return placeholder if Edge Server unavailable
        return response()->json([
            'image' => null,
            'timestamp' => now()->toIso8601String(),
            'camera_id' => $camera->camera_id,
            'error' => 'Edge Server unavailable',
        ]);
    }

    /**
     * Get HLS stream URL for camera
     */
    public function getStreamUrl(Camera $camera): JsonResponse
    {
        $user = request()->user();

        // Check ownership
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $camera->organization_id);
        }

        $edgeService = new EdgeServerService();
        $hlsUrl = $edgeService->getHlsStreamUrl($camera);
        $webrtcEndpoint = $edgeService->getWebRtcEndpoint($camera);

        return response()->json([
            'stream_url' => $hlsUrl, // For frontend compatibility
            'hls_url' => $hlsUrl,
            'webrtc_endpoint' => $webrtcEndpoint,
            'camera_id' => $camera->camera_id,
        ]);
    }

    /**
     * Test camera connection
     */
    public function testConnection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rtsp_url' => 'required|string|url',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
        ]);

        // Basic validation - in production, you might want to actually test the RTSP connection
        // For now, we'll just validate the URL format
        try {
            $parsedUrl = parse_url($data['rtsp_url']);
            if (!$parsedUrl || !isset($parsedUrl['scheme']) || !in_array($parsedUrl['scheme'], ['rtsp', 'http', 'https'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid RTSP URL format',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'RTSP URL format is valid',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate RTSP URL: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get camera statistics
     * Mobile app endpoint: GET /cameras/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Camera::query();

        // Filter by organization
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } elseif (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            // Return empty stats for non-admin users without organization
            return response()->json([
                'total' => 0,
                'online' => 0,
                'offline' => 0,
            ]);
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        $total = (clone $query)->count();
        $online = (clone $query)->where('status', 'online')->count();
        $offline = $total - $online;

        return response()->json([
            'total' => $total,
            'online' => $online,
            'offline' => $offline,
        ]);
    }
}

