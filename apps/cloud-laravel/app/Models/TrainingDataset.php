<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TrainingDataset model represents a collection of samples used for training AI models.
 *
 * This model is intentionally minimal and uses soft deletes via the shared BaseModel.
 */
class TrainingDataset extends BaseModel
{
    protected $table = 'training_datasets';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'ai_module',
        'label_schema',
        'sample_count',
        'labeled_count',
        'verified_count',
        'environment',
        'version',
        'status',
        'created_by',
        'updated_by',
    ];

    /**
     * Cast attributes to native types.
     *
     * @var array<string,string>
     */
    protected $casts = [
        'label_schema'   => 'array',
        'sample_count'   => 'integer',
        'labeled_count'  => 'integer',
        'verified_count' => 'integer',
    ];

    /**
     * Get the organization that owns the dataset.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the user that created the dataset.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user that last updated the dataset.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
