<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiScenarioRule extends BaseModel
{
    protected $table = 'ai_scenario_rules';
    
    protected $fillable = [
        'scenario_id',
        'rule_type',
        'rule_value',
        'weight',
        'enabled',
        'order',
    ];
    
    protected $casts = [
        'rule_value' => 'array',
        'weight' => 'integer',
        'enabled' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Get the scenario that owns this rule
     */
    public function scenario(): BelongsTo
    {
        return $this->belongsTo(AiScenario::class, 'scenario_id');
    }

    /**
     * Scope: Enabled rules only
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    /**
     * Scope: Ordered by evaluation order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
