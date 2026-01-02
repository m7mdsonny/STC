<?php

namespace App\Models;

class AnalyticsWidget extends BaseModel
{
    protected $table = 'analytics_widgets';

    protected $casts = [
        'config' => 'array',
        'filters' => 'array',
    ];

    public function dashboard()
    {
        return $this->belongsTo(AnalyticsDashboard::class, 'dashboard_id');
    }
}
