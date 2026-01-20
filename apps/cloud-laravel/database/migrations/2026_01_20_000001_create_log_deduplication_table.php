<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('log_deduplication')) {
            Schema::create('log_deduplication', function (Blueprint $table) {
                $table->id();
                $table->string('log_key', 255)->unique();
                $table->timestamp('logged_at')->useCurrent();
                $table->timestamp('expires_at')->index();
                $table->timestamps();
                
                // Index for cleanup queries
                $table->index('expires_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('log_deduplication');
    }
};
