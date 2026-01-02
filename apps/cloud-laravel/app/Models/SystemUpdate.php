<?php

namespace App\Models;

class SystemUpdate extends BaseModel
{
    protected $table = 'system_updates';

    protected $fillable = [
        'version',
        'update_id',
        'manifest',
        'status',
        'backup_id',
        'installed_at',
        'error_message',
    ];

    protected $casts = [
        'manifest' => 'array',
        'installed_at' => 'datetime',
    ];
}

