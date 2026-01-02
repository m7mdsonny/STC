<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('registered_vehicles')) {
            Schema::create('registered_vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('plate_number');
            $table->string('plate_ar')->nullable(); // Arabic plate number
            $table->string('owner_name')->nullable();
            $table->string('vehicle_type')->nullable(); // car, truck, motorcycle, etc.
            $table->string('vehicle_color')->nullable();
            $table->string('vehicle_make')->nullable(); // brand
            $table->string('vehicle_model')->nullable();
            $table->enum('category', ['employee', 'vip', 'visitor', 'delivery', 'blacklist'])->default('employee');
            $table->string('photo_url')->nullable(); // Vehicle photo
            $table->text('plate_encoding')->nullable(); // OCR/ML encoding for plate recognition
            $table->json('vehicle_metadata')->nullable(); // Additional vehicle recognition data
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
            $table->index('is_active');
            $table->index('plate_number');
            $table->index('plate_ar');
            $table->index('last_seen_at');
            $table->unique(['organization_id', 'plate_number']); // Unique plate per organization
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('registered_vehicles');
    }
};

