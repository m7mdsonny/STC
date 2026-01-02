<?php

namespace App\Models;

class SubscriptionPlan extends BaseModel
{
    protected $fillable = [
        'name',
        'name_ar',
        'max_cameras',
        'max_edge_servers',
        'available_modules',
        'notification_channels',
        'price_monthly',
        'price_yearly',
        'is_active',
    ];

    protected $casts = [
        'available_modules' => 'array',
        'notification_channels' => 'array',
        'is_active' => 'boolean',
        'sms_quota' => 'integer',
    ];

    public function limits()
    {
        return $this->hasMany(SubscriptionPlanLimit::class);
    }

    /**
     * Get organizations subscribed to this plan
     */
    public function organizations()
    {
        return $this->hasManyThrough(
            Organization::class,
            OrganizationSubscription::class,
            'subscription_plan_id',
            'id',
            'id',
            'organization_id'
        );
    }
}
