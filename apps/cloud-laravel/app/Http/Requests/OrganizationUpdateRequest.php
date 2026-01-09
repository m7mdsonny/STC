<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;

class OrganizationUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $organization = $this->route('organization');
        
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can update their own organization
        if ($user->organization_id === $organization->id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'subscription_plan' => 'sometimes|string',
            'max_cameras' => 'nullable|integer|min:1',
            'max_edge_servers' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
            'reseller_id' => 'nullable|exists:resellers,id',
            'distributor_id' => 'nullable|exists:distributors,id',
            'logo_url' => 'nullable|string|max:500',
        ];
    }
}
