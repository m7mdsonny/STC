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
        if (Schema::hasTable('edge_servers') && Schema::hasColumn('edge_servers', 'edge_secret')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                // Change edge_secret to TEXT to accommodate encrypted strings
                $table->text('edge_secret')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('edge_servers') && Schema::hasColumn('edge_servers', 'edge_secret')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                // Revert to string (255 chars) - may truncate data
                $table->string('edge_secret')->nullable()->change();
            });
        }
    }
};
