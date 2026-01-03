<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Fixes ai_modules table to match actual database schema:
     * - Remove module_key if exists (not in actual table)
     * - Rename is_enabled to is_active if needed
     * - Add display_name and display_name_ar if missing
     * - Add deleted_at for SoftDeletes
     */
    public function up(): void
    {
        if (Schema::hasTable('ai_modules')) {
            Schema::table('ai_modules', function (Blueprint $table) {
                // Add deleted_at for SoftDeletes trait
                if (!Schema::hasColumn('ai_modules', 'deleted_at')) {
                    $table->timestamp('deleted_at')->nullable()->after('updated_at');
                }
                
                // Add display_name if missing
                if (!Schema::hasColumn('ai_modules', 'display_name')) {
                    $table->string('display_name', 255)->after('name');
                }
                
                // Add display_name_ar if missing
                if (!Schema::hasColumn('ai_modules', 'display_name_ar')) {
                    $table->string('display_name_ar', 255)->nullable()->after('display_name');
                }
                
                // Add description_ar if missing
                if (!Schema::hasColumn('ai_modules', 'description_ar')) {
                    $table->text('description_ar')->nullable()->after('description');
                }
                
                // Rename is_enabled to is_active if is_enabled exists
                if (Schema::hasColumn('ai_modules', 'is_enabled') && !Schema::hasColumn('ai_modules', 'is_active')) {
                    $table->renameColumn('is_enabled', 'is_active');
                }
            });
            
            // Remove module_key column if it exists (not in actual schema)
            if (Schema::hasColumn('ai_modules', 'module_key')) {
                Schema::table('ai_modules', function (Blueprint $table) {
                    $table->dropColumn('module_key');
                });
            }
            
            // Remove columns that don't exist in actual schema
            $columnsToRemove = ['category', 'is_premium', 'min_plan_level'];
            foreach ($columnsToRemove as $column) {
                if (Schema::hasColumn('ai_modules', $column)) {
                    Schema::table('ai_modules', function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    });
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration is designed to align with actual schema
        // Rollback may not be needed, but included for completeness
        if (Schema::hasTable('ai_modules')) {
            Schema::table('ai_modules', function (Blueprint $table) {
                if (Schema::hasColumn('ai_modules', 'deleted_at')) {
                    $table->dropColumn('deleted_at');
                }
            });
        }
    }
};
