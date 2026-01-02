<?php

namespace App\Http\Controllers;

use App\Models\PlatformWording;
use App\Models\OrganizationWording;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformWordingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlatformWording::query();

        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
        }

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('key', 'LIKE', "%{$search}%")
                  ->orWhere('label', 'LIKE', "%{$search}%")
                  ->orWhere('value_ar', 'LIKE', "%{$search}%")
                  ->orWhere('value_en', 'LIKE', "%{$search}%");
            });
        }

        $wordings = $query->orderBy('category')->orderBy('key')->get();

        return response()->json($wordings);
    }

    public function show(PlatformWording $wording): JsonResponse
    {
        return response()->json($wording);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        $data = $request->validate([
            'key' => 'required|string|max:255|unique:platform_wordings,key',
            'label' => 'nullable|string|max:255',
            'value_ar' => 'nullable|string',
            'value_en' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'context' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_customizable' => 'nullable|boolean',
        ]);

        $wording = PlatformWording::create($data);

        return response()->json($wording, 201);
    }

    public function update(Request $request, PlatformWording $wording): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        
        $data = $request->validate([
            'key' => 'sometimes|string|max:255|unique:platform_wordings,key,' . $wording->id,
            'label' => 'nullable|string|max:255',
            'value_ar' => 'nullable|string',
            'value_en' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'context' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_customizable' => 'nullable|boolean',
        ]);

        $wording->update($data);

        return response()->json($wording);
    }

    public function destroy(PlatformWording $wording): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $wording->delete();
        return response()->json(['message' => 'Wording deleted']);
    }

    public function getForOrganization(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json([]);
        }

        $wordings = PlatformWording::all();
        $customizations = OrganizationWording::where('organization_id', $organizationId)
            ->get()
            ->keyBy('wording_id');

        $result = $wordings->map(function ($wording) use ($customizations) {
            $custom = $customizations->get($wording->id);
            return [
                'key' => $wording->key,
                'label' => $wording->label,
                'value_ar' => $custom && $custom->custom_value_ar ? $custom->custom_value_ar : $wording->value_ar,
                'value_en' => $custom && $custom->custom_value_en ? $custom->custom_value_en : $wording->value_en,
                'category' => $wording->category,
                'is_customized' => $custom !== null,
            ];
        });

        return response()->json($result->values());
    }

    public function customizeForOrganization(Request $request, PlatformWording $wording): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json(['message' => 'No organization assigned'], 403);
        }

        if (!$wording->is_customizable) {
            return response()->json(['message' => 'This wording is not customizable'], 403);
        }

        $data = $request->validate([
            'custom_value_ar' => 'nullable|string',
            'custom_value_en' => 'nullable|string',
        ]);

        $customization = OrganizationWording::updateOrCreate(
            [
                'organization_id' => $organizationId,
                'wording_id' => $wording->id,
            ],
            $data
        );

        return response()->json($customization);
    }

    public function removeCustomization(Request $request, PlatformWording $wording): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;

        if (!$organizationId) {
            return response()->json(['message' => 'No organization assigned'], 403);
        }

        OrganizationWording::where('organization_id', $organizationId)
            ->where('wording_id', $wording->id)
            ->delete();

        return response()->json(['message' => 'Customization removed']);
    }
}

