<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds analytics-friendly columns to events table for better querying:
     * - ai_module: Direct column for AI module name (extracted from meta->module)
     * - risk_score: Numeric risk score for risk-based analytics
     * 
     * These columns are nullable to maintain backward compatibility.
     * Existing events will have NULL values, new events will populate these fields.
     */
    public function up(): void
    {
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                // Add ai_module column (extracted from meta->module for faster queries)
                if (!Schema::hasColumn('events', 'ai_module')) {
                    $table->string('ai_module')->nullable()->after('event_type');
                    $table->index('ai_module');
                }
                
                // Add risk_score column (numeric for analytics)
                if (!Schema::hasColumn('events', 'risk_score')) {
                    $table->integer('risk_score')->nullable()->after('severity');
                    $table->index('risk_score');
                }
                
                // Add index on camera_id for camera-based analytics
                if (Schema::hasColumn('events', 'camera_id')) {
                    if (!Schema::hasIndex('events', 'events_camera_id_index')) {
                        $table->index('camera_id');
                    }
                }
                
                // Add composite index for common analytics queries
                if (!Schema::hasIndex('events', 'events_org_module_date_index')) {
                    $table->index(['organization_id', 'ai_module', 'occurred_at'], 'events_org_module_date_index');
                }
            });
            
            // Populate ai_module from meta->module for existing events
            \DB::statement("
                UPDATE events 
                SET ai_module = JSON_UNQUOTE(JSON_EXTRACT(meta, '$.module'))
                WHERE ai_module IS NULL 
                AND meta IS NOT NULL 
                AND JSON_EXTRACT(meta, '$.module') IS NOT NULL
            ");
            
            // Populate risk_score from meta->risk_score for existing events
            \DB::statement("
                UPDATE events 
                SET risk_score = CAST(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.risk_score')) AS UNSIGNED)
                WHERE risk_score IS NULL 
                AND meta IS NOT NULL 
                AND JSON_EXTRACT(meta, '$.risk_score') IS NOT NULL
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                if (Schema::hasIndex('events', 'events_org_module_date_index')) {
                    $table->dropIndex('events_org_module_date_index');
                }
                if (Schema::hasColumn('events', 'risk_score')) {
                    $table->dropIndex(['risk_score']);
                    $table->dropColumn('risk_score');
                }
                if (Schema::hasColumn('events', 'ai_module')) {
                    $table->dropIndex(['ai_module']);
                    $table->dropColumn('ai_module');
                }
            });
        }
    }
};
