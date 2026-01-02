<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiScenario extends BaseModel
{
    protected $table = 'ai_scenarios';
    
    protected $fillable = [
        'organization_id',
        'module',
        'scenario_type',
        'name',
        'description',
        'enabled',
        'severity_threshold',
        'config',
    ];
    
    protected $casts = [
        'enabled' => 'boolean',
        'severity_threshold' => 'integer',
        'config' => 'array',
    ];

    /**
     * Get the organization that owns this scenario
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the rules for this scenario
     */
    public function rules(): HasMany
    {
        return $this->hasMany(AiScenarioRule::class, 'scenario_id')->where('enabled', true)->orderBy('order');
    }

    /**
     * Get all rules (including disabled)
     */
    public function allRules(): HasMany
    {
        return $this->hasMany(AiScenarioRule::class, 'scenario_id')->orderBy('order');
    }

    /**
     * Get camera bindings for this scenario
     */
    public function cameraBindings(): HasMany
    {
        return $this->hasMany(AiCameraBinding::class, 'scenario_id');
    }

    /**
     * Get active camera bindings
     */
    public function activeCameraBindings(): HasMany
    {
        return $this->hasMany(AiCameraBinding::class, 'scenario_id')->where('enabled', true);
    }

    /**
     * Scope: Enabled scenarios only
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    /**
     * Scope: By module
     */
    public function scopeByModule($query, string $module)
    {
        return $query->where('module', $module);
    }
}
