<?php

namespace App\Models;

class Camera extends BaseModel
{
    protected $table = 'cameras';

    protected $casts = [
        'config' => 'array',
        'enabled_modules' => 'array',
    ];

    protected $fillable = [
        'organization_id',
        'edge_server_id',
        'name',
        'camera_id',
        'rtsp_url',
        'location',
        'status',
        'config',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function edgeServer()
    {
        return $this->belongsTo(EdgeServer::class);
    }

    public function vehicleAccessLogs()
    {
        return $this->hasMany(VehicleAccessLog::class);
    }
}

