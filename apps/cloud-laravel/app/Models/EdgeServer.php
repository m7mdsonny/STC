<?php

namespace App\Models;

class EdgeServer extends BaseModel
{
    protected $table = 'edge_servers';

    protected $fillable = [
        'organization_id',
        'license_id',
        'edge_id',
        'edge_key',
        'edge_secret',
        'name',
        'hardware_id',
        'ip_address',
        'internal_ip',
        'public_ip',
        'hostname',
        'version',
        'location',
        'notes',
        'online',
        'last_seen_at',
        'system_info',
    ];

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
