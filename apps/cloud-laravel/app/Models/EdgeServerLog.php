<?php

namespace App\Models;

class EdgeServerLog extends BaseModel
{
    protected $table = 'edge_server_logs';

    protected $fillable = [
        'organization_id',
        'edge_server_id',
        'level',
        'message',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
