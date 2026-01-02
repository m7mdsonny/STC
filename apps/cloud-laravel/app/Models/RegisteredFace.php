<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RegisteredFace extends BaseModel
{
    protected $table = 'registered_faces';

    protected $fillable = [
        'organization_id',
        'person_name',
        'employee_id',
        'department',
        'category',
        'photo_url',
        'face_encoding',
        'face_metadata',
        'is_active',
        'last_seen_at',
        'recognition_count',
        'meta',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'face_metadata' => 'array',
        'meta' => 'array',
        'last_seen_at' => 'datetime',
        'recognition_count' => 'integer',
    ];

    /**
     * Get the organization that owns this registered face
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
     * Get events related to this registered face
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'registered_face_id');
    }

    /**
     * Scope: Active faces only
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
     * Scope: Filter by department
     */
    public function scopeDepartment($query, string $department)
    {
        return $query->where('department', $department);
    }

    /**
     * Scope: Search by name, employee ID, or department
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('person_name', 'LIKE', "%{$search}%")
                ->orWhere('employee_id', 'LIKE', "%{$search}%")
                ->orWhere('department', 'LIKE', "%{$search}%");
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
     * Check if face encoding exists
     */
    public function hasFaceEncoding(): bool
    {
        return !empty($this->face_encoding);
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
            'has_encoding' => $this->hasFaceEncoding(),
        ];
    }
}

