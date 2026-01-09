<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ai_commands')) {
            Schema::create('ai_commands', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
                $table->string('title');
                $table->string('status')->default('queued');
                $table->json('payload')->nullable();
                $table->timestamp('acknowledged_at')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('ai_command_targets')) {
            Schema::create('ai_command_targets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ai_command_id')->constrained('ai_commands')->cascadeOnDelete();
                $table->string('target_type')->default('org');
                $table->string('target_id')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('ai_command_logs')) {
            Schema::create('ai_command_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('ai_command_id')->constrained('ai_commands')->cascadeOnDelete();
                $table->string('status')->default('queued');
                $table->text('message')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_command_logs');
        Schema::dropIfExists('ai_command_targets');
        Schema::dropIfExists('ai_commands');
    }
};
