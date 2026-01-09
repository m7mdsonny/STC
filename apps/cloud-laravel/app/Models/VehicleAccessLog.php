<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleAccessLog extends BaseModel
{
    protected $table = 'vehicle_access_logs';

    protected $fillable = [
        'organization_id',
        'vehicle_id',
        'camera_id',
        'plate_number',
        'plate_ar',
        'direction',
        'access_granted',
        'access_reason',
        'confidence_score',
        'photo_url',
        'recognition_metadata',
        'recognized_at',
        'meta',
    ];

    protected $casts = [
        'access_granted' => 'boolean',
        'recognition_metadata' => 'array',
        'meta' => 'array',
        'recognized_at' => 'datetime',
        'confidence_score' => 'decimal:2',
    ];

    /**
     * Get the organization that owns this access log
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the registered vehicle
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(RegisteredVehicle::class, 'vehicle_id');
    }

    /**
     * Get the camera that recognized the vehicle
     */
    public function camera(): BelongsTo
    {
        return $this->belongsTo(Camera::class);
    }

    /**
     * Scope: Filter by access granted
     */
    public function scopeAccessGranted($query, bool $granted = true)
    {
        return $query->where('access_granted', $granted);
    }

    /**
     * Scope: Filter by direction
     */
    public function scopeDirection($query, string $direction)
    {
        return $query->where('direction', $direction);
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeDateRange($query, $from, $to)
    {
        return $query->whereBetween('recognized_at', [$from, $to]);
    }

    /**
     * Scope: High confidence recognitions
     */
    public function scopeHighConfidence($query, float $threshold = 80.0)
    {
        return $query->where('confidence_score', '>=', $threshold);
    }

    /**
     * Get access status badge
     */
    public function getAccessStatusBadge(): string
    {
        return $this->access_granted ? 'success' : 'danger';
    }

    /**
     * Get direction icon
     */
    public function getDirectionIcon(): string
    {
        return $this->direction === 'in' ? 'arrow-right' : 'arrow-left';
    }
}

