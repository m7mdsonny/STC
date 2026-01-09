<?php

namespace App\Models;

class Reseller extends BaseModel
{
    protected $fillable = [
        'name',
        'name_en',
        'email',
        'phone',
        'company_name',
        'tax_number',
        'address',
        'city',
        'country',
        'commission_rate',
        'discount_rate',
        'credit_limit',
        'contact_person',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
