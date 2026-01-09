<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure platform_contents table exists and has deleted_at column
        if (!Schema::hasTable('platform_contents')) {
            Schema::create('platform_contents', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->string('section')->nullable();
                $table->boolean('published')->default(false);
                $table->timestamps();
                $table->softDeletes();
            });
        } else {
            // If table exists, ensure it has all required columns
            Schema::table('platform_contents', function (Blueprint $table) {
                if (!Schema::hasColumn('platform_contents', 'deleted_at')) {
                    $table->softDeletes();
                }
                if (!Schema::hasColumn('platform_contents', 'key')) {
                    $table->string('key')->unique()->after('id');
                }
                if (!Schema::hasColumn('platform_contents', 'published')) {
                    $table->boolean('published')->default(false)->after('section');
                }
            });
        }
    }

    public function down(): void
    {
        // Don't drop columns in down() to avoid data loss
    }
};

