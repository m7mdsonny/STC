<?php

namespace App\Models;

class SystemSetting extends BaseModel
{
    protected $casts = [
        'maintenance_mode' => 'boolean',
        'require_2fa' => 'boolean',
        'allow_registration' => 'boolean',
        'require_email_verification' => 'boolean',
        'email_settings' => 'array',
        'sms_settings' => 'array',
        'fcm_settings' => 'array',
        'storage_settings' => 'array',
    ];
}
