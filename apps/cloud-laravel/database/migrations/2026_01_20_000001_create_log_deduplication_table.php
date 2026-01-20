<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('log_deduplication')) {
            Schema::create('log_deduplication', function (Blueprint $table) {
                $table->id();
                $table->string('log_key', 255)->unique();
                $table->timestamp('logged_at')->useCurrent();
                $table->timestamp('expires_at');
                $table->timestamps();
                
                // Index for cleanup queries (only once)
                $table->index('expires_at', 'idx_log_deduplication_expires_at');
            });
        } else {
            // Table exists - check if index exists
            Schema::table('log_deduplication', function (Blueprint $table) {
                if (!Schema::hasColumn('log_deduplication', 'expires_at')) {
                    $table->timestamp('expires_at')->after('logged_at');
                    $table->index('expires_at', 'idx_log_deduplication_expires_at');
                } elseif (!$this->indexExists('log_deduplication', 'idx_log_deduplication_expires_at')) {
                    // Only add index if it doesn't exist
                    $table->index('expires_at', 'idx_log_deduplication_expires_at');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('log_deduplication');
    }

    /**
     * Check if index exists on table
     */
    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $databaseName = $connection->getDatabaseName();
        
        $result = $connection->selectOne(
            "SELECT COUNT(*) as count 
             FROM information_schema.statistics 
             WHERE table_schema = ? 
             AND table_name = ? 
             AND index_name = ?",
            [$databaseName, $table, $index]
        );
        
        return ($result->count ?? 0) > 0;
    }
};
