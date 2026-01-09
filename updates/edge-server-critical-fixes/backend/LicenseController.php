<?php

namespace App\Http\Controllers;

use App\Helpers\RoleHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use App\Models\License;
use Illuminate\Support\Str;

class LicenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = License::query();

        // Super admin can see all licenses
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            // Organization owners/admins can see their org's licenses
            if ($user->organization_id) {
                $query->where('organization_id', $user->organization_id);
            } else {
                return response()->json(['data' => [], 'total' => 0]);
            }
        }

        // Super admin can filter by organization
        if ($request->filled('organization_id') && RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $query->where('organization_id', $request->get('organization_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('plan')) {
            $query->where('plan', $request->get('plan'));
        }

        $licenses = $query->orderByDesc('created_at')->paginate((int) $request->get('per_page', 15));

        return response()->json($licenses);
    }

    public function show(License $license): JsonResponse
    {
        $user = request()->user();
        
        // Super admin can see all, others only their org's licenses
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->ensureOrganizationAccess(request(), $license->organization_id);
        }
        
        return response()->json($license);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'plan' => 'required|string',
            'max_cameras' => 'required|integer|min:1',
            'modules' => 'nullable|array',
            'expires_at' => 'nullable|date',
        ]);

        $license = License::create([
            ...$data,
            'license_key' => Str::uuid()->toString(),
            'status' => 'active',
        ]);

        return response()->json($license, 201);
    }

    public function update(Request $request, License $license): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'plan' => 'sometimes|string',
            'max_cameras' => 'sometimes|integer|min:1',
            'modules' => 'nullable|array',
            'expires_at' => 'nullable|date',
            'status' => 'sometimes|string',
        ]);

        $license->update($data);

        return response()->json($license);
    }

    public function destroy(License $license): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $license->delete();
        return response()->json(['message' => 'License deleted']);
    }

    public function activate(License $license): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $license->update(['status' => 'active', 'activated_at' => now()]);
        return response()->json($license);
    }

    public function suspend(License $license): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $license->update(['status' => 'suspended']);
        return response()->json($license);
    }

    public function renew(Request $request, License $license): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $request->validate(['expires_at' => 'required|date']);
        $license->update(['expires_at' => $request->expires_at, 'status' => 'active']);
        return response()->json($license);
    }

    public function regenerateKey(License $license): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        $license->update(['license_key' => Str::uuid()->toString()]);
        return response()->json($license);
    }

    public function validateKey(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'license_key' => 'required|string',
                'edge_id' => 'required|string',
            ]);

            $license = License::where('license_key', $request->license_key)->first();
            if (!$license) {
                return response()->json([
                    'valid' => false, 
                    'reason' => 'not_found',
                    'message' => 'License key not found'
                ], 404);
            }

            // Check if license is active
            if ($license->status !== 'active') {
                return response()->json([
                    'valid' => false,
                    'reason' => 'inactive',
                    'message' => 'License is not active',
                    'status' => $license->status
                ], 403);
            }

            $now = Carbon::now();
            $expires = $license->expires_at ? Carbon::parse($license->expires_at) : null;
            $graceDays = (int) config('app.license_grace', 14);

            // Check expiration (with grace period)
            if ($expires && $expires->lt($now)) {
                $daysPastExpiry = $now->diffInDays($expires);
                if ($daysPastExpiry > $graceDays) {
                    return response()->json([
                        'valid' => false,
                        'reason' => 'expired',
                        'message' => 'License has expired beyond grace period',
                        'expires_at' => $license->expires_at,
                        'grace_days' => $graceDays
                    ], 403);
                }
            }

            // Get license modules if available
            $modules = [];
            if ($license->modules) {
                $modules = is_array($license->modules) ? $license->modules : json_decode($license->modules, true) ?? [];
            }

            return response()->json([
                'valid' => true,
                'edge_id' => $request->edge_id,
                'organization_id' => $license->organization_id,
                'license_id' => $license->id,
                'expires_at' => $license->expires_at?->toIso8601String(),
                'grace_days' => $graceDays,
                'modules' => $modules,
                'max_cameras' => $license->max_cameras ?? null,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'valid' => false,
                'reason' => 'validation_error',
                'message' => 'Invalid request parameters',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('License validation error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'valid' => false,
                'reason' => 'server_error',
                'message' => 'An error occurred during license validation'
            ], 500);
        }
    }
}
