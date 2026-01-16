<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use App\Services\IntegrationService;
use App\Exceptions\DomainActionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationController extends Controller
{
    public function __construct(private IntegrationService $integrationService)
    {
    }
    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        $query = Integration::with(['organization', 'edgeServer']);

        if ($request->filled('organization_id')) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        if ($request->filled('edge_server_id')) {
            $query->where('edge_server_id', $request->get('edge_server_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->get('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = (int) $request->get('per_page', 15);
        $integrations = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($integrations);
    }

    public function show(Integration $integration): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $integration->load(['organization', 'edgeServer']);
        return response()->json($integration);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        $data = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'edge_server_id' => 'required|exists:edge_servers,id',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:arduino,raspberry_gpio,modbus_tcp,http_rest,mqtt,tcp_socket',
            'connection_config' => 'required|array',
        ]);

        try {
            $integration = $this->integrationService->createIntegration($data, $request->user());
            return response()->json($integration, 201);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }

    public function update(Request $request, Integration $integration): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:arduino,raspberry_gpio,modbus_tcp,http_rest,mqtt,tcp_socket',
            'connection_config' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
        ]);

        try {
            $integration = $this->integrationService->updateIntegration($integration, $data, $request->user());
            return response()->json($integration);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }

    public function destroy(Integration $integration): JsonResponse
    {
        try {
            $this->ensureSuperAdmin(request());
        } catch (\Exception $e) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            if (!$integration->exists) {
                return response()->json(['message' => 'Integration not found'], 404);
            }

            $this->integrationService->deleteIntegration($integration, request()->user());
            return response()->json(['message' => 'Deleted successfully'], 200);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        } catch (\Exception $e) {
            \Log::error("Failed to delete integration {$integration->id}: " . $e->getMessage());
            return response()->json(['error' => 'فشل الحذف: ' . $e->getMessage()], 500);
        }
    }

    public function toggleActive(Integration $integration): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        
        try {
            $integration = $this->integrationService->toggleActive($integration, request()->user());
            return response()->json($integration);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }

    public function testConnection(Integration $integration): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        
        // Basic connection test logic
        // This is a placeholder - implement actual connection testing based on type
        $config = $integration->connection_config;
        $type = $integration->type;

        try {
            switch ($type) {
                case 'http_rest':
                    // Test HTTP endpoint
                    if (isset($config['endpoint'])) {
                        $response = \Illuminate\Support\Facades\Http::timeout(5)->get($config['endpoint']);
                        return response()->json([
                            'success' => $response->successful(),
                            'message' => $response->successful() ? 'Connection successful' : 'Connection failed',
                            'latency_ms' => null,
                        ]);
                    }
                    break;
                case 'mqtt':
                case 'modbus_tcp':
                case 'tcp_socket':
                    // These would require specific libraries
                    return response()->json([
                        'success' => true,
                        'message' => 'Connection test not implemented for this type',
                    ]);
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Connection test not available for this integration type',
                    ], 422);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unable to test connection',
        ], 422);
    }

    public function getAvailableTypes(): JsonResponse
    {
        return response()->json([
            ['type' => 'arduino', 'name' => 'Arduino', 'description' => 'اردوينو للتحكم بالاجهزة'],
            ['type' => 'raspberry_gpio', 'name' => 'Raspberry Pi GPIO', 'description' => 'منافذ GPIO للتحكم المباشر'],
            ['type' => 'modbus_tcp', 'name' => 'Modbus TCP', 'description' => 'بروتوكول صناعي للتحكم'],
            ['type' => 'http_rest', 'name' => 'HTTP REST', 'description' => 'واجهة برمجة HTTP'],
            ['type' => 'mqtt', 'name' => 'MQTT', 'description' => 'بروتوكول IoT للرسائل'],
            ['type' => 'tcp_socket', 'name' => 'TCP Socket', 'description' => 'اتصال TCP مباشر'],
        ]);
    }
}



