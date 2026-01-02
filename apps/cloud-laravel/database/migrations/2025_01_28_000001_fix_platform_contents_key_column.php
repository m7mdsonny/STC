<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Check if platform_contents table exists
        if (!Schema::hasTable('platform_contents')) {
            return;
        }

        // Add key column if it doesn't exist
        if (!Schema::hasColumn('platform_contents', 'key')) {
            Schema::table('platform_contents', function (Blueprint $table) {
                $table->string('key')->unique()->nullable()->after('id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('platform_contents', 'key')) {
            Schema::table('platform_contents', function (Blueprint $table) {
                $table->dropColumn('key');
            });
        }
    }
};

