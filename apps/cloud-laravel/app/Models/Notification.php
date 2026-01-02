<?php

namespace App\Models;

class Notification extends BaseModel
{
    protected $table = 'notifications';

    protected $fillable = [
        'organization_id',
        'user_id',
        'edge_server_id',
        'title',
        'body',
        'priority',
        'channel',
        'status',
        'meta',
        'read_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'read_at' => 'datetime',
    ];
}
