<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\TrainingDataset;

/**
 * Controller for managing training datasets used in model training.
 *
 * This implementation provides basic CRUD endpoints secured by sanctum.
 */
class TrainingDatasetController extends Controller
{
    /**
     * List training datasets for the authenticated user's organization.
     *
     * Super admins can optionally filter by organization_id via query param.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = TrainingDataset::query();

        // Non-super-admin users can only view datasets in their organization
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $user->organization_id);
        } elseif ($request->filled('organization_id')) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        if ($request->filled('ai_module')) {
            $query->where('ai_module', $request->get('ai_module'));
        }

        $perPage = (int) $request->get('per_page', 15);

        return response()->json(
            $query->orderByDesc('created_at')->paginate($perPage)
        );
    }

    /**
     * Show details of a specific training dataset.
     */
    public function show(TrainingDataset $dataset): JsonResponse
    {
        // Ensure the user has access to this dataset
        $this->ensureOrganizationAccess(request(), $dataset->organization_id);
        return response()->json($dataset);
    }

    /**
     * Create a new training dataset.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        // Validate incoming request
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'ai_module' => 'required|string|max:255',
            'label_schema' => 'nullable|array',
            'label_schema.*.name' => 'required_with:label_schema|string|max:255',
            'label_schema.*.color' => 'required_with:label_schema|string|max:20',
            'organization_id' => 'sometimes|nullable|integer|exists:organizations,id',
        ]);

        $dataset = new TrainingDataset();
        $dataset->fill($data);
        // Initialize counts
        $dataset->sample_count = 0;
        $dataset->labeled_count = 0;
        $dataset->verified_count = 0;
        // Default status and version if not provided
        $dataset->status = $data['status'] ?? 'draft';
        $dataset->version = $data['version'] ?? null;
        $dataset->environment = $data['environment'] ?? null;

        // Determine organization: non-super-admin uses their org_id
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $dataset->organization_id = $user->organization_id;
        }

        // Set auditing fields
        $dataset->created_by = $user->id;
        $dataset->updated_by = $user->id;

        $dataset->save();

        return response()->json($dataset, 201);
    }

    /**
     * Update an existing training dataset.
     */
    public function update(Request $request, TrainingDataset $dataset): JsonResponse
    {
        $user = $request->user();
        // Ensure the user has access and permission
        $this->ensureOrganizationAccess($request, $dataset->organization_id);
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false) && !RoleHelper::canManageOrganization($user->role)) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:500',
            'ai_module' => 'sometimes|string|max:255',
            'label_schema' => 'sometimes|nullable|array',
            'label_schema.*.name' => 'required_with:label_schema|string|max:255',
            'label_schema.*.color' => 'required_with:label_schema|string|max:20',
            'status' => 'sometimes|string|max:50',
            'version' => 'sometimes|string|max:50',
            'environment' => 'sometimes|string|max:100',
        ]);
        $dataset->fill($data);
        $dataset->updated_by = $user->id;
        $dataset->save();
        return response()->json($dataset);
    }

    /**
     * Delete a training dataset (soft delete).
     */
    public function destroy(Request $request, TrainingDataset $dataset): JsonResponse
    {
        try {
            $user = $request->user();
            $this->ensureOrganizationAccess($request, $dataset->organization_id);
            if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false) && !RoleHelper::canManageOrganization($user->role)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (!$dataset->exists) {
                return response()->json(['message' => 'Training dataset not found'], 404);
            }

            $dataset->delete();
            return response()->json(['message' => 'Deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error("Failed to delete training dataset {$dataset->id}: " . $e->getMessage());
            return response()->json(['error' => 'فشل الحذف: ' . $e->getMessage()], 500);
        }
    }
}
