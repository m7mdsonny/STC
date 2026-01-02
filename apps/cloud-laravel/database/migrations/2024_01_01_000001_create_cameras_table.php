<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('cameras')) {
            Schema::create('cameras', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->foreignId('edge_server_id')->nullable()->constrained('edge_servers')->nullOnDelete();
                $table->string('camera_id')->unique();
                $table->string('name');
                $table->string('location')->nullable();
                $table->string('rtsp_url', 500)->nullable();
                $table->string('status')->default('offline');
                $table->json('config')->nullable();
                $table->timestamps();
                $table->softDeletes();
                
                // Indexes
                $table->index('organization_id');
                $table->index('edge_server_id');
                $table->index('camera_id');
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cameras');
    }
};

