<?php

namespace App\Models;

class AnalyticsDashboard extends BaseModel
{
    protected $table = 'analytics_dashboards';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'is_default',
        'layout',
        'is_public',
        'shared_with',
    ];

    protected $casts = [
        'layout' => 'array',
        'is_default' => 'boolean',
        'is_public' => 'boolean',
        'shared_with' => 'array',
    ];

    public function widgets()
    {
        return $this->hasMany(AnalyticsWidget::class, 'dashboard_id');
    }
}
