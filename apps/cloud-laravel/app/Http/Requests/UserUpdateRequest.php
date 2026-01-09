<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $targetUser = $this->route('user');
        
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Users can update their own profile
        if ($user->id === $targetUser->id) {
            return true;
        }
        
        // Org managers can update users in their organization
        if ($user->organization_id === $targetUser->organization_id) {
            return RoleHelper::canManageOrganization($user->role);
        }
        
        return false;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        $userId = $this->route('user')->id;
        
        return [
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'password' => 'sometimes|string|min:6',
            'phone' => 'nullable|string|max:50',
            'role' => 'sometimes|string|in:' . implode(',', RoleHelper::VALID_ROLES),
            'organization_id' => 'nullable|exists:organizations,id',
        ];
    }

    /**
     * Prepare the data for validation
     */
    protected function prepareForValidation(): void
    {
        $user = $this->user();
        $targetUser = $this->route('user');
        
        // Non-super-admin users cannot change organization_id
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->merge([
                'organization_id' => $targetUser->organization_id,
            ]);
        }
        
        // Super admin users should not have organization_id
        if (isset($this->role) && $this->role === RoleHelper::SUPER_ADMIN) {
            $this->merge([
                'organization_id' => null,
            ]);
        }
    }
}
