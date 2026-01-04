<?php

namespace App\Services;

use App\Exceptions\DomainActionException;
use App\Support\DomainExecutionContext;
use Closure;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        $user = Auth::user();
        if ($user && $user->organization_id === null && !$user->is_super_admin) {
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
