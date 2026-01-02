<?php

namespace App\Models;

class BrandingSetting extends BaseModel
{
    protected $table = 'organizations_branding';

    protected $fillable = [
        'organization_id',
        'logo_url',
        'logo_dark_url',
        'favicon_url',
        'primary_color',
        'secondary_color',
        'accent_color',
        'danger_color',
        'warning_color',
        'success_color',
        'font_family',
        'heading_font',
        'border_radius',
        'custom_css',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
