<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_contents', function (Blueprint $table) {
            if (!Schema::hasColumn('platform_contents', 'published')) {
                $table->boolean('published')->default(false)->after('section');
            }
        });
    }

    public function down(): void
    {
        Schema::table('platform_contents', function (Blueprint $table) {
            if (Schema::hasColumn('platform_contents', 'published')) {
                $table->dropColumn('published');
            }
        });
    }
};
