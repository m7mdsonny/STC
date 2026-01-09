<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

class PlatformWording extends BaseModel
{
    use SoftDeletes;

    protected $table = 'platform_wordings';

    protected $fillable = [
        'key',
        'label',
        'value_ar',
        'value_en',
        'category',
        'context',
        'description',
        'is_customizable',
    ];

    protected $casts = [
        'is_customizable' => 'boolean',
    ];

    public function organizationCustomizations()
    {
        return $this->hasMany(OrganizationWording::class, 'wording_id');
    }
}

