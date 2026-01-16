<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use App\Models\AutomationRule;
use App\Models\AutomationLog;
use App\Services\AutomationRuleService;
use App\Exceptions\DomainActionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutomationRuleController extends Controller
{
    public function __construct(private AutomationRuleService $automationRuleService)
    {
    }
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = AutomationRule::with(['organization', 'integration']);

        // Filter by organization
        if ($user->organization_id) {
            $query->where('organization_id', $user->organization_id);
        } elseif (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return response()->json(['data' => [], 'total' => 0, 'per_page' => 15, 'current_page' => 1, 'last_page' => 1]);
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        // Filters
        if ($request->filled('integration_id')) {
            $query->where('integration_id', $request->get('integration_id'));
        }

        if ($request->filled('trigger_module')) {
            $query->where('trigger_module', $request->get('trigger_module'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->get('is_active'));
        }

        $perPage = (int) $request->get('per_page', 15);
        $rules = $query->orderByDesc('priority')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($rules);
    }

    public function show(AutomationRule $automationRule): JsonResponse
    {
        $user = request()->user();

        // Check ownership
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $automationRule->organization_id);
        }

        $automationRule->load(['organization', 'integration', 'logs']);
        return response()->json($automationRule);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        // Super admin can specify organization
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false) && $request->filled('organization_id')) {
            $organizationId = $request->get('organization_id');
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'integration_id' => 'nullable|exists:integrations,id',
            'trigger_module' => 'required|string',
            'trigger_event' => 'required|string',
            'trigger_conditions' => 'nullable|array',
            'action_type' => 'required|string',
            'action_command' => 'required|array',
            'cooldown_seconds' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'priority' => 'nullable|integer|min:0',
        ]);

        $data['organization_id'] = $organizationId;

        try {
            $rule = $this->automationRuleService->createRule($data, $user);
            return response()->json($rule, 201);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }

    public function update(Request $request, AutomationRule $automationRule): JsonResponse
    {
        $user = request()->user();

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'integration_id' => 'nullable|exists:integrations,id',
            'trigger_module' => 'sometimes|string',
            'trigger_event' => 'sometimes|string',
            'trigger_conditions' => 'nullable|array',
            'action_type' => 'sometimes|string',
            'action_command' => 'sometimes|array',
            'cooldown_seconds' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'priority' => 'nullable|integer|min:0',
        ]);

        try {
            $automationRule = $this->automationRuleService->updateRule($automationRule, $data, $user);
            return response()->json($automationRule);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }

    public function destroy(AutomationRule $automationRule): JsonResponse
    {
        try {
            if (!$automationRule->exists) {
                return response()->json(['message' => 'Automation rule not found'], 404);
            }

            $user = request()->user();
            $this->automationRuleService->deleteRule($automationRule, $user);
            return response()->json(['message' => 'Deleted successfully'], 200);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        } catch (\Exception $e) {
            \Log::error("Failed to delete automation rule {$automationRule->id}: " . $e->getMessage());
            return response()->json(['error' => 'فشل الحذف: ' . $e->getMessage()], 500);
        }
    }

    public function toggleActive(AutomationRule $automationRule): JsonResponse
    {
        $user = request()->user();

        try {
            $automationRule = $this->automationRuleService->toggleActive($automationRule, $user);
            return response()->json($automationRule);
        } catch (DomainActionException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatus());
        }
    }

    public function test(AutomationRule $automationRule): JsonResponse
    {
        $user = request()->user();

        // Check ownership
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $automationRule->organization_id);
        }

        // TODO: Implement actual test execution
        // For now, just return success
        return response()->json([
            'success' => true,
            'message' => 'Test execution simulated successfully',
        ]);
    }

    public function getLogs(Request $request, AutomationRule $automationRule): JsonResponse
    {
        $user = request()->user();

        // Check ownership
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $automationRule->organization_id);
        }

        $query = $automationRule->logs();

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->get('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->get('to'));
        }

        $perPage = (int) $request->get('per_page', 15);
        $logs = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json($logs);
    }

    public function getAvailableTriggers(): JsonResponse
    {
        $triggers = [
            ['module' => 'fire', 'events' => ['fire_detected', 'smoke_detected', 'fire_cleared']],
            ['module' => 'face', 'events' => ['known_face', 'unknown_face', 'blacklist_face', 'vip_detected']],
            ['module' => 'counter', 'events' => ['count_threshold', 'entry', 'exit', 'overcrowding']],
            ['module' => 'vehicle', 'events' => ['known_vehicle', 'unknown_vehicle', 'blacklist_vehicle', 'vip_vehicle']],
            ['module' => 'attendance', 'events' => ['check_in', 'check_out', 'late_arrival', 'early_departure']],
            ['module' => 'warehouse', 'events' => ['motion_detected', 'restricted_area', 'safety_violation']],
            ['module' => 'productivity', 'events' => ['idle_detected', 'activity_change', 'break_exceeded']],
            ['module' => 'audience', 'events' => ['demographic_update', 'crowd_analysis']],
            ['module' => 'intrusion', 'events' => ['intrusion_detected', 'perimeter_breach', 'loitering']],
        ];

        return response()->json($triggers);
    }

    public function getAvailableActions(): JsonResponse
    {
        $actions = [
            ['type' => 'notification', 'name' => 'ارسال اشعار', 'icon' => 'Bell'],
            ['type' => 'siren', 'name' => 'تشغيل السرينة', 'icon' => 'Volume2'],
            ['type' => 'gate_open', 'name' => 'فتح البوابة', 'icon' => 'DoorOpen'],
            ['type' => 'gate_close', 'name' => 'غلق البوابة', 'icon' => 'DoorClosed'],
            ['type' => 'door_open', 'name' => 'فتح الباب', 'icon' => 'Unlock'],
            ['type' => 'door_lock', 'name' => 'قفل الباب', 'icon' => 'Lock'],
            ['type' => 'lights_on', 'name' => 'تشغيل الاضاءة', 'icon' => 'Lightbulb'],
            ['type' => 'lights_off', 'name' => 'اطفاء الاضاءة', 'icon' => 'LightbulbOff'],
            ['type' => 'hvac_adjust', 'name' => 'ضبط التكييف', 'icon' => 'Wind'],
            ['type' => 'emergency_call', 'name' => 'اتصال طوارئ', 'icon' => 'Phone'],
            ['type' => 'http_request', 'name' => 'طلب HTTP', 'icon' => 'Globe'],
            ['type' => 'mqtt_publish', 'name' => 'نشر MQTT', 'icon' => 'Radio'],
            ['type' => 'custom', 'name' => 'مخصص', 'icon' => 'Settings'],
        ];

        return response()->json($actions);
    }
}

