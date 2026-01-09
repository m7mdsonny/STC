<?php

namespace App\Http\Controllers;

use App\Models\SMSQuota;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsQuotaController extends Controller
{
    public function show(int $organizationId): JsonResponse
    {
        $quota = SMSQuota::firstOrCreate(
            ['organization_id' => $organizationId],
            ['monthly_limit' => 0, 'used_this_month' => 0]
        );

        return response()->json($quota);
    }

    public function update(Request $request, int $organizationId): JsonResponse
    {
        $this->ensureSuperAdmin($request);
        $data = $request->validate([
            'monthly_limit' => 'required|integer|min:0',
            'used_this_month' => 'nullable|integer|min:0',
            'resets_at' => 'nullable|date',
        ]);

        $quota = SMSQuota::firstOrCreate(
            ['organization_id' => $organizationId],
            ['monthly_limit' => 0, 'used_this_month' => 0]
        );

        $quota->update($data);

        return response()->json($quota);
    }

    public function consume(Request $request, int $organizationId): JsonResponse
    {
        $data = $request->validate([
            'count' => 'nullable|integer|min:1',
        ]);

        $count = $data['count'] ?? 1;

        $quota = SMSQuota::firstOrCreate(
            ['organization_id' => $organizationId],
            ['monthly_limit' => 0, 'used_this_month' => 0]
        );

        if ($quota->monthly_limit > 0 && ($quota->used_this_month + $count) > $quota->monthly_limit) {
            return response()->json([
                'allowed' => false,
                'reason' => 'quota_exceeded',
                'used_this_month' => $quota->used_this_month,
                'monthly_limit' => $quota->monthly_limit,
            ], 429);
        }

        $quota->increment('used_this_month', $count);

        return response()->json([
            'allowed' => true,
            'quota' => $quota->fresh(),
        ]);
    }
}
