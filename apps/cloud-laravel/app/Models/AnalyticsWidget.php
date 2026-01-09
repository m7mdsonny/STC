<?php

namespace App\Models;

class AnalyticsWidget extends BaseModel
{
    protected $table = 'analytics_widgets';

    protected $fillable = [
        'dashboard_id',
        'name',
        'widget_type',
        'config',
        'data_source',
        'filters',
        'position_x',
        'position_y',
        'width',
        'height',
    ];

    protected $casts = [
        'config' => 'array',
        'filters' => 'array',
    ];

    public function dashboard()
    {
        return $this->belongsTo(AnalyticsDashboard::class, 'dashboard_id');
    }
}
