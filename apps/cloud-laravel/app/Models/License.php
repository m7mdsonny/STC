<?php

namespace App\Models;

class License extends BaseModel
{
    protected $table = 'licenses';

    protected $fillable = [
        'organization_id',
        'subscription_plan_id',
        'plan',
        'license_key',
        'status',
        'edge_server_id',
        'max_cameras',
        'modules',
        'trial_ends_at',
        'activated_at',
        'expires_at',
    ];

    protected $casts = [
        'modules' => 'array',
        'trial_ends_at' => 'datetime',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
    ];
}
