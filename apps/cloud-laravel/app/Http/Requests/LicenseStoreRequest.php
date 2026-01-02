<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;

class LicenseStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Super admin can create licenses for any organization
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can create licenses for their organization
        return RoleHelper::canManageOrganization($user->role) && $user->organization_id !== null;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        return [
            'organization_id' => 'required|exists:organizations,id',
            'subscription_plan_id' => 'nullable|exists:subscription_plans,id',
            'plan' => 'required|string',
            'license_key' => 'required|string|unique:licenses,license_key',
            'status' => 'sometimes|string|in:active,suspended,expired',
            'max_cameras' => 'nullable|integer|min:1',
            'modules' => 'nullable|array',
            'trial_ends_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
        ];
    }

    /**
     * Prepare the data for validation
     */
    protected function prepareForValidation(): void
    {
        $user = $this->user();
        
        // Non-super-admin users can only create licenses for their organization
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->merge([
                'organization_id' => $user->organization_id,
            ]);
        }
    }
}
