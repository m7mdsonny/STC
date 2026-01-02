<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BaseModel extends Model
{
    use SoftDeletes;

    // CRITICAL SECURITY FIX: Removed $guarded = []
    // Each model must define $fillable explicitly
    protected $fillable = [];
    
    protected $casts = [
        'meta' => 'array',
        'online' => 'boolean',
    ];
}
