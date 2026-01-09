<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('registered_faces')) {
            Schema::create('registered_faces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('person_name');
            $table->string('employee_id')->nullable();
            $table->string('department')->nullable();
            $table->enum('category', ['employee', 'vip', 'visitor', 'blacklist'])->default('employee');
            $table->string('photo_url')->nullable();
            $table->text('face_encoding')->nullable(); // Base64 encoded face embedding
            $table->json('face_metadata')->nullable(); // Additional face recognition data
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_seen_at')->nullable();
            $table->integer('recognition_count')->default(0);
            $table->json('meta')->nullable(); // Additional metadata
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('organization_id');
            $table->index('category');
            $table->index('department');
            $table->index('is_active');
            $table->index('employee_id');
            $table->index('last_seen_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('registered_faces');
    }
};

