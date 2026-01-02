<?php

namespace App\Models;

class OrganizationWording extends BaseModel
{
    protected $table = 'organization_wordings';

    protected $fillable = [
        'organization_id',
        'wording_id',
        'custom_value_ar',
        'custom_value_en',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function wording()
    {
        return $this->belongsTo(PlatformWording::class, 'wording_id');
    }
}

