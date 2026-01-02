<?php

namespace App\Models;

class AiPolicyEvent extends BaseModel
{
    protected $table = 'ai_policy_events';

    protected $casts = [
        'payload' => 'array',
        'weight' => 'decimal:2',
    ];
}
