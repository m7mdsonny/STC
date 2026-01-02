<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CameraUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $camera = $this->route('camera');
        
        // Super admin can update all
        if (RoleHelper::isSuperAdmin($user->role, $user->is_super_admin ?? false)) {
            return true;
        }
        
        // Editors and above can update cameras in their organization
        if ($user->organization_id === $camera->organization_id) {
            return RoleHelper::canEdit($user->role);
        }
        
        return false;
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        $cameraId = $this->route('camera')->id;
        
        return [
            'name' => 'sometimes|string|max:255',
            'edge_server_id' => 'nullable|exists:edge_servers,id',
            'camera_id' => ['sometimes', 'string', Rule::unique('cameras', 'camera_id')->ignore($cameraId)],
            'rtsp_url' => 'sometimes|string|url',
            'location' => 'nullable|string|max:255',
            'status' => 'sometimes|string|in:online,offline,error',
            'config' => 'nullable|array',
        ];
    }
}
