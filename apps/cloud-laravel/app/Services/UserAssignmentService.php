<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserAssignmentService
{
    public function __construct(private OrganizationCapabilitiesResolver $capabilities)
    {
    }

    public function createUser(array $data, User $actor): User
    {
        $data['role'] = RoleHelper::normalize($data['role']);

        if ($data['role'] !== RoleHelper::SUPER_ADMIN && empty($data['organization_id'])) {
            throw new DomainActionException('Organization is required for this role', 422);
        }

        if ($data['role'] !== RoleHelper::SUPER_ADMIN && !empty($data['organization_id'])) {
            $organization = $this->capabilities->ensureUserAssignment($actor, (int) $data['organization_id']);
            $planEnforcer = app(PlanEnforcementService::class);
            $planEnforcer->assertCanCreateUser($organization);
        }

        try {
            return DB::transaction(function () use ($data) {
                return User::create([
                    ...$data,
                    'password' => Hash::make($data['password']),
                ]);
            });
        } catch (QueryException $e) {
            throw new DomainActionException('Failed to create user: ' . $e->getMessage(), 500);
        }
    }

    public function updateUser(User $user, array $data, User $actor): User
    {
        if (isset($data['role'])) {
            $data['role'] = RoleHelper::normalize($data['role']);
        }

        if (isset($data['organization_id'])) {
            $organization = $this->capabilities->ensureUserAssignment($actor, (int) $data['organization_id']);
            $planEnforcer = app(PlanEnforcementService::class);
            $planEnforcer->assertCanCreateUser($organization);
        }

        DB::transaction(function () use ($user, $data) {
            $user->update($data);
        });

        $user->role = RoleHelper::normalize($user->role);
        return $user;
    }

    public function deleteUser(User $user, User $actor): void
    {
        if ($user->id === $actor->id) {
            throw new DomainActionException('You cannot delete yourself', 403);
        }

        $this->capabilities->ensureUserAssignment($actor, $user->organization_id ?? 0);

        DB::transaction(function () use ($user) {
            $user->delete();
        });
    }

    public function toggleActive(User $user, User $actor): User
    {
        if ($user->id === $actor->id) {
            throw new DomainActionException('You cannot toggle yourself', 403);
        }

        $this->capabilities->ensureUserAssignment($actor, $user->organization_id ?? 0);

        DB::transaction(function () use ($user) {
            $user->is_active = !$user->is_active;
            $user->save();
        });

        return $user;
    }
}
