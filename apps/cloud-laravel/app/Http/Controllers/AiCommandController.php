<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\AiCommand;
use App\Models\AiCommandLog;
use App\Models\AiCommandTarget;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Services\EdgeServerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiCommandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = AiCommand::with(['targets', 'logs'])->orderByDesc('created_at');

        // Super admin can see all, others only their org's commands
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            if ($user->organization_id) {
                $query->where('organization_id', $user->organization_id);
            } else {
                return response()->json(['data' => [], 'total' => 0]);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        return response()->json($query->paginate((int) $request->get('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        // Super admin can specify organization, others use their own
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false) && $request->filled('organization_id')) {
            $organizationId = $request->get('organization_id');
        }

        // Non-super-admin users must have organization
        if (!$organizationId) {
            return response()->json(['message' => 'Organization ID is required'], 422);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'organization_id' => 'nullable|exists:organizations,id',
            'payload' => 'nullable|array',
            'targets' => 'nullable|array',
        ]);

        // Create command
        $command = AiCommand::create([
            'title' => $data['title'],
            'organization_id' => $organizationId,
            'payload' => $data['payload'] ?? [],
            'status' => 'queued',
        ]);

        // Create targets if provided
        if (isset($data['targets']) && is_array($data['targets'])) {
            foreach ($data['targets'] as $target) {
                AiCommandTarget::create([
                    'ai_command_id' => $command->id,
                    'target_type' => $target['target_type'] ?? 'camera',
                    'target_id' => $target['target_id'] ?? null,
                    'meta' => $target['meta'] ?? null,
                ]);
            }
        }

        AiCommandLog::create([
            'ai_command_id' => $command->id,
            'status' => 'queued',
            'message' => 'Command created and queued for execution',
        ]);

        // Send command to Edge Server if payload contains camera_id
        try {
            $payload = $data['payload'] ?? [];
            if (isset($payload['camera_id'])) {
                $camera = Camera::where('camera_id', $payload['camera_id'])
                    ->where('organization_id', $organizationId)
                    ->first();
                
                if ($camera && $camera->edgeServer) {
                    $edgeService = new EdgeServerService();
                    $edgeResponse = $edgeService->sendAiCommand($camera->edgeServer, [
                        'command_id' => $command->id,
                        ...$payload,
                    ]);

                    if ($edgeResponse) {
                        $command->update(['status' => 'executing']);
                        AiCommandLog::create([
                            'ai_command_id' => $command->id,
                            'status' => 'executing',
                            'message' => 'Command sent to Edge Server',
                            'meta' => $edgeResponse,
                        ]);
                    } else {
                        $command->update(['status' => 'failed']);
                        AiCommandLog::create([
                            'ai_command_id' => $command->id,
                            'status' => 'failed',
                            'message' => 'Failed to send command to Edge Server',
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error("Error sending AI command to Edge: {$e->getMessage()}");
            $command->update(['status' => 'failed']);
            AiCommandLog::create([
                'ai_command_id' => $command->id,
                'status' => 'failed',
                'message' => 'Error: ' . $e->getMessage(),
            ]);
        }

        return response()->json($command->load('logs'), 201);
    }

    /**
     * Execute AI command (for Organization Owners)
     */
    public function execute(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Only owners and admins can execute commands
        if (!RoleHelper::canManageOrganization($user->role)) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $data = $request->validate([
            'command_type' => 'required|string|in:face_recognition,vehicle_recognition,object_detection,scene_analysis',
            'camera_id' => 'required|exists:cameras,id',
            'module' => 'required|string',
            'parameters' => 'nullable|array',
            'image_reference' => 'nullable|string', // Reference to image stored on Edge Server
        ]);

        // Verify camera belongs to organization
        $camera = Camera::findOrFail($data['camera_id']);
        if ($camera->organization_id !== (int) $user->organization_id) {
            return response()->json(['message' => 'Camera does not belong to your organization'], 403);
        }

        // Create command
        $command = AiCommand::create([
            'title' => "AI Command: {$data['command_type']} on {$camera->name}",
            'organization_id' => $user->organization_id,
            'payload' => [
                'command_type' => $data['command_type'],
                'camera_id' => $camera->camera_id,
                'module' => $data['module'],
                'parameters' => $data['parameters'] ?? [],
                'image_reference' => $data['image_reference'] ?? null,
            ],
            'status' => 'queued',
        ]);

        // Send to Edge Server
        try {
            $edgeServer = $camera->edgeServer;
            if ($edgeServer) {
                $edgeService = new EdgeServerService();
                $edgeResponse = $edgeService->sendAiCommand($edgeServer, [
                    'command_id' => $command->id,
                    'command_type' => $data['command_type'],
                    'camera_id' => $camera->camera_id,
                    'module' => $data['module'],
                    'parameters' => $data['parameters'] ?? [],
                    'image_reference' => $data['image_reference'] ?? null,
                ]);

                if ($edgeResponse) {
                    $command->update(['status' => 'executing']);
                    return response()->json([
                        'command' => $command->load('logs'),
                        'edge_response' => $edgeResponse,
                    ], 201);
                }
            }
        } catch (\Exception $e) {
            \Log::error("Error executing AI command: {$e->getMessage()}");
        }

        return response()->json(['command' => $command->load('logs')], 201);
    }

    public function ack(Request $request, AiCommand $aiCommand): JsonResponse
    {
        $data = $request->validate([
            'message' => 'nullable|string',
            'meta' => 'nullable|array',
        ]);

        $aiCommand->update([
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
        ]);

        AiCommandLog::create([
            'ai_command_id' => $aiCommand->id,
            'status' => 'acknowledged',
            'message' => $data['message'] ?? 'Acknowledged',
            'meta' => $data['meta'] ?? null,
        ]);

        return response()->json($aiCommand->fresh('logs'));
    }

    public function retry(Request $request, AiCommand $aiCommand): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $aiCommand->update(['status' => 'queued', 'acknowledged_at' => null]);

        AiCommandLog::create([
            'ai_command_id' => $aiCommand->id,
            'status' => 'queued',
            'message' => 'Command retried',
        ]);

        return response()->json($aiCommand->fresh('logs'));
    }

    public function logs(AiCommand $aiCommand): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        return response()->json($aiCommand->logs()->orderByDesc('created_at')->get());
    }
}
