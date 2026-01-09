<?php

namespace App\Models;

class AiModuleConfig extends BaseModel
{
    protected $table = 'ai_module_configs';

    protected $fillable = [
        'organization_id',
        'module_id',
        'is_enabled',
        'is_licensed',
        'config',
        'confidence_threshold',
        'alert_threshold',
        'cooldown_seconds',
        'schedule_enabled',
        'schedule',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'is_licensed' => 'boolean',
        'config' => 'array',
        'confidence_threshold' => 'decimal:2',
        'alert_threshold' => 'integer',
        'cooldown_seconds' => 'integer',
        'schedule_enabled' => 'boolean',
        'schedule' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function module()
    {
        return $this->belongsTo(AiModule::class, 'module_id');
    }
}

