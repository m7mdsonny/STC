<?php

namespace App\Models;

use App\Helpers\RoleHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'name',
        'email',
        'password',
        'phone',
        'role',
        'is_active',
        'is_super_admin',
        'last_login_at',
    ];
    
    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
        'is_super_admin' => 'boolean',
    ];

    /**
     * Accessor to always return normalized role
     * Prevents recursion by checking if we're already accessing the attribute
     */
    public function getRoleAttribute($value): string
    {
        // If value is null or empty, return default
        if (empty($value)) {
            return 'viewer';
        }
        
        // Normalize the role
        return RoleHelper::normalize($value);
    }

    /**
     * Mutator to normalize role when setting
     * Also syncs is_super_admin flag with role
     */
    public function setRoleAttribute($value): void
    {
        $normalized = RoleHelper::normalize($value ?? 'viewer');
        $this->attributes['role'] = $normalized;
        
        // Sync is_super_admin with role
        if ($normalized === RoleHelper::SUPER_ADMIN) {
            $this->attributes['is_super_admin'] = true;
        } elseif (isset($this->attributes['is_super_admin']) && $this->attributes['is_super_admin'] && $normalized !== RoleHelper::SUPER_ADMIN) {
            // If role is not super_admin but flag is true, sync it
            $this->attributes['is_super_admin'] = false;
        }
    }

    /**
     * Boot method to sync is_super_admin on save
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($user) {
            // Ensure is_super_admin is synced with role
            $normalizedRole = RoleHelper::normalize($user->role ?? 'viewer');
            if ($normalizedRole === RoleHelper::SUPER_ADMIN) {
                $user->is_super_admin = true;
            } elseif ($user->is_super_admin && $normalizedRole !== RoleHelper::SUPER_ADMIN) {
                $user->is_super_admin = false;
            }
        });
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return RoleHelper::isSuperAdmin($this->role, $this->is_super_admin ?? false);
    }

    /**
     * Check if user can manage organization
     */
    public function canManageOrganization(): bool
    {
        return RoleHelper::canManageOrganization($this->role);
    }

    /**
     * Check if user can edit
     */
    public function canEdit(): bool
    {
        return RoleHelper::canEdit($this->role);
    }

    /**
     * Get role label
     */
    public function getRoleLabel(): string
    {
        return RoleHelper::getLabel($this->role);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get registered faces created by this user
     */
    public function createdRegisteredFaces()
    {
        return $this->hasMany(RegisteredFace::class, 'created_by');
    }

    /**
     * Get registered faces updated by this user
     */
    public function updatedRegisteredFaces()
    {
        return $this->hasMany(RegisteredFace::class, 'updated_by');
    }

    /**
     * Get registered vehicles created by this user
     */
    public function createdRegisteredVehicles()
    {
        return $this->hasMany(RegisteredVehicle::class, 'created_by');
    }

    /**
     * Get registered vehicles updated by this user
     */
    public function updatedRegisteredVehicles()
    {
        return $this->hasMany(RegisteredVehicle::class, 'updated_by');
    }
}
