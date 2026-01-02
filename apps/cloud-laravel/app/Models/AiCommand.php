<?php

namespace App\Models;

class AiCommand extends BaseModel
{
    protected $casts = [
        'payload' => 'array',
    ];

    public function targets()
    {
        return $this->hasMany(AiCommandTarget::class, 'ai_command_id');
    }

    public function logs()
    {
        return $this->hasMany(AiCommandLog::class, 'ai_command_id');
    }
}
