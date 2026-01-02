<?php

namespace App\Models;

class SubscriptionPlanLimit extends BaseModel
{
    public $timestamps = true;

    protected $fillable = [
        'subscription_plan_id',
        'key',
        'value',
    ];
}
