<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutomationLog extends Model
{
    protected $fillable = [
        'organization_id',
        'automation_rule_id',
        'alert_id',
        'action_executed',
        'status',
        'error_message',
        'execution_time_ms',
    ];

    protected $casts = [
        'action_executed' => 'array',
        'execution_time_ms' => 'integer',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function automationRule(): BelongsTo
    {
        return $this->belongsTo(AutomationRule::class);
    }

    public function alert(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'alert_id');
    }
}

