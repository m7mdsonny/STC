<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    public function index(): JsonResponse
    {
        $this->ensureSuperAdmin(request());
        return response()->json(SubscriptionPlan::orderBy('price_monthly')->get());
    }

    public function show(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        return response()->json($subscriptionPlan);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:subscription_plans,name',
            'name_ar' => 'required|string|max:255',
            'max_cameras' => 'required|integer|min:1',
            'max_edge_servers' => 'required|integer|min:1',
            'available_modules' => 'nullable|array',
            'notification_channels' => 'nullable|array',
            'price_monthly' => 'nullable|numeric|min:0',
            'price_yearly' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'sms_quota' => 'nullable|integer|min:0',
            'retention_days' => 'nullable|integer|min:1',
        ]);

        $plan = SubscriptionPlan::create($data);

        return response()->json($plan, 201);
    }

    public function update(Request $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255|unique:subscription_plans,name,' . $subscriptionPlan->id,
            'name_ar' => 'sometimes|string|max:255',
            'max_cameras' => 'sometimes|integer|min:1',
            'max_edge_servers' => 'sometimes|integer|min:1',
            'available_modules' => 'nullable|array',
            'notification_channels' => 'nullable|array',
            'price_monthly' => 'nullable|numeric|min:0',
            'price_yearly' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'sms_quota' => 'nullable|integer|min:0',
            'retention_days' => 'nullable|integer|min:1',
        ]);

        $subscriptionPlan->update($data);

        return response()->json($subscriptionPlan);
    }

    public function destroy(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        try {
            $this->ensureSuperAdmin(request());
        } catch (\Exception $e) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            if (!$subscriptionPlan->exists) {
                return response()->json(['message' => 'Subscription plan not found'], 404);
            }

            $subscriptionPlan->delete();
            return response()->json(['message' => 'Deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error("Failed to delete subscription plan {$subscriptionPlan->id}: " . $e->getMessage());
            return response()->json(['error' => 'فشل الحذف: ' . $e->getMessage()], 500);
        }
    }
}
