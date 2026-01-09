<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates edge_nonces table for HMAC replay attack protection
     */
    public function up(): void
    {
        if (!Schema::hasTable('edge_nonces')) {
            Schema::create('edge_nonces', function (Blueprint $table) {
                $table->id();
                $table->string('nonce', 64)->unique();
                $table->foreignId('edge_server_id')->nullable()->constrained('edge_servers')->nullOnDelete();
                $table->string('ip_address')->nullable();
                $table->timestamp('used_at');
                $table->timestamps();
                
                // Indexes
                $table->index('nonce');
                $table->index(['edge_server_id', 'used_at']);
                $table->index('used_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('edge_nonces');
    }
};
