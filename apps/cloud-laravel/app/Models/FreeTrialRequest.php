<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FreeTrialRequest extends BaseModel
{
    use SoftDeletes;

    protected $table = 'free_trial_requests';
    
    protected $fillable = [
        'name',
        'email',
        'phone',
        'company_name',
        'job_title',
        'message',
        'selected_modules',
        'status',
        'admin_notes',
        'assigned_admin_id',
        'converted_organization_id',
        'contacted_at',
        'demo_scheduled_at',
        'demo_completed_at',
        'converted_at',
    ];
    
    protected $casts = [
        'selected_modules' => 'array',
        'contacted_at' => 'datetime',
        'demo_scheduled_at' => 'datetime',
        'demo_completed_at' => 'datetime',
        'converted_at' => 'datetime',
    ];

    /**
     * Get the assigned admin user
     */
    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_admin_id');
    }

    /**
     * Get the converted organization
     */
    public function convertedOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'converted_organization_id');
    }

    /**
     * Scope: By status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: New requests
     */
    public function scopeNew($query)
    {
        return $query->where('status', 'new');
    }

    /**
     * Scope: Assigned to admin
     */
    public function scopeAssignedTo($query, int $adminId)
    {
        return $query->where('assigned_admin_id', $adminId);
    }
}
