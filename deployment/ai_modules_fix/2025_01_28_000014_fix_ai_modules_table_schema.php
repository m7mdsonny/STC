<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Fixes ai_modules table to match the model requirements:
     * - Add deleted_at for SoftDeletes
     * - Ensure all columns used by model exist
     */
    public function up(): void
    {
        if (Schema::hasTable('ai_modules')) {
            Schema::table('ai_modules', function (Blueprint $table) {
                // Add deleted_at for SoftDeletes trait
                if (!Schema::hasColumn('ai_modules', 'deleted_at')) {
                    $table->timestamp('deleted_at')->nullable()->after('updated_at');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('ai_modules')) {
            Schema::table('ai_modules', function (Blueprint $table) {
                if (Schema::hasColumn('ai_modules', 'deleted_at')) {
                    $table->dropColumn('deleted_at');
                }
            });
        }
    }
};
