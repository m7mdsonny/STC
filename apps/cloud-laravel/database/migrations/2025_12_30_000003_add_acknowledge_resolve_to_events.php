<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                // Add acknowledge/resolve columns (used in AlertController and DashboardController)
                if (!Schema::hasColumn('events', 'acknowledged_at')) {
                    $table->timestamp('acknowledged_at')->nullable()->after('meta');
                }
                if (!Schema::hasColumn('events', 'resolved_at')) {
                    $table->timestamp('resolved_at')->nullable()->after('acknowledged_at');
                }
                
                // Add title and description (used in AlertController and seeder)
                if (!Schema::hasColumn('events', 'title')) {
                    $table->string('title')->nullable()->after('severity');
                }
                if (!Schema::hasColumn('events', 'description')) {
                    $table->text('description')->nullable()->after('title');
                }
                
                // Add camera_id (used in AlertController and seeder)
                // Note: camera_id is also in meta JSON, but seeder and controller use it as column
                if (!Schema::hasColumn('events', 'camera_id')) {
                    $table->string('camera_id')->nullable()->after('edge_id');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                if (Schema::hasColumn('events', 'camera_id')) {
                    $table->dropColumn('camera_id');
                }
                if (Schema::hasColumn('events', 'description')) {
                    $table->dropColumn('description');
                }
                if (Schema::hasColumn('events', 'title')) {
                    $table->dropColumn('title');
                }
                if (Schema::hasColumn('events', 'resolved_at')) {
                    $table->dropColumn('resolved_at');
                }
                if (Schema::hasColumn('events', 'acknowledged_at')) {
                    $table->dropColumn('acknowledged_at');
                }
            });
        }
    }
};
