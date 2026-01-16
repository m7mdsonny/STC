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
        private PlanEnforcementService $planEnforcementService
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
        try {
            $this->authorize('delete', $camera);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            \Log::warning('Unauthorized delete attempt', [
                'camera_id' => $camera->id,
                'actor_id' => request()->user()?->id,
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            if (!$camera->exists) {
                return response()->json(['message' => 'Camera not found'], 404);
            }

            $this->cameraService->deleteCamera($camera, request()->user());
            return response()->json(['message' => 'Deleted successfully'], 200);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Failed to delete camera {$camera->id}: " . $e->getMessage());
            
            if ($e->getCode() == 23000) {
                return response()->json([
                    'error' => 'فشل الحذف: لا يمكن حذف الكاميرا لوجود سجلات مرتبطة بها'
                ], 422);
            }
            
            return response()->json([
                'error' => 'فشل الحذف: ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            \Log::error("Failed to delete camera {$camera->id}: " . $e->getMessage());
            return response()->json(['error' => 'فشل الحذف: ' . $e->getMessage()], 500);
        }
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

