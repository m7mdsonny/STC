<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Models\Organization;
use App\Models\User;
use App\Support\DomainExecutionContext;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CameraService
{
    public function __construct(
        private OrganizationCapabilitiesResolver $capabilities,
        private EdgeServerService $edgeServerService,
    ) {
    }

    public function createCamera(array $data, User $actor): Camera
    {
        // Mark domain service as used for DomainExecutionContext enforcement
        if ($request = request()) {
            DomainExecutionContext::markServiceUsed($request);
        }
        
        $organizationId = $data['organization_id'] ?? $actor->organization_id;
        if (!$organizationId) {
            throw new DomainActionException('organization_id is required', 422);
        }

        $organization = $this->capabilities->ensureCameraCreation($actor, (int) $organizationId);
        $edgeServer = EdgeServer::findOrFail($data['edge_server_id']);

        if ($edgeServer->organization_id !== $organization->id) {
            throw new DomainActionException('Edge server does not belong to this organization', 403);
        }

        $cameraId = $data['camera_id'] ?? 'cam_' . Str::random(16);

        $config = [
            'resolution' => $data['resolution'] ?? '1920x1080',
            'fps' => $data['fps'] ?? 15,
            'enabled_modules' => $data['enabled_modules'] ?? [],
        ];

        // RTSP URL contains credentials inline: rtsp://username:password@ip:port/stream
        // No need to store separate username/password in config
        // For backward compatibility, extract credentials from RTSP URL if needed
        $rtspUrl = $data['rtsp_url'];
        $parsedUrl = parse_url($rtspUrl);
        if (isset($parsedUrl['user']) && isset($parsedUrl['pass'])) {
            // Store credentials in config for backward compatibility (encrypted)
            $config['username'] = $parsedUrl['user'];
            $config['password'] = Crypt::encryptString($parsedUrl['pass']);
        }

        try {
            $camera = DB::transaction(function () use ($data, $organization, $edgeServer, $cameraId, $config) {
                return Camera::create([
                    'organization_id' => $organization->id,
                    'edge_server_id' => $edgeServer->id,
                    'name' => $data['name'],
                    'camera_id' => $cameraId,
                    'rtsp_url' => $data['rtsp_url'],
                    'location' => $data['location'] ?? null,
                    'status' => $data['status'] ?? 'offline',
                    'config' => $config,
                ]);
            });
        } catch (QueryException $e) {
            throw new DomainActionException('Failed to create camera: ' . $e->getMessage(), 500);
        }

        $camera->load(['organization', 'edgeServer']);
        // ⚠️ ARCHITECTURAL FIX: Cloud must never push to Edge.
        // Camera sync happens via Edge-initiated heartbeat sync, not Cloud push.
        // $this->edgeServerService->syncCameraToEdge($camera); // DEPRECATED - Camera config provided via heartbeat response

        return $camera;
    }

    public function updateCamera(Camera $camera, array $data, User $actor): Camera
    {
        // Mark domain service as used for DomainExecutionContext enforcement
        if ($request = request()) {
            DomainExecutionContext::markServiceUsed($request);
        }
        
        $this->capabilities->ensureCameraCreation($actor, $camera->organization_id);

        $config = $camera->config ?? [];
        $config['resolution'] = $data['resolution'] ?? ($config['resolution'] ?? '1920x1080');
        $config['fps'] = $data['fps'] ?? ($config['fps'] ?? 15);
        $config['enabled_modules'] = $data['enabled_modules'] ?? ($config['enabled_modules'] ?? []);

        // RTSP URL contains credentials inline: rtsp://username:password@ip:port/stream
        // Extract credentials from RTSP URL if provided
        if (isset($data['rtsp_url'])) {
            $parsedUrl = parse_url($data['rtsp_url']);
            if (isset($parsedUrl['user']) && isset($parsedUrl['pass'])) {
                $config['username'] = $parsedUrl['user'];
                $config['password'] = Crypt::encryptString($parsedUrl['pass']);
            }
        }

        $payload = $data;
        $payload['config'] = $config;

        DB::transaction(function () use ($camera, $payload) {
            $camera->update($payload);
        });

        $camera->load(['organization', 'edgeServer']);
        // ⚠️ ARCHITECTURAL FIX: Cloud must never push to Edge.
        // Camera sync happens via Edge-initiated heartbeat sync, not Cloud push.
        // $this->edgeServerService->syncCameraToEdge($camera); // DEPRECATED - Camera config provided via heartbeat response

        return $camera;
    }

    public function deleteCamera(Camera $camera, User $actor): void
    {
        // Mark domain service as used for DomainExecutionContext enforcement
        if ($request = request()) {
            DomainExecutionContext::markServiceUsed($request);
        }
        
        $this->capabilities->ensureCameraCreation($actor, $camera->organization_id);

        DB::transaction(function () use ($camera) {
            $camera->delete();
        });
    }
}
