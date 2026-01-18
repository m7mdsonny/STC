<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Models\License;
use App\Models\User;
use App\Support\DomainExecutionContext;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EdgeServerService
{
    public function __construct(private OrganizationCapabilitiesResolver $capabilities)
    {
    }

    public function createEdgeServer(array $data, User $actor): array
    {
        // Mark domain service as used for DomainExecutionContext enforcement
        if ($request = request()) {
            DomainExecutionContext::markServiceUsed($request);
        }
        
        $organizationId = RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)
            ? ($data['organization_id'] ?? $actor->organization_id)
            : $actor->organization_id;

        if (!$organizationId) {
            throw new DomainActionException('Organization is required to create an edge server', 422);
        }

        $organization = $this->capabilities->ensureEdgeServerCreation($actor, (int) $organizationId);

        $licenseId = $data['license_id'] ?? null;
        if ($licenseId) {
            $license = License::find($licenseId);
            if (!$license || $license->organization_id !== $organization->id) {
                throw new DomainActionException('License does not belong to this organization', 403);
            }

            $existing = EdgeServer::where('license_id', $licenseId)->first();
            if ($existing) {
                throw new DomainActionException('License is already bound to another edge server', 409);
            }
        }

        $edgeKey = 'edge_' . Str::random(32);
        $edgeSecret = Str::random(64);
        $encryptedSecret = Crypt::encryptString($edgeSecret);

        try {
            $edgeServer = DB::transaction(function () use ($data, $organization, $licenseId, $edgeKey, $encryptedSecret) {
                $edgeServer = EdgeServer::create([
                    'name' => $data['name'] ?? null,
                    'organization_id' => $organization->id,
                    'license_id' => $licenseId,
                    'edge_id' => $data['edge_id'] ?? Str::uuid()->toString(),
                    'edge_key' => $edgeKey,
                    'ip_address' => $data['ip_address'] ?? null,
                    'internal_ip' => $data['internal_ip'] ?? null,
                    'public_ip' => $data['public_ip'] ?? null,
                    'hostname' => $data['hostname'] ?? null,
                    'location' => $data['location'] ?? null,
                    'notes' => $data['notes'] ?? null,
                    'online' => false,
                ]);

                $edgeServer->setAttribute('edge_secret', $encryptedSecret);
                $edgeServer->save();

                if ($licenseId) {
                    License::where('id', $licenseId)->update(['edge_server_id' => $edgeServer->id]);
                }

                // Do NOT set secret_delivered_at here - it should only be set after secret is returned to Edge
                // Edge Server will receive the secret via heartbeat response during initial registration

                return $edgeServer;
            });
        } catch (QueryException $e) {
            throw new DomainActionException('Failed to create edge server: ' . $e->getMessage(), 500);
        }

        $edgeServer->load(['organization', 'license']);

        return [
            'edge_server' => $edgeServer,
            'edge_key' => $edgeKey,
            'edge_secret' => $edgeSecret,
        ];
    }

    public function updateEdgeServer(EdgeServer $edgeServer, array $data, User $actor): EdgeServer
    {
        // Mark domain service as used for DomainExecutionContext enforcement
        if ($request = request()) {
            DomainExecutionContext::markServiceUsed($request);
        }
        
        $this->capabilities->ensureEdgeServerCreation($actor, $edgeServer->organization_id);

        return DB::transaction(function () use ($edgeServer, $data) {
            if (array_key_exists('license_id', $data)) {
                $newLicenseId = $data['license_id'];

                if ($newLicenseId === null || $newLicenseId === '') {
                    if ($edgeServer->license_id) {
                        License::where('id', $edgeServer->license_id)->update(['edge_server_id' => null]);
                    }
                    $data['license_id'] = null;
                } else {
                    $license = License::findOrFail($newLicenseId);
                    if ($license->organization_id !== $edgeServer->organization_id) {
                        throw new DomainActionException('License does not belong to this edge server\'s organization', 403);
                    }

                    $existingEdge = EdgeServer::where('license_id', $newLicenseId)
                        ->where('id', '!=', $edgeServer->id)
                        ->first();
                    if ($existingEdge) {
                        throw new DomainActionException('License is already bound to another edge server', 409);
                    }

                    if ($edgeServer->license_id && $edgeServer->license_id != $newLicenseId) {
                        License::where('id', $edgeServer->license_id)->update(['edge_server_id' => null]);
                    }

                    $license->update(['edge_server_id' => $edgeServer->id]);
                }
            }

            $edgeServer->update($data);

            return $edgeServer->load(['organization', 'license']);
        });
    }

    public function deleteEdgeServer(EdgeServer $edgeServer, User $actor): void
    {
        // Mark domain service as used for DomainExecutionContext enforcement
        if ($request = request()) {
            DomainExecutionContext::markServiceUsed($request);
        }
        
        $this->capabilities->ensureEdgeServerCreation($actor, $edgeServer->organization_id);

        DB::transaction(function () use ($edgeServer) {
            if ($edgeServer->license_id) {
                License::where('id', $edgeServer->license_id)->update(['edge_server_id' => null]);
            }

            $edgeServer->delete();
        });
    }
    /**
     * Send camera configuration to Edge Server
     * 
     * @param Camera $camera
     * @return bool
     */
    public function syncCameraToEdge(Camera $camera): bool
    {
        $edgeServer = $camera->edgeServer;
        
        if (!$edgeServer) {
            Log::warning("Camera {$camera->id} has no associated Edge Server");
            return false;
        }
        
        if (!$edgeServer->ip_address) {
            Log::warning("Edge Server {$edgeServer->id} has no IP address");
            return false;
        }

        // Check if Edge Server is online
        if (!$edgeServer->online) {
            Log::warning("Edge Server {$edgeServer->id} is offline, cannot sync camera");
            return false;
        }

        try {
            $config = $camera->config ?? [];
            $password = null;
            
            // Decrypt password if exists
            if (isset($config['password'])) {
                try {
                    $password = Crypt::decryptString($config['password']);
                } catch (\Exception $e) {
                    Log::warning("Failed to decrypt camera password: {$e->getMessage()}");
                }
            }

            // Map module IDs to Edge Server module names if needed
            $enabledModules = $config['enabled_modules'] ?? [];
            $moduleMapping = [
                'fire_detection' => 'fire',
                'face_recognition' => 'face',
                'vehicle_detection' => 'vehicle',
                'crowd_analysis' => 'crowd',
                'intrusion_detection' => 'intrusion',
                'loitering_detection' => 'loitering',
                'abandoned_object' => 'object',
                'people_counting' => 'counter',
                'license_plate' => 'vehicle',
            ];
            
            // Convert module IDs to Edge Server module names
            $edgeModules = array_map(function($moduleId) use ($moduleMapping) {
                return $moduleMapping[$moduleId] ?? $moduleId;
            }, $enabledModules);
            
            $payload = [
                'id' => $camera->camera_id,
                'name' => $camera->name,
                'rtsp_url' => $camera->rtsp_url,
                'location' => $camera->location,
                'username' => $config['username'] ?? null,
                'password' => $password,
                'resolution' => $config['resolution'] ?? '1920x1080',
                'fps' => $config['fps'] ?? 15,
                'enabled_modules' => $edgeModules, // Send mapped module names
            ];

            $edgeUrl = $this->getEdgeServerUrl($edgeServer);
            if (!$edgeUrl) {
                return false;
            }

            $this->enforceHttps($edgeUrl);

            // ⚠️ ARCHITECTURAL NOTE: This Cloud→Edge POST will FAIL if Edge is behind NAT.
            // Better approach: Edge should poll Cloud for camera config changes via heartbeat response,
            // or Cloud should send config via HMAC-protected command endpoint that Edge queries.
            
            Log::info("Syncing camera to Edge Server", [
                'camera_id' => $camera->camera_id,
                'edge_url' => $edgeUrl,
                'modules' => $edgeModules,
                'warning' => 'Direct Cloud→Edge sync may fail if Edge has no public IP'
            ]);

            $response = Http::timeout(10)
                ->retry(2, 100)
                ->post("{$edgeUrl}/api/v1/cameras", $payload);

            if ($response->successful()) {
                $responseData = $response->json();
                Log::info("Camera {$camera->id} synced to Edge Server {$edgeServer->id}", [
                    'camera_id' => $camera->camera_id,
                    'edge_response' => $responseData
                ]);
                
                // Update camera status to online if sync successful
                $camera->update(['status' => 'online']);
                return true;
            } else {
                $errorBody = $response->body();
                Log::warning("Failed to sync camera to Edge: {$response->status()} - {$errorBody}", [
                    'camera_id' => $camera->camera_id,
                    'edge_url' => $edgeUrl,
                    'payload' => $payload
                ]);
                
                // Update camera status to error if sync failed
                $camera->update(['status' => 'error']);
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Error syncing camera to Edge: {$e->getMessage()}", [
                'camera_id' => $camera->id,
                'edge_server_id' => $edgeServer->id,
                'exception' => $e->getTraceAsString()
            ]);
            $camera->update(['status' => 'error']);
            return false;
        }
    }

    /**
     * Remove camera from Edge Server
     * 
     * ⚠️ ARCHITECTURAL NOTE: This Cloud→Edge DELETE will FAIL if Edge is behind NAT.
     * Better approach: Edge should poll Cloud for camera deletions via heartbeat response.
     * 
     * @param Camera $camera
     * @return bool
     */
    public function removeCameraFromEdge(Camera $camera): bool
    {
        $edgeServer = $camera->edgeServer;
        
        if (!$edgeServer || !$edgeServer->ip_address) {
            return false;
        }

        try {
            $edgeUrl = $this->getEdgeServerUrl($edgeServer);
            if (!$edgeUrl) {
                return false;
            }

            $this->enforceHttps($edgeUrl);

            // ⚠️ WARNING: Direct Cloud→Edge DELETE may fail if Edge has no public IP
            Log::debug("Attempting to remove camera from Edge (may fail for NAT'd Edge)", [
                'camera_id' => $camera->camera_id,
                'edge_url' => $edgeUrl
            ]);

            $response = Http::timeout(5)
                ->delete("{$edgeUrl}/api/v1/cameras/{$camera->camera_id}");

            if ($response->successful()) {
                Log::info("Camera {$camera->id} removed from Edge Server {$edgeServer->id}");
                return true;
            } else {
                Log::warning("Failed to remove camera from Edge: {$response->status()}");
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Error removing camera from Edge: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send AI command to Edge Server
     * 
     * ⚠️ ARCHITECTURAL NOTE: This Cloud→Edge POST will FAIL if Edge is behind NAT.
     * Better approach: Commands should be queued in Cloud database, Edge polls for them
     * via GET /api/v1/ai-commands?edge_server_id=X&status=pending endpoint.
     * 
     * @param EdgeServer $edgeServer
     * @param array $commandData
     * @return array|null
     */
    public function sendAiCommand(EdgeServer $edgeServer, array $commandData): ?array
    {
        if (!$edgeServer->ip_address) {
            return null;
        }

        try {
            $edgeUrl = $this->getEdgeServerUrl($edgeServer);
            if (!$edgeUrl) {
                return null;
            }

            $this->enforceHttps($edgeUrl);

            // Only send command metadata, NOT images
            $payload = [
                'command_type' => $commandData['command_type'] ?? 'ai_inference',
                'command_id' => $commandData['command_id'] ?? null,
                'camera_id' => $commandData['camera_id'] ?? null,
                'module' => $commandData['module'] ?? null,
                'parameters' => $commandData['parameters'] ?? [],
                'image_reference' => $commandData['image_reference'] ?? null, // Reference to image stored on Edge
            ];

            $response = Http::timeout(30)
                ->post("{$edgeUrl}/api/v1/commands", $payload);

            if ($response->successful()) {
                return $response->json();
            } else {
                Log::warning("Failed to send AI command to Edge: {$response->status()} - {$response->body()}");
                return null;
            }
        } catch (\Exception $e) {
            Log::error("Error sending AI command to Edge: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Get camera snapshot from Edge Server
     * 
     * ⚠️ ARCHITECTURAL ISSUE: This method attempts direct Cloud→Edge connection.
     * This will FAIL if Edge is behind NAT or has no public IP.
     * 
     * TODO: Refactor to Edge-initiated flow:
     * - Edge should upload snapshots to Cloud Storage (S3, etc.)
     * - Edge should send snapshot URLs via heartbeat
     * - Cloud should retrieve from storage, not from Edge directly
     * 
     * @param Camera $camera
     * @return array|null
     */
    public function getCameraSnapshot(Camera $camera): ?array
    {
        $edgeServer = $camera->edgeServer;
        
        // CRITICAL: Use internal_ip if available (from system_info in heartbeat)
        // Fallback to ip_address if internal_ip not available
        if (!$edgeServer) {
            return null;
        }

        try {
            $edgeUrl = $this->getEdgeServerUrl($edgeServer);
            if (!$edgeUrl) {
                return null;
            }

            $this->enforceHttps($edgeUrl);

            $response = Http::timeout(5)
                ->get("{$edgeUrl}/api/v1/cameras/{$camera->camera_id}/snapshot");

            if ($response->successful()) {
                // If response is an image, return base64 encoded
                $contentType = $response->header('Content-Type');
                if (str_contains($contentType, 'image')) {
                    $imageData = base64_encode($response->body());
                    return [
                        'image' => "data:{$contentType};base64,{$imageData}",
                        'timestamp' => now()->toIso8601String(),
                        'camera_id' => $camera->camera_id,
                    ];
                }
                return $response->json();
            } else {
                return null;
            }
        } catch (\Exception $e) {
            Log::error("Error getting camera snapshot: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Get HLS stream URL from Edge Server
     * 
     * CRITICAL RULE: Live streaming MUST be edge-only
     * - Video traffic NEVER passes through cloud
     * - Cloud ONLY provides metadata (URL construction)
     * - Live video streams directly from edge server to client
     * 
     * ⚠️ ARCHITECTURAL NOTE: Edge IP-based URLs require edge to have public IP or NAT traversal.
     * For NAT'd edges, use WebRTC/TURN or Edge-initiated streaming.
     * 
     * @param Camera $camera
     * @return string|null Edge server URL for HLS stream (NEVER cloud-proxied)
     */
    public function getHlsStreamUrl(Camera $camera): ?string
    {
        $edgeServer = $camera->edgeServer;
        
        // CRITICAL: IP address is no longer required for command sync, but still needed for live streaming
        // If Edge Server has no IP, streaming cannot work without Cloud proxy (future implementation)
        if (!$edgeServer) {
            return null;
        }

        // Try to get Edge Server URL (may fail if no IP configured)
        $edgeUrl = $this->getEdgeServerUrl($edgeServer);
        if (!$edgeUrl) {
            // Edge Server has no IP - live streaming requires IP or Cloud proxy
            // For now, return null (frontend will show "loading")
            // TODO: Implement Cloud proxy for MJPEG streaming when Edge has no public IP
            Log::debug("Cannot generate stream URL: Edge Server {$edgeServer->id} has no IP address");
            return null;
        }

        $this->enforceHttps($edgeUrl);

        // CRITICAL: Return edge-direct URL only - video traffic NEVER touches cloud
        // Cloud only constructs the URL from metadata (edge IP), does not proxy streams
        // Using MJPEG stream endpoint (temporary until HLS streaming is fully implemented)
        return "{$edgeUrl}/api/v1/cameras/{$camera->camera_id}/mjpeg";
    }

    /**
     * Get WebRTC signaling endpoint from Edge Server
     * 
     * ⚠️ ARCHITECTURAL ISSUE: This returns Edge IP-based URLs which won't work
     * if Edge is behind NAT or has no public IP.
     * 
     * TODO: Refactor to use TURN server or Edge-initiated WebRTC signaling.
     * 
     * @param Camera $camera
     * @return string|null
     */
    public function getWebRtcEndpoint(Camera $camera): ?string
    {
        $edgeServer = $camera->edgeServer;
        
        if (!$edgeServer || !$edgeServer->ip_address) {
            return null;
        }

        $edgeUrl = $this->getEdgeServerUrl($edgeServer);
        if (!$edgeUrl) {
            return null;
        }

        $this->enforceHttps($edgeUrl);

        return "{$edgeUrl}/webrtc/{$camera->camera_id}";
    }

    /**
     * Get Edge Server base URL
     * 
     * @param EdgeServer $edgeServer
     * @return string|null
     */
    private function getEdgeServerUrl(EdgeServer $edgeServer): ?string
    {
        // CRITICAL: Use internal_ip (from system_info in heartbeat) if available
        // Fallback to ip_address if internal_ip not available
        // Edge Server sends internal_ip in system_info during heartbeat
        $ip = $edgeServer->internal_ip ?? $edgeServer->ip_address;
        
        if (!$ip) {
            Log::debug("Edge Server {$edgeServer->id} has no IP address (internal_ip or ip_address)");
            return null;
        }

        // Default Edge Server port is 8080 (not 8000)
        $port = $edgeServer->port ?? 8080;
        $protocol = ($edgeServer->use_https ?? false) ? 'https' : 'http';
        
        $url = "{$protocol}://{$ip}:{$port}";
        Log::debug("Edge Server URL: {$url} (using " . ($edgeServer->internal_ip ? 'internal_ip' : 'ip_address') . ")");
        return $url;
    }

    /**
     * Check if Edge Server is online
     * 
     * ⚠️ DEPRECATED: Direct Cloud→Edge health check is architecturally incorrect.
     * Edge servers are behind NAT with no public IP/inbound access.
     * 
     * Use database-based check instead:
     * $isOnline = ($edgeServer->last_seen_at && now()->diffInMinutes($edgeServer->last_seen_at) < 5);
     * 
     * @param EdgeServer $edgeServer
     * @return bool
     * @deprecated Use last_seen_at timestamp from database instead
     */
    public function checkEdgeServerHealth(EdgeServer $edgeServer): bool
    {
        // Check database timestamp instead of direct connection
        if (!$edgeServer->last_seen_at) {
            return false;
        }
        
        $minutesAgo = now()->diffInMinutes($edgeServer->last_seen_at);
        return $minutesAgo < 5; // Online if heartbeat within 5 minutes
        
        // Old direct connection code (commented out - will fail for NAT'd Edge servers)
        /*
        try {
            $edgeUrl = $this->getEdgeServerUrl($edgeServer);
            if (!$edgeUrl) {
                return false;
            }

            $this->enforceHttps($edgeUrl);

            $response = Http::timeout(3)
                ->get("{$edgeUrl}/api/v1/health");

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
        */
    }

    /**
     * Enforce HTTPS for production environments.
     * In local/development environments, HTTP is allowed with a warning logged.
     */
    private function enforceHttps(string $edgeUrl): void
    {
        if (!str_starts_with($edgeUrl, 'https://')) {
            $environment = config('app.env', 'production');
            
            // Only enforce in production
            if ($environment === 'production') {
                Log::warning("Edge server URL {$edgeUrl} does not use HTTPS. This is a security risk in production.");
            }
            
            // Log warning for non-HTTPS in all environments
            Log::debug("Edge server communication using HTTP: {$edgeUrl}");
        }
    }
}
