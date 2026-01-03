<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Models\License;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LicenseService
{
    public function __construct(private OrganizationCapabilitiesResolver $capabilities)
    {
    }

    public function createLicense(array $data, User $actor): License
    {
        $organizationId = $data['organization_id'] ?? $actor->organization_id;
        if (!$organizationId) {
            throw new DomainActionException('organization_id is required', 422);
        }

        $organization = $this->capabilities->ensureLicenseCreation($actor, (int) $organizationId);

        $isTrial = (bool) ($data['is_trial'] ?? false);
        unset($data['is_trial']);

        $licenseKey = $data['license_key'] ?? Str::uuid()->toString();
        $expiresAt = $data['expires_at'] ?? Carbon::now()->addYear();
        $trialEndsAt = $isTrial
            ? Carbon::now()->addDays(14)
            : ($data['trial_ends_at'] ?? null);

        unset($data['trial_ends_at'], $data['expires_at']);

        try {
            return DB::transaction(function () use ($data, $organization, $licenseKey, $expiresAt, $trialEndsAt, $isTrial) {
                return License::create([
                    ...$data,
                    'organization_id' => $organization->id,
                    'license_key' => $licenseKey,
                    'status' => $isTrial ? 'trial' : ($data['status'] ?? 'active'),
                    'trial_ends_at' => $trialEndsAt,
                    'expires_at' => $expiresAt,
                ]);
            });
        } catch (QueryException $e) {
            throw new DomainActionException('Failed to create license: ' . $e->getMessage(), 500);
        }
    }

    public function updateLicense(License $license, array $data, User $actor): License
    {
        $this->capabilities->ensureLicenseCreation($actor, $license->organization_id);

        return DB::transaction(function () use ($license, $data) {
            $license->update($data);
            return $license;
        });
    }

    public function deleteLicense(License $license, User $actor): void
    {
        $this->capabilities->ensureLicenseCreation($actor, $license->organization_id);

        DB::transaction(function () use ($license) {
            $license->delete();
        });
    }
}
