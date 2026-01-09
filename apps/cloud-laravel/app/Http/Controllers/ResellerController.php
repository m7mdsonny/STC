<?php

namespace App\Http\Controllers;

use App\Models\Reseller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResellerController extends Controller
{
    public function index(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        return response()->json(Reseller::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $this->validateData($request);
        $reseller = Reseller::create($data);

        return response()->json($reseller, 201);
    }

    public function update(Request $request, Reseller $reseller): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $reseller->update($this->validateData($request, $reseller->id));
        return response()->json($reseller);
    }

    public function destroy(Reseller $reseller): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $reseller->delete();
        return response()->json(['message' => 'Reseller deleted']);
    }

    protected function validateData(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:resellers,email' . ($ignoreId ? ',' . $ignoreId : ''),
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:50',
            'commission_rate' => 'nullable|numeric|min:0',
            'discount_rate' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
            'contact_person' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);
    }
}
