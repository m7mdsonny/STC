<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Helpers\RoleHelper;
use App\Support\DomainExecutionContext;
use Closure;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DomainActionService
{
    public function __construct(
        protected DatabaseManager $db,
        protected OrganizationCapabilitiesResolver $capabilitiesResolver
    ) {
    }

    /**
    * Executes a mutating domain action inside a transaction with capability checks.
    */
    public function execute(Request $request, Closure $action, ?Closure $capabilityCheck = null): mixed
    {
        DomainExecutionContext::markServiceUsed($request);

        $user = $request->user() ?? Auth::user();
        if (!$user) {
            throw new DomainActionException('Authentication required', 401);
        }

        $isSuperAdmin = RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false);
        if ($user->organization_id === null && !$isSuperAdmin) {
            Log::warning('Mutation blocked because organization context is missing', [
                'user_id' => $user->id,
                'role' => $user->role,
                'route' => $request->path(),
            ]);
            throw new DomainActionException('Organization context is required for this action');
        }

        if ($capabilityCheck) {
            $capabilityCheck();
        } elseif ($user && $user->organization_id) {
            $this->capabilitiesResolver->ensureOrganizationCanMutate($user->organization_id);
        }

        return $this->db->transaction(function () use ($action) {
            return $action();
        });
    }
}
