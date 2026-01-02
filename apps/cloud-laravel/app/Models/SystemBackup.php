<?php

namespace App\Models;

class SystemBackup extends BaseModel
{
    protected $fillable = [
        'file_path',
        'status',
        'meta',
        'created_by',
    ];

    protected $casts = [
        'meta' => 'array',
        'created_at' => 'datetime',
    ];

    public $timestamps = true;
}
