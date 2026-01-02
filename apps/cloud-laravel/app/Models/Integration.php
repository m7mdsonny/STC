<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Integration extends Model
{
    protected $fillable = [
        'organization_id',
        'edge_server_id',
        'name',
        'type',
        'connection_config',
        'is_active',
    ];

    protected $casts = [
        'connection_config' => 'array',
        'is_active' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function edgeServer(): BelongsTo
    {
        return $this->belongsTo(EdgeServer::class);
    }
}



