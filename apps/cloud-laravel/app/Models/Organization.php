<?php

namespace App\Models;

class Organization extends BaseModel
{
    protected $fillable = [
        'distributor_id',
        'reseller_id',
        'name',
        'name_en',
        'logo_url',
        'address',
        'city',
        'phone',
        'email',
        'tax_number',
        'subscription_plan',
        'max_cameras',
        'max_edge_servers',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function reseller()
    {
        return $this->belongsTo(Reseller::class);
    }

    public function distributor()
    {
        return $this->belongsTo(Distributor::class);
    }

    public function subscriptionPlan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan', 'name');
    }

    /**
     * Get the active subscription for this organization
     */
    public function activeSubscription()
    {
        return $this->hasOne(OrganizationSubscription::class)
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->latest();
    }

    /**
     * Get all subscriptions for this organization
     */
    public function subscriptions()
    {
        return $this->hasMany(OrganizationSubscription::class);
    }

    public function branding()
    {
        return $this->hasOne(BrandingSetting::class);
    }

    public function smsQuota()
    {
        return $this->hasOne(SMSQuota::class);
    }

    public function registeredFaces()
    {
        return $this->hasMany(RegisteredFace::class);
    }

    public function registeredVehicles()
    {
        return $this->hasMany(RegisteredVehicle::class);
    }

    public function vehicleAccessLogs()
    {
        return $this->hasMany(VehicleAccessLog::class);
    }
}
