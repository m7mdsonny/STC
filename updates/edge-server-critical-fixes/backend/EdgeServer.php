<?php

namespace App\Models;

class EdgeServer extends BaseModel
{
    protected $table = 'edge_servers';

    protected $casts = [
        'online' => 'boolean',
        'system_info' => 'array',
        'last_seen_at' => 'datetime',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function license()
    {
        return $this->belongsTo(License::class);
    }

    public function cameras()
    {
        return $this->hasMany(Camera::class);
    }
}
