<?php

namespace App\Models;

class AnalyticsReport extends BaseModel
{
    protected $table = 'analytics_reports';

    protected $fillable = [
        'organization_id',
        'name',
        'report_type',
        'parameters',
        'filters',
        'format',
        'file_url',
        'file_size',
        'is_scheduled',
        'schedule_cron',
        'last_generated_at',
        'next_scheduled_at',
        'recipients',
        'status',
        'error_message',
        'created_by',
    ];

    protected $casts = [
        'parameters' => 'array',
        'filters' => 'array',
        'recipients' => 'array',
        'is_scheduled' => 'boolean',
        'last_generated_at' => 'datetime',
        'next_scheduled_at' => 'datetime',
    ];
}
