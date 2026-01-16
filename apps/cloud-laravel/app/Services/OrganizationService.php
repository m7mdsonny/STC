<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrganizationService
{
    public function createOrganization(array $data, User $actor): Organization
    {
        if (!$actor->is_super_admin) {
            throw new DomainActionException('Only super admins can create organizations', 403);
        }

        $plan = SubscriptionPlan::where('name', $data['subscription_plan'] ?? '')->first();
        if (!$plan) {
            $plan = SubscriptionPlan::first();
        }

        if ($plan) {
            $data['max_cameras'] = $data['max_cameras'] ?? $plan->max_cameras;
            $data['max_edge_servers'] = $data['max_edge_servers'] ?? $plan->max_edge_servers;
        }

        try {
            return DB::transaction(function () use ($data, $plan, $actor) {
                $organization = Organization::create($data);

                // CRITICAL IMPROVEMENT: Auto-create license for new organization
                if ($plan) {
                    $license = \App\Models\License::create([
                        'organization_id' => $organization->id,
                        'license_key' => Str::uuid()->toString(),
                        'plan' => $plan->name,
                        'status' => 'active',
                        'max_cameras' => $plan->max_cameras ?? 4,
                        'max_edge_servers' => $plan->max_edge_servers ?? 1,
                        'activated_at' => now(),
                        'expires_at' => now()->addYear(), // 1 year default validity
                    ]);
                    
                    Log::info('Auto-created license for new organization', [
                        'organization_id' => $organization->id,
                        'organization_name' => $organization->name,
                        'license_id' => $license->id,
                        'license_key' => $license->license_key,
                        'plan' => $plan->name,
                        'created_by' => $actor->email,
                    ]);
                    
                    // Create SMS quota if plan has it
                    if (property_exists($plan, 'sms_quota')) {
                        $organization->smsQuota()->create([
                            'monthly_limit' => $plan->sms_quota ?? 0,
                            'used_this_month' => 0,
                        ]);
                    }
                }

                return $organization;
            });
        } catch (QueryException $e) {
            throw new DomainActionException('Failed to create organization: ' . $e->getMessage(), 500);
        }
    }

    public function updateOrganization(Organization $organization, array $data, User $actor): Organization
    {
        if (!$actor->is_super_admin && $actor->organization_id !== $organization->id) {
            throw new DomainActionException('You cannot update this organization', 403);
        }

        DB::transaction(function () use ($organization, $data) {
            $organization->update($data);
        });

        return $organization;
    }

    public function deleteOrganization(Organization $organization, User $actor): void
    {
        if (!$actor->is_super_admin) {
            throw new DomainActionException('Only super admins can delete organizations', 403);
        }

        DB::transaction(function () use ($organization) {
            // Soft delete to maintain data integrity
            $organization->delete();
        });
        
        Log::info('Organization deleted', [
            'organization_id' => $organization->id,
            'organization_name' => $organization->name,
            'deleted_by' => request()->user()?->email,
        ]);
    }

    public function toggleOrganization(Organization $organization, User $actor): Organization
    {
        if (!$actor->is_super_admin && $actor->organization_id !== $organization->id) {
            throw new DomainActionException('You cannot toggle this organization', 403);
        }

        $organization->is_active = !$organization->is_active;
        $organization->save();

        return $organization;
    }

    public function updatePlan(Organization $organization, array $data, User $actor): Organization
    {
        if (!$actor->is_super_admin) {
            throw new DomainActionException('Only super admins can update organization plans', 403);
        }

        $organization->update([
            'subscription_plan' => $data['subscription_plan'],
            'max_cameras' => $data['max_cameras'] ?? null,
            'max_edge_servers' => $data['max_edge_servers'] ?? null,
        ]);

        return $organization;
    }

    public function uploadLogo(Organization $organization, UploadedFile $file, User $actor): Organization
    {
        if (!$actor->is_super_admin && $actor->organization_id !== $organization->id) {
            throw new DomainActionException('You cannot update this organization', 403);
        }

        if ($organization->logo_url) {
            Storage::disk('public')->delete($organization->logo_url);
        }

        $path = $file->store('logos', 'public');
        $organization->logo_url = $path;
        $organization->save();

        return $organization;
    }
}
