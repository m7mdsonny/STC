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
            return DB::transaction(function () use ($data, $plan) {
                $organization = Organization::create($data);

                if ($plan && property_exists($plan, 'sms_quota')) {
                    $organization->smsQuota()->create([
                        'monthly_limit' => $plan->sms_quota ?? 0,
                        'used_this_month' => 0,
                    ]);
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
            $organization->delete();
        });
    }

    public function toggleOrganization(Organization $organization, User $actor): Organization
    {
        if (!$actor->is_super_admin && $actor->organization_id !== $organization->id) {
            throw new DomainActionException('You cannot toggle this organization', 403);
        }

        DB::transaction(function () use ($organization) {
            $organization->is_active = !$organization->is_active;
            $organization->save();
        });

        return $organization;
    }

    public function updatePlan(Organization $organization, array $data, User $actor): Organization
    {
        if (!$actor->is_super_admin) {
            throw new DomainActionException('Only super admins can update plans', 403);
        }

        DB::transaction(function () use ($organization, $data) {
            $organization->update($data);

            $plan = SubscriptionPlan::where('name', $data['subscription_plan'])->first();
            if ($plan && property_exists($plan, 'sms_quota')) {
                $organization->smsQuota()->updateOrCreate(
                    ['organization_id' => $organization->id],
                    ['monthly_limit' => $plan->sms_quota ?? 0]
                );
            }
        });

        return $organization;
    }

    /**
     * Upload organization logo
     */
    public function uploadLogo(Organization $organization, UploadedFile $file, User $actor): array
    {
        // Check if user can manage this organization
        if (!RoleHelper::isSuperAdmin($actor->role, $actor->is_super_admin ?? false)) {
            if ($actor->organization_id !== $organization->id) {
                throw new DomainActionException('Unauthorized', 403);
            }
        }

        $path = $file->store('public/organizations/logos');
        $url = Storage::url($path);

        DB::transaction(function () use ($organization, $url) {
            $organization->update(['logo_url' => $url]);
        });

        return [
            'url' => $url,
            'logo_url' => $url,
            'organization' => $organization->fresh(),
        ];
    }
}
