<?php

namespace App\Models;

class Reseller extends BaseModel
{
    protected $casts = [
        'is_active' => 'boolean',
    ];
}
