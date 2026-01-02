<?php

namespace App\Models;

class AnalyticsReport extends BaseModel
{
    protected $table = 'analytics_reports';

    protected $casts = [
        'parameters' => 'array',
        'filters' => 'array',
        'recipients' => 'array',
        'is_scheduled' => 'boolean',
        'last_generated_at' => 'datetime',
        'next_scheduled_at' => 'datetime',
    ];
}
