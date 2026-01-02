<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;

class CameraStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Super admin can create cameras for any organization
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Editors and above can create cameras for their organization
        return RoleHelper::canEdit($user->role) && $user->organization_id !== null;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        return [
            'organization_id' => 'required|exists:organizations,id',
            'edge_server_id' => 'required|exists:edge_servers,id',
            'name' => 'required|string|max:255',
            'camera_id' => 'nullable|string|unique:cameras,camera_id',
            'rtsp_url' => 'required|string|max:500',
            'location' => 'nullable|string|max:255',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'resolution' => 'nullable|string|max:50',
            'fps' => 'nullable|integer|min:1|max:60',
            'enabled_modules' => 'nullable|array',
            'status' => 'nullable|string|in:online,offline,error',
        ];
    }

    /**
     * Prepare the data for validation
     */
    protected function prepareForValidation(): void
    {
        $user = $this->user();
        
        // Non-super-admin users can only create cameras for their organization
        if (!RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            $this->merge([
                'organization_id' => $user->organization_id,
            ]);
        }
    }
}
