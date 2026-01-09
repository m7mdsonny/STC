<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates tables for Enterprise Monitoring Modules (Market & Factory):
     * - ai_scenarios: Scenario definitions per organization
     * - ai_scenario_rules: Rules and weights for each scenario
     * - ai_camera_bindings: Camera-to-scenario bindings
     * - ai_alert_policies: Notification policies per risk level
     */
    public function up(): void
    {
        // 1. AI Scenarios Table
        if (!Schema::hasTable('ai_scenarios')) {
            Schema::create('ai_scenarios', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->string('module'); // 'market' or 'factory'
                $table->string('scenario_type'); // e.g., 'object_pick_not_returned', 'ppe_missing'
                $table->string('name'); // Human-readable name
                $table->text('description')->nullable();
                $table->boolean('enabled')->default(true);
                $table->integer('severity_threshold')->default(70); // Risk score threshold (0-100)
                $table->json('config')->nullable(); // Additional scenario-specific config
                $table->timestamps();
                $table->softDeletes();
                
                // Indexes for performance
                $table->index(['organization_id', 'module']);
                $table->index(['organization_id', 'enabled']);
                $table->unique(['organization_id', 'module', 'scenario_type']);
            });
        }

        // 2. AI Scenario Rules Table
        if (!Schema::hasTable('ai_scenario_rules')) {
            Schema::create('ai_scenario_rules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('scenario_id')->constrained('ai_scenarios')->cascadeOnDelete();
                $table->string('rule_type'); // e.g., 'duration', 'location', 'pattern'
                $table->json('rule_value'); // Rule parameters (flexible JSON)
                $table->integer('weight')->default(10); // Weight for risk calculation (0-100)
                $table->boolean('enabled')->default(true);
                $table->integer('order')->default(0); // Rule evaluation order
                $table->timestamps();
                
                // Indexes
                $table->index(['scenario_id', 'enabled']);
                $table->index(['scenario_id', 'order']);
            });
        }

        // 3. AI Camera Bindings Table
        if (!Schema::hasTable('ai_camera_bindings')) {
            Schema::create('ai_camera_bindings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('camera_id')->constrained('cameras')->cascadeOnDelete();
                $table->foreignId('scenario_id')->constrained('ai_scenarios')->cascadeOnDelete();
                $table->boolean('enabled')->default(true);
                $table->json('camera_specific_config')->nullable(); // Camera-specific overrides
                $table->timestamps();
                
                // Indexes
                $table->unique(['camera_id', 'scenario_id']);
                $table->index(['camera_id', 'enabled']);
                $table->index(['scenario_id', 'enabled']);
            });
        }

        // 4. AI Alert Policies Table
        if (!Schema::hasTable('ai_alert_policies')) {
            Schema::create('ai_alert_policies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->string('risk_level'); // 'medium', 'high', 'critical'
                $table->boolean('notify_web')->default(true);
                $table->boolean('notify_mobile')->default(true);
                $table->boolean('notify_email')->default(false);
                $table->boolean('notify_sms')->default(false);
                $table->integer('cooldown_minutes')->default(15); // Minutes between same-type alerts
                $table->json('notification_channels')->nullable(); // Additional channel config
                $table->timestamps();
                
                // Indexes
                $table->unique(['organization_id', 'risk_level']);
                $table->index(['organization_id', 'risk_level']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_alert_policies');
        Schema::dropIfExists('ai_camera_bindings');
        Schema::dropIfExists('ai_scenario_rules');
        Schema::dropIfExists('ai_scenarios');
    }
};
