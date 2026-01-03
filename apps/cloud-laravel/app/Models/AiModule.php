<?php

namespace App\Models;

class AiModule extends BaseModel
{
    // Note: SoftDeletes removed - table doesn't have deleted_at column
    // If soft deletes are needed, add deleted_at column via migration first

    protected $table = 'ai_modules';

    protected $fillable = [
        'name', // UNIQUE column in database
        'display_name',
        'display_name_ar',
        'description',
        'description_ar',
        'config_schema',
        'default_config',
        'required_camera_type',
        'min_fps',
        'min_resolution',
        'icon',
        'display_order',
        'is_active', // Table uses is_active, not is_enabled
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'config_schema' => 'array',
        'default_config' => 'array',
        'min_fps' => 'integer',
        'display_order' => 'integer',
    ];

    public function configs()
    {
        return $this->hasMany(AiModuleConfig::class, 'module_id');
    }
}

