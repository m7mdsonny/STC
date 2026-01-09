<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LicenseUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $license = $this->route('license');
        
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can update licenses in their organization
        if ($user->organization_id === $license->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        $licenseId = $this->route('license')->id;
        
        return [
            'organization_id' => 'sometimes|exists:organizations,id',
            'subscription_plan_id' => 'nullable|exists:subscription_plans,id',
            'plan' => 'sometimes|string',
            'license_key' => ['sometimes', 'string', Rule::unique('licenses', 'license_key')->ignore($licenseId)],
            'status' => 'sometimes|string|in:active,suspended,expired',
            'edge_server_id' => 'nullable|exists:edge_servers,id',
            'max_cameras' => 'nullable|integer|min:1',
            'modules' => 'nullable|array',
            'trial_ends_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
        ];
    }
}
