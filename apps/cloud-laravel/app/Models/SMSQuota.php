<?php

namespace App\Models;

class SMSQuota extends BaseModel
{
    protected $table = 'sms_quotas';

    protected $casts = [
        'resets_at' => 'datetime',
    ];
}
