<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceToken extends Model
{
    protected $fillable = [
        'user_id',
        'organization_id',
        'token',
        'device_type',
        'device_id',
        'device_name',
        'app_version',
        'is_active',
        'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Helper to get organization_id through user
    public function getOrganizationIdAttribute()
    {
        return $this->user?->organization_id;
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}

