<?php

namespace App\Models;

class SystemSetting extends BaseModel
{
    protected $fillable = [
        'platform_name',
        'platform_tagline',
        'support_email',
        'support_phone',
        'default_timezone',
        'default_language',
        'maintenance_mode',
        'maintenance_message',
        'session_timeout_minutes',
        'max_login_attempts',
        'password_min_length',
        'require_2fa',
        'allow_registration',
        'require_email_verification',
        'email_settings',
        'sms_settings',
        'fcm_settings',
        'storage_settings',
    ];

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
