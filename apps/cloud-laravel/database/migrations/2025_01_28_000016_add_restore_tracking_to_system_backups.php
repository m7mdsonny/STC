<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds restore tracking columns to system_backups table
     */
    public function up(): void
    {
        if (Schema::hasTable('system_backups')) {
            Schema::table('system_backups', function (Blueprint $table) {
                // Add restored_at timestamp
                if (!Schema::hasColumn('system_backups', 'restored_at')) {
                    $table->timestamp('restored_at')->nullable()->after('status');
                }
                
                // Add restored_by user reference
                if (!Schema::hasColumn('system_backups', 'restored_by')) {
                    $table->foreignId('restored_by')->nullable()->after('restored_at')->constrained('users')->nullOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('system_backups')) {
            Schema::table('system_backups', function (Blueprint $table) {
                if (Schema::hasColumn('system_backups', 'restored_by')) {
                    $table->dropForeign(['restored_by']);
                    $table->dropColumn('restored_by');
                }
                if (Schema::hasColumn('system_backups', 'restored_at')) {
                    $table->dropColumn('restored_at');
                }
            });
        }
    }
};
