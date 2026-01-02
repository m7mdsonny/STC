<?php

namespace App\Models;

class SMSQuota extends BaseModel
{
    protected $table = 'sms_quotas';

    protected $fillable = [
        'organization_id',
        'monthly_limit',
        'used_this_month',
        'resets_at',
    ];

    protected $casts = [
        'resets_at' => 'datetime',
    ];
}
