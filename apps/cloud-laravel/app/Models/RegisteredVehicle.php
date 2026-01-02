<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RegisteredVehicle extends BaseModel
{
    protected $table = 'registered_vehicles';

    protected $fillable = [
        'organization_id',
        'plate_number',
        'plate_ar',
        'owner_name',
        'vehicle_type',
        'vehicle_color',
        'vehicle_make',
        'vehicle_model',
        'category',
        'photo_url',
        'plate_encoding',
        'vehicle_metadata',
        'is_active',
        'last_seen_at',
        'recognition_count',
        'meta',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'vehicle_metadata' => 'array',
        'meta' => 'array',
        'last_seen_at' => 'datetime',
        'recognition_count' => 'integer',
    ];

    /**
     * Get the organization that owns this registered vehicle
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the user who created this record
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this record
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get access logs for this vehicle
     */
    public function accessLogs(): HasMany
    {
        return $this->hasMany(VehicleAccessLog::class, 'vehicle_id');
    }

    /**
     * Get events related to this registered vehicle
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'registered_vehicle_id');
    }

    /**
     * Scope: Active vehicles only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Filter by category
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope: Search by plate number, Arabic plate, or owner name
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('plate_number', 'LIKE', "%{$search}%")
                ->orWhere('plate_ar', 'LIKE', "%{$search}%")
                ->orWhere('owner_name', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Increment recognition count and update last seen
     */
    public function recordRecognition(): void
    {
        $this->increment('recognition_count');
        $this->update(['last_seen_at' => now()]);
    }

    /**
     * Check if plate encoding exists
     */
    public function hasPlateEncoding(): bool
    {
        return !empty($this->plate_encoding);
    }

    /**
     * Get full vehicle description
     */
    public function getFullDescription(): string
    {
        $parts = [];
        if ($this->vehicle_make) $parts[] = $this->vehicle_make;
        if ($this->vehicle_model) $parts[] = $this->vehicle_model;
        if ($this->vehicle_color) $parts[] = $this->vehicle_color;
        if ($this->vehicle_type) $parts[] = $this->vehicle_type;
        
        $description = implode(' ', $parts);
        return $description ?: 'Unknown Vehicle';
    }

    /**
     * Get recognition statistics
     */
    public function getRecognitionStats(): array
    {
        return [
            'total_recognitions' => $this->recognition_count,
            'last_seen' => $this->last_seen_at?->diffForHumans(),
            'is_active' => $this->is_active,
            'has_encoding' => $this->hasPlateEncoding(),
            'access_logs_count' => $this->accessLogs()->count(),
        ];
    }
}

