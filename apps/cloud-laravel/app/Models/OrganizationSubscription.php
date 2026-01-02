<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationSubscription extends BaseModel
{
    protected $table = 'organization_subscriptions';

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    protected $fillable = [
        'organization_id',
        'subscription_plan_id',
        'starts_at',
        'ends_at',
        'status',
        'notes',
    ];

    /**
     * Get the organization that owns this subscription
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the subscription plan
     */
    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    /**
     * Check if subscription is currently active
     */
    public function isActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        $now = now();
        
        // If no start date, consider it active
        if (!$this->starts_at || $this->starts_at <= $now) {
            // If no end date, consider it active
            if (!$this->ends_at || $this->ends_at > $now) {
                return true;
            }
        }

        return false;
    }
}
