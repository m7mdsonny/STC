<?php

namespace App\Models;

class UpdateAnnouncement extends BaseModel
{
    protected $table = 'updates';

    protected $fillable = [
        'title',
        'version',
        'version_type',
        'body',
        'release_notes',
        'changelog',
        'affected_modules',
        'requires_manual_update',
        'download_url',
        'checksum',
        'file_size_mb',
        'is_published',
        'organization_id',
        'published_at',
        'release_date',
        'end_of_support_date',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'release_date' => 'datetime',
        'end_of_support_date' => 'datetime',
        'affected_modules' => 'array',
        'requires_manual_update' => 'boolean',
        'file_size_mb' => 'integer',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function getSemanticVersionAttribute(): string
    {
        if (!$this->version) {
            return '0.0.0';
        }
        return $this->version;
    }

    public function isLatest(): bool
    {
        return $this->id === self::where('is_published', true)
            ->orderByDesc('release_date')
            ->orderByDesc('id')
            ->value('id');
    }
}
