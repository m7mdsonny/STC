<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('vehicle_access_logs')) {
            Schema::create('vehicle_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained('registered_vehicles')->cascadeOnDelete();
            
            // Create camera_id column first
            $table->unsignedBigInteger('camera_id')->nullable();
            $table->string('plate_number'); // Snapshot at time of recognition
            $table->string('plate_ar')->nullable();
            $table->enum('direction', ['in', 'out'])->nullable();
            $table->boolean('access_granted')->default(false);
            $table->string('access_reason')->nullable(); // Why access was granted/denied
            $table->decimal('confidence_score', 5, 2)->nullable(); // Recognition confidence (0-100)
            $table->string('photo_url')->nullable(); // Snapshot of the vehicle
            $table->json('recognition_metadata')->nullable(); // Full recognition data
            $table->timestamp('recognized_at');
            $table->json('meta')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('organization_id');
            $table->index('vehicle_id');
            $table->index('camera_id');
            $table->index('recognized_at');
            $table->index('access_granted');
            $table->index('direction');
            $table->index(['organization_id', 'recognized_at']);
            });
            
            // Add foreign key constraint only if cameras table exists
            if (Schema::hasTable('cameras')) {
                Schema::table('vehicle_access_logs', function (Blueprint $table) {
                    $table->foreign('camera_id')
                        ->references('id')
                        ->on('cameras')
                        ->onDelete('set null');
                });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_access_logs');
    }
};

