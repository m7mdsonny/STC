<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiAlertPolicy extends BaseModel
{
    protected $table = 'ai_alert_policies';
    
    protected $fillable = [
        'organization_id',
        'risk_level',
        'notify_web',
        'notify_mobile',
        'notify_email',
        'notify_sms',
        'cooldown_minutes',
        'notification_channels',
    ];
    
    protected $casts = [
        'notify_web' => 'boolean',
        'notify_mobile' => 'boolean',
        'notify_email' => 'boolean',
        'notify_sms' => 'boolean',
        'cooldown_minutes' => 'integer',
        'notification_channels' => 'array',
    ];

    /**
     * Get the organization that owns this policy
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope: By risk level
     */
    public function scopeByRiskLevel($query, string $riskLevel)
    {
        return $query->where('risk_level', $riskLevel);
    }
}
