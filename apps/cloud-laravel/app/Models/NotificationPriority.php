<?php

namespace App\Models;

class NotificationPriority extends BaseModel
{
    protected $casts = [
        'is_critical' => 'boolean',
    ];
}
