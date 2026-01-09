<?php

namespace App\Http\Controllers;

use App\Models\AiAlertPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AiAlertPolicyController extends Controller
{
    /**
     * List alert policies for organization
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id ?? $request->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'Organization ID required'], 400);
        }

        $policies = AiAlertPolicy::where('organization_id', $organizationId)
            ->get()
            ->map(function ($policy) {
                return [
                    'id' => $policy->id,
                    'risk_level' => $policy->risk_level,
                    'notify_web' => $policy->notify_web,
                    'notify_mobile' => $policy->notify_mobile,
                    'notify_email' => $policy->notify_email,
                    'notify_sms' => $policy->notify_sms,
                    'cooldown_minutes' => $policy->cooldown_minutes,
                    'notification_channels' => $policy->notification_channels,
                ];
            });

        return response()->json($policies);
    }

    /**
     * Update alert policy
     */
    public function update(Request $request, AiAlertPolicy $policy): JsonResponse
    {
        $user = $request->user();
        if ($user->organization_id !== $policy->organization_id && !$user->is_super_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'notify_web' => 'sometimes|boolean',
            'notify_mobile' => 'sometimes|boolean',
            'notify_email' => 'sometimes|boolean',
            'notify_sms' => 'sometimes|boolean',
            'cooldown_minutes' => 'sometimes|integer|min:0',
            'notification_channels' => 'sometimes|array',
        ]);

        $policy->update($validated);

        return response()->json($policy);
    }
}
