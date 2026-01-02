<?php

namespace App\Services;

use App\Models\EdgeServer;
use App\Models\Camera;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class EdgeServerService
{
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

            Log::info("Syncing camera to Edge Server", [
                'camera_id' => $camera->camera_id,
                'edge_url' => $edgeUrl,
                'modules' => $edgeModules
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
     * @param Camera $camera
     * @return array|null
     */
    public function getCameraSnapshot(Camera $camera): ?array
    {
        $edgeServer = $camera->edgeServer;
        
        if (!$edgeServer || !$edgeServer->ip_address) {
            return null;
        }

        try {
            $edgeUrl = $this->getEdgeServerUrl($edgeServer);
            if (!$edgeUrl) {
                return null;
            }

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
     * @param Camera $camera
     * @return string|null
     */
    public function getHlsStreamUrl(Camera $camera): ?string
    {
        $edgeServer = $camera->edgeServer;
        
        if (!$edgeServer || !$edgeServer->ip_address) {
            return null;
        }

        $edgeUrl = $this->getEdgeServerUrl($edgeServer);
        if (!$edgeUrl) {
            return null;
        }

        // Edge Server should provide HLS stream at this endpoint
        return "{$edgeUrl}/streams/{$camera->camera_id}/playlist.m3u8";
    }

    /**
     * Get WebRTC signaling endpoint from Edge Server
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
        if (!$edgeServer->ip_address) {
            Log::warning("Edge Server {$edgeServer->id} has no IP address");
            return null;
        }

        // Default Edge Server port is 8080 (not 8000)
        $port = $edgeServer->port ?? 8080;
        $protocol = ($edgeServer->use_https ?? false) ? 'https' : 'http';
        
        $url = "{$protocol}://{$edgeServer->ip_address}:{$port}";
        Log::debug("Edge Server URL: {$url}");
        return $url;
    }

    /**
     * Check if Edge Server is online
     * 
     * @param EdgeServer $edgeServer
     * @return bool
     */
    public function checkEdgeServerHealth(EdgeServer $edgeServer): bool
    {
        try {
            $edgeUrl = $this->getEdgeServerUrl($edgeServer);
            if (!$edgeUrl) {
                return false;
            }

            $response = Http::timeout(3)
                ->get("{$edgeUrl}/api/v1/health");

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
