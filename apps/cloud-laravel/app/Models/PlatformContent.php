<?php

namespace App\Models;

class PlatformContent extends BaseModel
{
    protected $table = 'platform_contents';
    
    protected $fillable = [
        'key',
        'value',
        'section',
        'published',
    ];
    
    protected $casts = [
        'published' => 'boolean',
        'value' => 'string',
    ];
}
