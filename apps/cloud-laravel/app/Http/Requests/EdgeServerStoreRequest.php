<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;

class EdgeServerStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Super admin can create edge servers for any organization
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can create edge servers for their organization
        return RoleHelper::canManageOrganization($user->role) && $user->organization_id !== null;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'organization_id' => 'sometimes|exists:organizations,id',
            'license_id' => 'nullable|exists:licenses,id',
            'edge_id' => 'nullable|string|unique:edge_servers,edge_id',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'internal_ip' => 'nullable|ip',
            'public_ip' => 'nullable|ip',
            'hostname' => 'nullable|string|max:255',
        ];
    }

    /**
     * Prepare the data for validation
     */
    protected function prepareForValidation(): void
    {
        $user = $this->user();
        
        // Non-super-admin users can only create edge servers for their organization
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->merge([
                'organization_id' => $user->organization_id,
            ]);
        }
    }
}
