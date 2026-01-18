<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EdgeNonce extends Model
{
    protected $table = 'edge_nonces';
    
    protected $fillable = [
        'nonce',
        'edge_server_id',
        'ip_address',
        'used_at',
    ];
    
    protected $casts = [
        'used_at' => 'datetime',
    ];

    /**
     * Get the edge server
     */
    public function edgeServer(): BelongsTo
    {
        return $this->belongsTo(EdgeServer::class);
    }
}
