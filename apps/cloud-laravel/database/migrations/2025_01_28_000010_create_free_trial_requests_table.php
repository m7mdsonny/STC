<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates free_trial_requests table for sales & onboarding pipeline
     */
    public function up(): void
    {
        if (!Schema::hasTable('free_trial_requests')) {
            Schema::create('free_trial_requests', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->string('company_name')->nullable();
                $table->string('job_title')->nullable();
                $table->text('message')->nullable();
                $table->json('selected_modules')->nullable(); // Array of selected AI modules
                $table->enum('status', [
                    'new',
                    'contacted',
                    'demo_scheduled',
                    'demo_completed',
                    'converted',
                    'rejected'
                ])->default('new');
                $table->text('admin_notes')->nullable();
                $table->foreignId('assigned_admin_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('converted_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
                $table->timestamp('contacted_at')->nullable();
                $table->timestamp('demo_scheduled_at')->nullable();
                $table->timestamp('demo_completed_at')->nullable();
                $table->timestamp('converted_at')->nullable();
                $table->timestamps();
                $table->softDeletes();
                
                // Indexes for performance
                $table->index('status');
                $table->index('email');
                $table->index('created_at');
                $table->index('assigned_admin_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('free_trial_requests');
    }
};
