<?php

namespace App\Models;

class AiPolicyEvent extends BaseModel
{
    protected $table = 'ai_policy_events';

    protected $fillable = [
        'ai_policy_id',
        'event_type',
        'label',
        'payload',
        'weight',
    ];

    protected $casts = [
        'payload' => 'array',
        'weight' => 'decimal:2',
    ];
}
