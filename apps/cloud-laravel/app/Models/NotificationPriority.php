<?php

namespace App\Models;

class NotificationPriority extends BaseModel
{
    protected $table = 'notification_priorities';

    protected $fillable = [
        'organization_id',
        'notification_type',
        'priority',
        'is_critical',
    ];

    protected $casts = [
        'is_critical' => 'boolean',
    ];
}
