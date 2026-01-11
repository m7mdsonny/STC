<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Organization;
use App\Models\License;
use App\Helpers\RoleHelper;
use Illuminate\Support\Facades\Log;

class EnsureActiveSubscription
{
    /**
     * Handle an incoming request.
     * 
     * Checks if organization has an active license with valid expiry
     * Allows grace period (default 14 days) after expiry
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Super admins bypass this check
        if ($user && RoleHelper::isSuperAdmin($user->role ?? '', $user->is_super_admin ?? false)) {
            return $next($request);
        }

        // Get organization from user or request
        $organizationId = $user->organization_id ?? $request->get('organization_id');
        
        if (!$organizationId) {
            Log::warning('EnsureActiveSubscription: No organization found', [
                'user_id' => $user?->id,
                'request_org_id' => $request->get('organization_id'),
            ]);
            return response()->json([
                'message' => 'لم يتم العثور على المؤسسة أو لا يمكن الوصول إليها',
                'message_en' => 'Organization not found or not accessible'
            ], 403);
        }

        $organization = Organization::find($organizationId);
        
        if (!$organization) {
            return response()->json([
                'message' => 'لم يتم العثور على المؤسسة',
                'message_en' => 'Organization not found'
            ], 404);
        }

        // Check if organization has active license
        $licenseStatus = $this->checkLicenseStatus($organization);
        
        if (!$licenseStatus['valid']) {
            $gracePeriodDays = config('app.license_grace_period_days', 14);
            
            Log::warning('EnsureActiveSubscription: No valid license', [
                'organization_id' => $organization->id,
                'organization_name' => $organization->name,
                'reason' => $licenseStatus['reason'],
            ]);
            
            return response()->json([
                'message' => $licenseStatus['message_ar'] ?? 'لا يوجد اشتراك نشط. يرجى تجديد الترخيص.',
                'message_en' => $licenseStatus['message'] ?? 'No active subscription found. Please renew your license.',
                'error' => 'subscription_expired',
                'reason' => $licenseStatus['reason'],
                'grace_period_days' => $gracePeriodDays
            ], 403);
        }

        return $next($request);
    }

    /**
     * Check license status for organization
     * 
     * @param Organization $organization
     * @return array
     */
    private function checkLicenseStatus(Organization $organization): array
    {
        $gracePeriodDays = (int) config('app.license_grace_period_days', 14);
        $now = now();
        $graceThreshold = $now->copy()->subDays($gracePeriodDays);

        // First, check for any licenses at all
        $anyLicense = License::where('organization_id', $organization->id)->first();
        
        if (!$anyLicense) {
            return [
                'valid' => false,
                'reason' => 'no_license',
                'message' => 'No license found for this organization. Please contact support.',
                'message_ar' => 'لا يوجد ترخيص لهذه المؤسسة. يرجى الاتصال بالدعم.',
            ];
        }

        // Check for active licenses that haven't expired
        $activeLicense = License::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->where(function ($query) use ($now) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            })
            ->first();

        if ($activeLicense) {
            return [
                'valid' => true,
                'reason' => 'active_license',
                'license' => $activeLicense,
            ];
        }

        // Check if any license is within grace period (expired but within grace days)
        $licenseInGrace = License::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now) // Already expired
            ->where('expires_at', '>', $graceThreshold) // But within grace period
            ->first();

        if ($licenseInGrace) {
            $daysRemaining = $now->diffInDays($licenseInGrace->expires_at->copy()->addDays($gracePeriodDays), false);
            
            Log::info('License in grace period', [
                'organization_id' => $organization->id,
                'license_id' => $licenseInGrace->id,
                'expired_at' => $licenseInGrace->expires_at,
                'grace_days_remaining' => $daysRemaining,
            ]);
            
            return [
                'valid' => true,
                'reason' => 'grace_period',
                'license' => $licenseInGrace,
                'grace_days_remaining' => max(0, $daysRemaining),
            ];
        }

        // Check if there's a suspended license
        $suspendedLicense = License::where('organization_id', $organization->id)
            ->where('status', 'suspended')
            ->first();

        if ($suspendedLicense) {
            return [
                'valid' => false,
                'reason' => 'license_suspended',
                'message' => 'Your license has been suspended. Please contact support.',
                'message_ar' => 'تم تعليق الترخيص الخاص بك. يرجى الاتصال بالدعم.',
            ];
        }

        // License exists but expired beyond grace period
        return [
            'valid' => false,
            'reason' => 'license_expired',
            'message' => "Your license has expired. Grace period: {$gracePeriodDays} days.",
            'message_ar' => "انتهت صلاحية الترخيص. فترة السماح: {$gracePeriodDays} يوم.",
        ];
    }
}
