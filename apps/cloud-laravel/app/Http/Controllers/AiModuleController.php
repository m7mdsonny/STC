<?php

namespace App\Http\Controllers;

use App\Models\AiModule;
use App\Models\AiModuleConfig;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiModuleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AiModule::query();

        // Filter by enabled status if requested
        if ($request->filled('enabled_only')) {
            $query->where('is_active', true);
        }

        $modules = $query->orderBy('display_order')->orderBy('name')->get();

        return response()->json($modules);
    }

    public function show(AiModule $aiModule): JsonResponse
    {
        return response()->json($aiModule);
    }

    public function update(Request $request, AiModule $aiModule): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'display_name' => 'sometimes|string|max:255',
            'display_name_ar' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'config_schema' => 'nullable|array',
            'default_config' => 'nullable|array',
            'required_camera_type' => 'nullable|string|max:255',
            'min_fps' => 'nullable|integer|min:1',
            'min_resolution' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:255',
            'display_order' => 'nullable|integer',
        ]);

        $aiModule->update($data);

        return response()->json($aiModule);
    }

    // Organization-specific module configurations
    public function getConfigs(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json([]);
        }

        $organization = Organization::find($organizationId);
        $planLevel = $organization ? $this->getPlanLevel($organization->subscription_plan) : 1;

        $configs = AiModuleConfig::where('organization_id', $organizationId)
            ->with('module')
            ->get();

        // Add plan availability info to each module
        $modules = AiModule::all();
        $result = $modules->map(function ($module) use ($configs, $planLevel) {
            $config = $configs->firstWhere('module_id', $module->id);
            return [
                'id' => $module->id,
                'name' => $module->name,
                'display_name' => $module->display_name,
                'display_name_ar' => $module->display_name_ar,
                'description' => $module->description,
                'description_ar' => $module->description_ar,
                'is_active' => $module->is_active,
                'is_available' => true, // All modules available (no plan restrictions in current schema)
                'config' => $config,
            ];
        });

        return response()->json($result->values());
    }

    public function getConfig(Request $request, int $moduleId): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json(['message' => 'No organization assigned'], 404);
        }

        $config = AiModuleConfig::where('organization_id', $organizationId)
            ->where('module_id', $moduleId)
            ->with('module')
            ->first();

        if (!$config) {
            // Return default config if not exists
            $module = AiModule::find($moduleId);
            if (!$module) {
                return response()->json(['message' => 'Module not found'], 404);
            }

            return response()->json([
                'module_id' => $moduleId,
                'organization_id' => $organizationId,
                'is_enabled' => false,
                'is_licensed' => false,
                'config' => $module->default_config ?? [],
                'confidence_threshold' => 0.80,
                'alert_threshold' => 3,
                'cooldown_seconds' => 30,
                'schedule_enabled' => false,
                'schedule' => null,
                'module' => $module,
            ]);
        }

        return response()->json($config);
    }

    public function updateConfig(Request $request, int $moduleId): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json(['message' => 'No organization assigned'], 403);
        }

        $module = AiModule::find($moduleId);
        if (!$module) {
            return response()->json(['message' => 'Module not found'], 404);
        }

        $data = $request->validate([
            'is_enabled' => 'nullable|boolean',
            'config' => 'nullable|array',
            'confidence_threshold' => 'nullable|numeric|min:0|max:1',
            'alert_threshold' => 'nullable|integer|min:1',
            'cooldown_seconds' => 'nullable|integer|min:0',
            'schedule_enabled' => 'nullable|boolean',
            'schedule' => 'nullable|array',
        ]);

        // If enabling, mark as licensed
        if (isset($data['is_enabled']) && $data['is_enabled']) {
            $data['is_licensed'] = true;
        }

        $config = AiModuleConfig::updateOrCreate(
            [
                'organization_id' => $organizationId,
                'module_id' => $moduleId,
            ],
            $data
        );

        $config->load('module');

        return response()->json($config);
    }

    public function enableModule(Request $request, int $moduleId): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json(['message' => 'No organization assigned'], 403);
        }

        $module = AiModule::find($moduleId);
        if (!$module) {
            return response()->json(['message' => 'Module not found'], 404);
        }

        // Verify organization exists
        $organization = Organization::find($organizationId);
        if (!$organization) {
            return response()->json(['message' => 'Organization not found'], 404);
        }

        $config = AiModuleConfig::updateOrCreate(
            [
                'organization_id' => $organizationId,
                'module_id' => $moduleId,
            ],
            [
                'is_enabled' => true,
                'is_licensed' => true,
            ]
        );

        $config->load('module');

        return response()->json($config);
    }

    protected function getPlanLevel(string $planName): int
    {
        $planMap = [
            'basic' => 1,
            'professional' => 2,
            'enterprise' => 3,
        ];

        $planNameLower = strtolower($planName);
        return $planMap[$planNameLower] ?? 1;
    }

    public function disableModule(Request $request, int $moduleId): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json(['message' => 'No organization assigned'], 403);
        }

        $config = AiModuleConfig::where('organization_id', $organizationId)
            ->where('module_id', $moduleId)
            ->first();

        if ($config) {
            $config->update(['is_enabled' => false]);
            $config->load('module');
            return response()->json($config);
        }

        return response()->json(['message' => 'Config not found'], 404);
    }
}

