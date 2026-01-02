<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

class AiModule extends BaseModel
{
    use SoftDeletes;

    protected $table = 'ai_modules';

    protected $fillable = [
        'module_key',
        'name',
        'description',
        'category',
        'is_enabled',
        'is_premium',
        'min_plan_level',
        'config_schema',
        'default_config',
        'required_camera_type',
        'min_fps',
        'min_resolution',
        'icon',
        'display_order',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'is_premium' => 'boolean',
        'min_plan_level' => 'integer',
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

