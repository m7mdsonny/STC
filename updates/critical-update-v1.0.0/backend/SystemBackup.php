<?php

namespace App\Models;

class SystemBackup extends BaseModel
{
    protected $fillable = [
        'file_path',
        'status',
        'meta',
        'created_by',
        'restored_at',
        'restored_by',
    ];

    protected $casts = [
        'meta' => 'array',
        'created_at' => 'datetime',
        'restored_at' => 'datetime',
    ];

    public $timestamps = true;
}
