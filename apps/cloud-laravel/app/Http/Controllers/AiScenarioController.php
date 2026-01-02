<?php

namespace App\Http\Controllers;

use App\Models\AiScenario;
use App\Models\AiScenarioRule;
use App\Models\AiCameraBinding;
use App\Models\Camera;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AiScenarioController extends Controller
{
    /**
     * List scenarios for organization
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        $module = $request->get('module'); // Optional filter: 'market' or 'factory'

        $query = AiScenario::where('organization_id', $organizationId)
            ->with(['rules', 'cameraBindings.camera']);

        if ($module) {
            $query->where('module', $module);
        }

        $scenarios = $query->get()->map(function ($scenario) {
            return [
                'id' => $scenario->id,
                'module' => $scenario->module,
                'scenario_type' => $scenario->scenario_type,
                'name' => $scenario->name,
                'description' => $scenario->description,
                'enabled' => $scenario->enabled,
                'severity_threshold' => $scenario->severity_threshold,
                'config' => $scenario->config,
                'rules' => $scenario->rules->map(function ($rule) {
                    return [
                        'id' => $rule->id,
                        'rule_type' => $rule->rule_type,
                        'rule_value' => $rule->rule_value,
                        'weight' => $rule->weight,
                        'enabled' => $rule->enabled,
                        'order' => $rule->order,
                    ];
                }),
                'camera_bindings' => $scenario->cameraBindings->map(function ($binding) {
                    return [
                        'id' => $binding->id,
                        'camera_id' => $binding->camera_id,
                        'camera_name' => $binding->camera->name ?? null,
                        'enabled' => $binding->enabled,
                        'camera_specific_config' => $binding->camera_specific_config,
                    ];
                }),
                'created_at' => $scenario->created_at->toIso8601String(),
                'updated_at' => $scenario->updated_at->toIso8601String(),
            ];
        });

        return response()->json($scenarios);
    }

    /**
     * Get single scenario
     */
    public function show(AiScenario $scenario, Request $request): JsonResponse
    {
        // Ensure user has access to this scenario's organization
        $user = $request->user();
        if ($user->organization_id !== $scenario->organization_id && !$user->is_super_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $scenario->load(['rules', 'cameraBindings.camera']);

        return response()->json([
            'id' => $scenario->id,
            'module' => $scenario->module,
            'scenario_type' => $scenario->scenario_type,
            'name' => $scenario->name,
            'description' => $scenario->description,
            'enabled' => $scenario->enabled,
            'severity_threshold' => $scenario->severity_threshold,
            'config' => $scenario->config,
            'rules' => $scenario->rules,
            'camera_bindings' => $scenario->cameraBindings,
        ]);
    }

    /**
     * Update scenario
     */
    public function update(Request $request, AiScenario $scenario): JsonResponse
    {
        $user = $request->user();
        if ($user->organization_id !== $scenario->organization_id && !$user->is_super_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'enabled' => 'sometimes|boolean',
            'severity_threshold' => 'sometimes|integer|min:0|max:100',
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'config' => 'sometimes|array',
        ]);

        $scenario->update($validated);

        return response()->json($scenario);
    }

    /**
     * Update scenario rule
     */
    public function updateRule(Request $request, AiScenario $scenario, AiScenarioRule $rule): JsonResponse
    {
        $user = $request->user();
        if ($user->organization_id !== $scenario->organization_id && !$user->is_super_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($rule->scenario_id !== $scenario->id) {
            return response()->json(['error' => 'Rule does not belong to scenario'], 400);
        }

        $validated = $request->validate([
            'weight' => 'sometimes|integer|min:0|max:100',
            'enabled' => 'sometimes|boolean',
            'rule_value' => 'sometimes|array',
            'order' => 'sometimes|integer',
        ]);

        $rule->update($validated);

        return response()->json($rule);
    }

    /**
     * Bind camera to scenario
     */
    public function bindCamera(Request $request, AiScenario $scenario): JsonResponse
    {
        $user = $request->user();
        if ($user->organization_id !== $scenario->organization_id && !$user->is_super_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'camera_id' => 'required|exists:cameras,id',
            'enabled' => 'sometimes|boolean',
            'camera_specific_config' => 'sometimes|array',
        ]);

        // Ensure camera belongs to same organization
        $camera = Camera::find($validated['camera_id']);
        if ($camera->organization_id !== $scenario->organization_id) {
            return response()->json(['error' => 'Camera does not belong to organization'], 400);
        }

        $binding = AiCameraBinding::updateOrCreate(
            [
                'camera_id' => $validated['camera_id'],
                'scenario_id' => $scenario->id,
            ],
            [
                'enabled' => $validated['enabled'] ?? true,
                'camera_specific_config' => $validated['camera_specific_config'] ?? null,
            ]
        );

        return response()->json($binding);
    }

    /**
     * Unbind camera from scenario
     */
    public function unbindCamera(AiScenario $scenario, Camera $camera): JsonResponse
    {
        $user = request()->user();
        if ($user->organization_id !== $scenario->organization_id && !$user->is_super_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        AiCameraBinding::where('scenario_id', $scenario->id)
            ->where('camera_id', $camera->id)
            ->delete();

        return response()->json(['message' => 'Camera unbound successfully']);
    }
}
