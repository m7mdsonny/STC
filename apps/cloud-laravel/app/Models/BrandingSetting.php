<?php

namespace App\Models;

class BrandingSetting extends BaseModel
{
    protected $table = 'organizations_branding';

    protected $casts = [
        'meta' => 'array',
    ];
}
