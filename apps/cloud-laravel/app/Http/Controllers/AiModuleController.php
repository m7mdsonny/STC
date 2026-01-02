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
            $query->where('is_enabled', true);
        }

        // Filter by category if requested
        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
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
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|string|max:255',
            'is_enabled' => 'nullable|boolean',
            'is_premium' => 'nullable|boolean',
            'min_plan_level' => 'nullable|integer|min:1|max:3',
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
                'module_key' => $module->module_key,
                'name' => $module->name,
                'description' => $module->description,
                'category' => $module->category,
                'is_enabled' => $module->is_enabled,
                'is_premium' => $module->is_premium,
                'min_plan_level' => $module->min_plan_level,
                'is_available' => $planLevel >= $module->min_plan_level,
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

        // If enabling, check plan level
        if (isset($data['is_enabled']) && $data['is_enabled']) {
            $organization = Organization::find($organizationId);
            if ($organization) {
                $planLevel = $this->getPlanLevel($organization->subscription_plan);
                if ($planLevel < $module->min_plan_level) {
                    return response()->json([
                        'message' => 'This module requires a higher subscription plan',
                        'required_level' => $module->min_plan_level,
                        'current_level' => $planLevel,
                        'module_name' => $module->name,
                    ], 403);
                }
                $data['is_licensed'] = true;
            }
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

        // Check plan level requirement
        $organization = Organization::find($organizationId);
        if (!$organization) {
            return response()->json(['message' => 'Organization not found'], 404);
        }

        $planLevel = $this->getPlanLevel($organization->subscription_plan);
        if ($planLevel < $module->min_plan_level) {
            return response()->json([
                'message' => 'This module requires a higher subscription plan',
                'required_level' => $module->min_plan_level,
                'current_level' => $planLevel,
                'module_name' => $module->name,
            ], 403);
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

