<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EdgeServerUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $edgeServer = $this->route('edgeServer');
        
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can update edge servers in their organization
        if ($user->organization_id === $edgeServer->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        $edgeServerId = $this->route('edgeServer')->id;
        
        return [
            'name' => 'sometimes|string|max:255',
            'organization_id' => 'sometimes|exists:organizations,id',
            'license_id' => 'nullable|exists:licenses,id',
            'edge_id' => ['sometimes', 'string', Rule::unique('edge_servers', 'edge_id')->ignore($edgeServerId)],
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'internal_ip' => 'nullable|ip',
            'public_ip' => 'nullable|ip',
            'hostname' => 'nullable|string|max:255',
        ];
    }
}
