<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Models\Organization;
use App\Exceptions\DomainActionException;
use App\Services\CameraService;
use App\Services\EdgeServerService;
use App\Services\PlanEnforcementService;
use App\Http\Requests\CameraStoreRequest;
use App\Http\Requests\CameraUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class CameraController extends Controller
{
    public function __construct(
        private CameraService $cameraService,
        private PlanEnforcementService $planEnforcementService,
        private EdgeServerService $edgeServerService
    ) {
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
            // CRITICAL: Map status to is_online for mobile app compatibility
            // Real status from database (updated via heartbeat from edge server)
            $camera->is_online = $camera->status === 'online';
            return $camera;
        });

        return response()->json($cameras);
    }

    public function show(Camera $camera): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('view', $camera);

        $camera->load(['organization', 'edgeServer']);
        
        // CRITICAL: Map status to is_online for mobile app compatibility
        // Real status from database (updated via heartbeat from edge server)
        $camera->is_online = $camera->status === 'online';
        
        return response()->json($camera);
    }

    public function store(CameraStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Note: Plan enforcement is handled inside CameraService::createCamera()
        // via OrganizationCapabilitiesResolver::ensureCameraCreation()

        try {
            $camera = $this->cameraService->createCamera($data, $request->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json($camera, 201);
    }

    public function update(CameraUpdateRequest $request, Camera $camera): JsonResponse
    {
        $data = $request->validated();

        try {
            $camera = $this->cameraService->updateCamera($camera, $data, $request->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

        return response()->json($camera);
    }

    public function destroy(Camera $camera): JsonResponse
    {
        // Use Policy for authorization
        $this->authorize('delete', $camera);

        try {
            $this->cameraService->deleteCamera($camera, request()->user());
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }

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
            $snapshot = $this->edgeServerService->getCameraSnapshot($camera);
            
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

        $hlsUrl = $this->edgeServerService->getHlsStreamUrl($camera);
        $webrtcEndpoint = $this->edgeServerService->getWebRtcEndpoint($camera);

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
            'rtsp_url' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    // Validate RTSP URL format with credentials inline
                    // Format: rtsp://[username:password@]host[:port]/path
                    if (!preg_match('/^rtsp:\/\/(?:[^:@]+:[^@]+@)?[^:\/]+(?::\d+)?\/.+$/', $value)) {
                        $fail('The RTSP URL must be in the format: rtsp://username:password@ip:port/stream');
                    }
                },
            ],
        ]);

        // Validate RTSP URL format
        try {
            $parsedUrl = parse_url($data['rtsp_url']);
            if (!$parsedUrl || !isset($parsedUrl['scheme']) || $parsedUrl['scheme'] !== 'rtsp') {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid RTSP URL format. Must start with rtsp://',
                ], 422);
            }

            // Check if URL has host and path
            if (!isset($parsedUrl['host']) || !isset($parsedUrl['path'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid RTSP URL format. Must include host and path.',
                ], 422);
            }

            // Note: Actual RTSP connection test should be done by Edge Server
            // Cloud only validates URL format
            return response()->json([
                'success' => true,
                'message' => 'RTSP URL format is valid. Connection will be tested by Edge Server.',
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

