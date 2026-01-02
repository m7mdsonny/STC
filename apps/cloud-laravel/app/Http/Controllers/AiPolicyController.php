<?php

namespace App\Http\Controllers;

use App\Models\AiPolicy;
use App\Models\AiPolicyEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AiPolicyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AiPolicy::query();

        if ($orgId = $request->get('organization_id')) {
            $query->where('organization_id', $orgId);
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function show($id): JsonResponse
    {
        try {
            // Check if table exists
            if (!Schema::hasTable('ai_policies')) {
                return response()->json(['error' => 'AI policies table not found'], 404);
            }

            // Handle "effective" as a special keyword, not an ID
            if ($id === 'effective') {
                return $this->effective(request());
            }

            $aiPolicy = AiPolicy::findOrFail($id);
            return response()->json($aiPolicy->load('events'));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'AI policy not found'], 404);
        } catch (\Exception $e) {
            \Log::error('AiPolicyController::show error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load AI policy'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $this->validateData($request);
        $policy = AiPolicy::create($data);

        return response()->json($policy, 201);
    }

    public function update(Request $request, AiPolicy $aiPolicy): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $aiPolicy->update($this->validateData($request, false));
        return response()->json($aiPolicy);
    }

    public function destroy(AiPolicy $aiPolicy): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $aiPolicy->delete();
        return response()->json(['message' => 'AI policy deleted']);
    }

    public function addEvent(Request $request, AiPolicy $aiPolicy): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $request->validate([
            'event_type' => 'required|string',
            'label' => 'nullable|string',
            'payload' => 'nullable|array',
            'weight' => 'nullable|numeric',
        ]);

        $event = $aiPolicy->events()->create($data);

        return response()->json($event, 201);
    }

    public function effective(Request $request): JsonResponse
    {
        try {
            // Check if table exists first
            if (!\Illuminate\Support\Facades\Schema::hasTable('ai_policies')) {
                \Log::warning('ai_policies table does not exist - returning defaults');
                return response()->json([
                    'is_enabled' => false,
                    'modules' => [],
                    'thresholds' => [],
                    'actions' => [],
                    'feature_flags' => [],
                ]);
            }

            $organizationId = $request->get('organization_id');
            $policy = AiPolicy::where('organization_id', $organizationId)->first()
                ?? AiPolicy::whereNull('organization_id')->first();

            if (!$policy) {
                return response()->json([
                    'is_enabled' => false,
                    'modules' => [],
                    'thresholds' => [],
                    'actions' => [],
                    'feature_flags' => [],
                ]);
            }

            return response()->json($policy->load('events'));
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('AiPolicyController::effective database error: ' . $e->getMessage());
            return response()->json([
                'is_enabled' => false,
                'modules' => [],
                'thresholds' => [],
                'actions' => [],
                'feature_flags' => [],
            ]);
        } catch (\Exception $e) {
            \Log::error('AiPolicyController::effective error: ' . $e->getMessage());
            return response()->json([
                'is_enabled' => false,
                'modules' => [],
                'thresholds' => [],
                'actions' => [],
                'feature_flags' => [],
            ]);
        }
    }

    protected function validateData(Request $request, bool $requireName = true): array
    {
        return $request->validate([
            'organization_id' => 'nullable|exists:organizations,id',
            'name' => ($requireName ? 'required' : 'sometimes') . '|string|max:255',
            'is_enabled' => 'nullable|boolean',
            'modules' => 'nullable|array',
            'thresholds' => 'nullable|array',
            'actions' => 'nullable|array',
            'feature_flags' => 'nullable|array',
        ]);
    }
}
