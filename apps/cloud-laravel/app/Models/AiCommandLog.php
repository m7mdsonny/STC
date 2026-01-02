<?php

namespace App\Models;

class AiCommandLog extends BaseModel
{
    protected $casts = [
        'meta' => 'array',
    ];

    public function command()
    {
        return $this->belongsTo(AiCommand::class, 'ai_command_id');
    }
}
