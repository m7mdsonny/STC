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
    /**
     * ⚠️ DEPRECATED - ARCHITECTURAL VIOLATION
     * 
     * This method attempts Cloud→Edge HTTP calls which are architecturally invalid.
     * Edge servers are behind NAT with no public IP/inbound access.
     * 
     * ARCHITECTURAL RULE: Cloud MUST NEVER initiate connections to Edge servers.
     * 
     * CORRECT APPROACH:
     * - Camera configuration is provided to Edge via heartbeat response
     * - Edge polls Cloud for camera updates during sync
     * - Edge syncs cameras automatically when processing heartbeat response
     * 
     * @param Camera $camera
     * @return bool Always returns false - sync happens via Edge pull, not Cloud push
     * @deprecated Camera sync now happens via Edge-initiated heartbeat sync. This method is disabled.
     */
    public function syncCameraToEdge(Camera $camera): bool
    {
        // ⚠️ ARCHITECTURAL FIX: Cloud must never initiate HTTP connections to Edge servers.
        // Camera sync happens via Edge-initiated heartbeat sync, not Cloud push.
        // Edge Server polls Cloud for camera configuration during heartbeat sync.
        
        Log::debug("syncCameraToEdge called but disabled - Camera sync happens via Edge heartbeat sync", [
            'camera_id' => $camera->id,
            'note' => 'Camera configuration is synced to Edge via heartbeat response, not direct HTTP calls'
        ]);
        
        // Return false to indicate sync is not handled here
        // Actual sync happens when Edge Server syncs during heartbeat
        return false;
    }

    /**
     * ⚠️ DEPRECATED - ARCHITECTURAL VIOLATION
     * 
     * This method attempts Cloud→Edge HTTP calls which are architecturally invalid.
     * Edge servers are behind NAT with no public IP/inbound access.
     * 
     * ARCHITECTURAL RULE: Cloud MUST NEVER initiate connections to Edge servers.
     * 
     * CORRECT APPROACH:
     * - Camera deletion is communicated to Edge via heartbeat response
     * - Edge polls Cloud for camera updates during sync
     * - Edge removes cameras automatically when processing heartbeat response
     * 
     * @param Camera $camera
     * @return bool Always returns false - camera removal happens via Edge pull, not Cloud push
     * @deprecated Camera removal now happens via Edge-initiated heartbeat sync. This method is disabled.
     */
    public function removeCameraFromEdge(Camera $camera): bool
    {
        // ⚠️ ARCHITECTURAL FIX: Cloud must never initiate HTTP connections to Edge servers.
        // Camera removal happens via Edge-initiated heartbeat sync, not Cloud push.
        // Edge Server polls Cloud for camera configuration during heartbeat sync.
        
        Log::debug("removeCameraFromEdge called but disabled - Camera removal happens via Edge heartbeat sync", [
            'camera_id' => $camera->id,
            'note' => 'Camera removal is communicated to Edge via heartbeat response, not direct HTTP calls'
        ]);
        
        return false;
    }

    /**
     * ⚠️ DEPRECATED - ARCHITECTURAL VIOLATION
     * 
     * This method attempts Cloud→Edge HTTP calls which are architecturally invalid.
     * Edge servers are behind NAT with no public IP/inbound access.
     * 
     * ARCHITECTURAL RULE: Cloud MUST NEVER initiate connections to Edge servers.
     * 
     * CORRECT APPROACH:
     * - Commands are stored in edge_commands table with status='pending'
     * - Edge Server polls Cloud for pending commands via GET /edge/commands during heartbeat
     * - Edge executes commands locally and acknowledges via POST /edge/commands/{id}/ack
     * 
     * @param EdgeServer $edgeServer
     * @param array $commandData
     * @return array|null Always returns null - commands are queued, not pushed
     * @deprecated Use EdgeCommandService::sendCommand() which queues commands in database for Edge to poll.
     */
    public function sendAiCommand(EdgeServer $edgeServer, array $commandData): ?array
    {
        // ⚠️ ARCHITECTURAL FIX: Cloud must never initiate HTTP connections to Edge servers.
        // Commands are queued in database, Edge polls for them.
        
        Log::debug("sendAiCommand called but disabled - Commands must be queued for Edge to poll", [
            'edge_server_id' => $edgeServer->id,
            'note' => 'Use EdgeCommandService::sendCommand() to queue commands for Edge polling'
        ]);
        
        return null;
    }

    /**
     * ⚠️ DEPRECATED - ARCHITECTURAL VIOLATION
     * 
     * This method attempts Cloud→Edge HTTP calls which are architecturally invalid.
     * Edge servers are behind NAT with no public IP/inbound access.
     * 
     * ARCHITECTURAL RULE: Cloud MUST NEVER initiate connections to Edge servers.
     * 
     * CORRECT APPROACH (TODO):
     * - Edge should upload snapshots to Cloud Storage (S3, etc.) periodically
     * - Edge should send snapshot URLs via heartbeat or events
     * - Cloud should serve snapshots from storage, not fetch from Edge directly
     * 
     * TEMPORARY WORKAROUND:
     * - Frontend can connect directly to Edge for snapshots (same network)
     * - Or Edge can push snapshots via heartbeat response
     * 
     * @param Camera $camera
     * @return array|null Always returns null - snapshots must come from Edge-initiated flow
     * @deprecated Snapshots must be pushed by Edge or retrieved from Cloud Storage, not pulled by Cloud.
     */
    public function getCameraSnapshot(Camera $camera): ?array
    {
        // ⚠️ ARCHITECTURAL FIX: Cloud must never initiate HTTP connections to Edge servers.
        // Snapshots should be pushed by Edge or stored in Cloud Storage.
        
        Log::debug("getCameraSnapshot called but disabled - Snapshots must come from Edge-initiated flow", [
            'camera_id' => $camera->id,
            'note' => 'Snapshots should be uploaded by Edge to Cloud Storage or sent via heartbeat'
        ]);
        
        // Return null - Frontend should connect directly to Edge or use stored snapshots
        return null;
    }

    /**
     * Get HLS stream URL from Edge Server
     * 
     * ⚠️ METADATA ONLY - NO HTTP CALLS
     * This method only constructs URL strings for frontend use.
     * Cloud does NOT initiate HTTP connections to Edge servers.
     * 
     * CRITICAL RULE: Live streaming MUST be edge-only
     * - Video traffic NEVER passes through cloud
     * - Cloud ONLY provides metadata (URL construction)
     * - Live video streams directly from edge server to client (browser connects directly)
     * 
     * ⚠️ ARCHITECTURAL NOTE: Edge IP-based URLs require edge to have public IP or NAT traversal.
     * For NAT'd edges, use WebRTC/TURN or Edge-initiated streaming.
     * 
     * @param Camera $camera
     * @return string|null Edge server URL for HLS stream (NEVER cloud-proxied, frontend connects directly)
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
     * ⚠️ METADATA ONLY - NO HTTP CALLS
     * This method only constructs URL strings for frontend use.
     * Cloud does NOT initiate HTTP connections to Edge servers.
     * 
     * ⚠️ ARCHITECTURAL NOTE: This returns Edge IP-based URLs which won't work
     * if Edge is behind NAT or has no public IP.
     * 
     * TODO: Refactor to use TURN server or Edge-initiated WebRTC signaling.
     * 
     * @param Camera $camera
     * @return string|null WebRTC endpoint URL (frontend connects directly, Cloud only provides metadata)
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
     * ⚠️ METADATA ONLY - NOT FOR HTTP CALLS
     * This method only constructs URL strings for metadata/URL generation.
     * MUST NOT be used to initiate Cloud→Edge HTTP connections.
     * 
     * Used only for:
     * - Constructing stream URLs for frontend (getHlsStreamUrl, getWebRtcEndpoint)
     * - NOT for direct HTTP calls (use Edge-initiated polling instead)
     * 
     * @param EdgeServer $edgeServer
     * @return string|null Edge Server base URL (for metadata only, not HTTP calls)
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
     * Internal IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.0.0.1) don't require HTTPS warnings.
     */
    private function enforceHttps(string $edgeUrl): void
    {
        if (!str_starts_with($edgeUrl, 'https://')) {
            // Check if URL uses internal/private IP (don't warn for internal networks)
            $isInternalIp = preg_match('/https?:\/\/(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|127\.0\.0\.1|localhost)/', $edgeUrl);
            
            $environment = config('app.env', 'production');
            
            // Only log warning in production for non-internal IPs
            // Internal IPs (192.168.x.x, 10.x.x.x, etc.) are expected to use HTTP in private networks
            if ($environment === 'production' && !$isInternalIp) {
                Log::warning("Edge server URL {$edgeUrl} does not use HTTPS. This is a security risk in production.");
            } else {
                // Log debug for internal IPs or development environments
                Log::debug("Edge server communication using HTTP: {$edgeUrl}" . ($isInternalIp ? ' (internal IP - HTTP is acceptable)' : ''));
            }
        }
    }
}
