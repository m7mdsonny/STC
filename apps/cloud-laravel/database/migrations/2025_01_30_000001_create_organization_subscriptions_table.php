<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('organization_subscriptions')) {
            Schema::create('organization_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->restrictOnDelete();
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->string('status')->default('active'); // active, cancelled, expired
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                // Index for efficient queries
                $table->index(['organization_id', 'status']);
                $table->index(['subscription_plan_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_subscriptions');
    }
};
