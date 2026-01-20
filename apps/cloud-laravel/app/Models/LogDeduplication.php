<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class LogDeduplication extends Model
{
    protected $table = 'log_deduplication';
    
    public $timestamps = false;
    
    protected $fillable = [
        'log_key',
        'logged_at',
        'expires_at',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Check if log should be written (not logged recently)
     * Returns true if log should be written, false if duplicate
     */
    public static function shouldLog(string $logKey, int $minutesTtl = 60): bool
    {
        // Clean up expired records first (to prevent table bloat)
        static::cleanup();
        
        // Try to insert - if duplicate key, log was already written
        try {
            static::create([
                'log_key' => $logKey,
                'logged_at' => now(),
                'expires_at' => now()->addMinutes($minutesTtl),
            ]);
            
            // Insert successful - this is the first log in this window
            return true;
        } catch (\Illuminate\Database\QueryException $e) {
            // Duplicate key error (1062) means log was already written
            if ($e->getCode() === 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return false; // Duplicate - don't log
            }
            
            // Other database error - log it (but still allow logging to proceed)
            \Log::warning('Log deduplication database error', [
                'error' => $e->getMessage(),
                'log_key' => $logKey,
            ]);
            
            return true; // Allow logging on database error (better than missing logs)
        }
    }

    /**
     * Clean up expired records
     */
    public static function cleanup(): void
    {
        try {
            static::where('expires_at', '<', now())->delete();
        } catch (\Exception $e) {
            // Silently fail cleanup (not critical)
        }
    }
}
