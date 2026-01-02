<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiCameraBinding extends BaseModel
{
    protected $table = 'ai_camera_bindings';
    
    protected $fillable = [
        'camera_id',
        'scenario_id',
        'enabled',
        'camera_specific_config',
    ];
    
    protected $casts = [
        'enabled' => 'boolean',
        'camera_specific_config' => 'array',
    ];

    /**
     * Get the camera
     */
    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class, 'camera_id');
    }

    /**
     * Get the scenario
     */
    public function scenario(): BelongsTo
    {
        return $this->belongsTo(AiScenario::class, 'scenario_id');
    }

    /**
     * Scope: Enabled bindings only
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }
}
