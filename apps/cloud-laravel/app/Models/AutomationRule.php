<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AutomationRule extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'integration_id',
        'name',
        'name_ar',
        'description',
        'trigger_module',
        'trigger_event',
        'trigger_conditions',
        'action_type',
        'action_command',
        'cooldown_seconds',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'trigger_conditions' => 'array',
        'action_command' => 'array',
        'is_active' => 'boolean',
        'cooldown_seconds' => 'integer',
        'priority' => 'integer',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AutomationLog::class);
    }
}

