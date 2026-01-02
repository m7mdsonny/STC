<?php

namespace App\Models;

class AiPolicy extends BaseModel
{
    protected $table = 'ai_policies';

    protected $casts = [
        'is_enabled' => 'boolean',
        'modules' => 'array',
        'thresholds' => 'array',
        'actions' => 'array',
        'feature_flags' => 'array',
    ];

    public function events()
    {
        return $this->hasMany(AiPolicyEvent::class);
    }
}
