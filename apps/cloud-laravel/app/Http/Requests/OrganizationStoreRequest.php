<?php

namespace App\Http\Requests;

use App\Helpers\RoleHelper;
use Illuminate\Foundation\Http\FormRequest;

class OrganizationStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request
     */
    public function authorize(): bool
    {
        // Only super admin can create organizations
        return RoleHelper::isSuperAdmin($this->user()->role, $this->user()->is_super_admin ?? false);
    }

    /**
     * Get the validation rules that apply to the request
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:255',
            'subscription_plan' => 'required|string',
            'max_cameras' => 'nullable|integer|min:1',
            'max_edge_servers' => 'nullable|integer|min:1',
            'reseller_id' => 'nullable|exists:resellers,id',
            'distributor_id' => 'nullable|exists:distributors,id',
        ];
    }
}
