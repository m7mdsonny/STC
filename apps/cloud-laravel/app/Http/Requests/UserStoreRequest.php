<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;

class UserStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Super admin can create any user
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Org managers can create users in their organization
        return RoleHelper::canManageOrganization($user->role) && $user->organization_id !== null;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:50',
            'role' => 'required|string|in:' . implode(',', RoleHelper::VALID_ROLES),
            'organization_id' => 'nullable|exists:organizations,id',
        ];
    }

    /**
     * Prepare the data for validation
     */
    protected function prepareForValidation(): void
    {
        $user = $this->user();
        
        // Non-super-admin users can only create users for their organization
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->merge([
                'organization_id' => $user->organization_id,
            ]);
        }
    }
}
