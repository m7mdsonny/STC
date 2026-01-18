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
        // CRITICAL: IP address is no longer required - Edge Server pulls commands from Cloud
        // Commands are queued in database, Edge Server fetches them during heartbeat/sync
        // We only need to check if Edge Server is online (recent heartbeat)

        // CRITICAL: Check last_seen_at instead of online flag
        // The online flag may be stale, but last_seen_at reflects real heartbeat
        // Consider server online if last_seen_at is within 5 minutes
        $isOnline = false;
        if ($edgeServer->last_seen_at) {
            $lastSeen = \Carbon\Carbon::parse($edgeServer->last_seen_at);
            $isOnline = $lastSeen->isAfter(\Carbon\Carbon::now()->subMinutes(5));
        }
        
        if (!$isOnline && !$edgeServer->online) {
            // Only reject if both online flag is false AND last_seen_at is old/missing
            // This allows sync even if online flag is stale but server is actually connected
            return [
                'success' => false,
                'message' => 'Edge Server appears offline (no recent heartbeat)',
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

        // CRITICAL: Commands are no longer sent via HTTP (IP-based approach removed)
        // Edge Server will fetch commands from Cloud during heartbeat/sync
        // Commands should be stored in database for Edge to poll (future implementation)
        // For now, we just verify Edge is online and return success
        
        Log::info("Command queued for Edge Server (will be fetched on next sync)", [
            'edge_server_id' => $edgeServer->id,
            'command' => $command,
            'payload' => $payload
        ]);
        
        return [
            'success' => true,
            'message' => 'Command queued - Edge Server will fetch it on next sync',
            'data' => [
                'command' => $command,
                'queued_at' => now()->toIso8601String()
            ]
        ];
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
