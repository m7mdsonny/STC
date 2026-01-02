<?php

namespace App\Services;

use App\Models\EdgeServer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EdgeCommandService
{
    /**
     * Send a command to Edge Server with HMAC authentication
     * 
     * @param EdgeServer $edgeServer
     * @param string $command Command name (e.g., 'restart', 'sync_config')
     * @param array $payload Optional payload data
     * @return array Response data with success status
     */
    public function sendCommand(EdgeServer $edgeServer, string $command, array $payload = []): array
    {
        if (!$edgeServer->ip_address) {
            return [
                'success' => false,
                'message' => 'Edge Server has no IP address configured',
                'error' => 'no_ip_address'
            ];
        }

        if (!$edgeServer->online) {
            return [
                'success' => false,
                'message' => 'Edge Server is offline',
                'error' => 'edge_offline'
            ];
        }

        if (!$edgeServer->edge_key || !$edgeServer->edge_secret) {
            return [
                'success' => false,
                'message' => 'Edge Server authentication keys not configured',
                'error' => 'no_auth_keys'
            ];
        }

        try {
            $edgeUrl = $this->getEdgeServerUrl($edgeServer);
            if (!$edgeUrl) {
                return [
                    'success' => false,
                    'message' => 'Could not determine Edge Server URL',
                    'error' => 'invalid_url'
                ];
            }

            // Build request path
            $path = "/api/v1/commands/{$command}";
            $fullUrl = "{$edgeUrl}{$path}";
            
            // Prepare request body
            $body = json_encode($payload);
            $bodyHash = hash('sha256', $body ?: '');
            
            // Generate timestamp
            $timestamp = time();
            
            // Build signature string: method|path|timestamp|body_hash
            $method = 'POST';
            $signatureString = "{$method}|{$path}|{$timestamp}|{$bodyHash}";
            
            // Calculate HMAC signature
            $signature = hash_hmac('sha256', $signatureString, $edgeServer->edge_secret);
            
            // Prepare headers
            $headers = [
                'Content-Type' => 'application/json',
                'X-EDGE-KEY' => $edgeServer->edge_key,
                'X-EDGE-TIMESTAMP' => (string) $timestamp,
                'X-EDGE-SIGNATURE' => $signature,
            ];

            Log::info("Sending command to Edge Server", [
                'edge_server_id' => $edgeServer->id,
                'command' => $command,
                'url' => $fullUrl,
            ]);

            $response = Http::timeout(10)
                ->withHeaders($headers)
                ->post($fullUrl, $payload);

            if ($response->successful()) {
                $responseData = $response->json();
                Log::info("Command sent successfully to Edge Server", [
                    'edge_server_id' => $edgeServer->id,
                    'command' => $command,
                    'response' => $responseData
                ]);
                
                return [
                    'success' => true,
                    'message' => 'Command sent successfully',
                    'data' => $responseData
                ];
            } else {
                $errorMessage = $response->json()['message'] ?? 'Edge Server returned an error';
                Log::warning("Command failed on Edge Server", [
                    'edge_server_id' => $edgeServer->id,
                    'command' => $command,
                    'status' => $response->status(),
                    'error' => $errorMessage
                ]);
                
                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'error' => 'edge_server_error',
                    'status_code' => $response->status()
                ];
            }
        } catch (\Exception $e) {
            Log::error("Failed to send command to Edge Server", [
                'edge_server_id' => $edgeServer->id,
                'command' => $command,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to communicate with Edge Server: ' . $e->getMessage(),
                'error' => 'communication_error'
            ];
        }
    }

    /**
     * Restart Edge Server
     * 
     * @param EdgeServer $edgeServer
     * @return array
     */
    public function restart(EdgeServer $edgeServer): array
    {
        return $this->sendCommand($edgeServer, 'restart', []);
    }

    /**
     * Sync configuration from Cloud to Edge Server
     * 
     * @param EdgeServer $edgeServer
     * @return array
     */
    public function syncConfig(EdgeServer $edgeServer): array
    {
        return $this->sendCommand($edgeServer, 'sync_config', []);
    }

    /**
     * Get Edge Server base URL
     * 
     * @param EdgeServer $edgeServer
     * @return string|null
     */
    private function getEdgeServerUrl(EdgeServer $edgeServer): ?string
    {
        // Prefer internal_ip, fallback to ip_address
        $ip = $edgeServer->internal_ip ?? $edgeServer->ip_address;
        
        if (!$ip) {
            return null;
        }

        // Default port is 8080, protocol is http
        $port = 8080; // Edge Server default port
        $protocol = 'http'; // Edge Server uses HTTP by default
        
        return "{$protocol}://{$ip}:{$port}";
    }
}
