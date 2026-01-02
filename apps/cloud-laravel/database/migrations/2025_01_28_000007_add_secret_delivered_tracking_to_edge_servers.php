<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds tracking for edge_secret delivery to ensure it's only returned once.
     * This prevents secret exposure in subsequent heartbeat responses.
     */
    public function up(): void
    {
        if (Schema::hasTable('edge_servers')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                if (!Schema::hasColumn('edge_servers', 'secret_delivered_at')) {
                    $table->timestamp('secret_delivered_at')->nullable()->after('edge_secret');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('edge_servers')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                if (Schema::hasColumn('edge_servers', 'secret_delivered_at')) {
                    $table->dropColumn('secret_delivered_at');
                }
            });
        }
    }
};
