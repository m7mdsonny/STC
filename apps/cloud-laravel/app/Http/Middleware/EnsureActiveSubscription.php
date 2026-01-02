<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Organization;
use App\Models\License;
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
        if ($user && ($user->is_super_admin ?? false)) {
            return $next($request);
        }

        // Get organization from user or request
        $organizationId = $user->organization_id ?? $request->get('organization_id');
        
        if (!$organizationId) {
            return response()->json([
                'message' => 'Organization not found or not accessible'
            ], 403);
        }

        $organization = Organization::find($organizationId);
        
        if (!$organization) {
            return response()->json([
                'message' => 'Organization not found'
            ], 404);
        }

        // Check if organization has active license
        $hasActiveLicense = $this->hasActiveLicense($organization);
        
        if (!$hasActiveLicense) {
            $gracePeriodDays = config('app.license_grace_period_days', 14);
            
            return response()->json([
                'message' => "No active subscription found. Please renew your license. " .
                           "Grace period: {$gracePeriodDays} days after expiry.",
                'error' => 'subscription_expired',
                'grace_period_days' => $gracePeriodDays
            ], 403);
        }

        return $next($request);
    }

    /**
     * Check if organization has an active license (within grace period)
     * 
     * @param Organization $organization
     * @return bool
     */
    private function hasActiveLicense(Organization $organization): bool
    {
        $gracePeriodDays = config('app.license_grace_period_days', 14);
        $gracePeriodEnd = now()->addDays($gracePeriodDays);

        // Check for active licenses
        $activeLicense = License::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->where(function ($query) use ($gracePeriodEnd) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $gracePeriodEnd);
            })
            ->first();

        if ($activeLicense) {
            return true;
        }

        // Check if any license is within grace period
        $licenseInGrace = License::where('organization_id', $organization->id)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '>', now())
            ->where('expires_at', '<=', $gracePeriodEnd)
            ->first();

        return $licenseInGrace !== null;
    }
}
