<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('ai_modules')) {
            Schema::create('ai_modules', function (Blueprint $table) {
            $table->id();
            $table->string('module_key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->default('security');
            $table->boolean('is_enabled')->default(true);
            $table->boolean('is_premium')->default(false);
            $table->integer('min_plan_level')->default(1); // 1=Basic, 2=Professional, 3=Enterprise
            $table->json('config_schema')->nullable();
            $table->json('default_config')->nullable();
            $table->string('required_camera_type')->nullable();
            $table->integer('min_fps')->default(15);
            $table->string('min_resolution')->default('720p');
            $table->string('icon')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('ai_module_configs')) {
            Schema::create('ai_module_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
            $table->foreignId('module_id')->constrained('ai_modules')->onDelete('cascade');
            $table->boolean('is_enabled')->default(false);
            $table->boolean('is_licensed')->default(false);
            $table->json('config')->nullable();
            $table->decimal('confidence_threshold', 3, 2)->default(0.80);
            $table->integer('alert_threshold')->default(3);
            $table->integer('cooldown_seconds')->default(30);
            $table->boolean('schedule_enabled')->default(false);
            $table->json('schedule')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'module_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_module_configs');
        Schema::dropIfExists('ai_modules');
    }
};

