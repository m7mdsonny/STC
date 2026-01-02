<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create notification_priorities table if it doesn't exist
        if (!Schema::hasTable('notification_priorities')) {
            Schema::create('notification_priorities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
                $table->string('notification_type');
                $table->string('priority')->default('medium');
                $table->boolean('is_critical')->default(false);
                $table->timestamps();
                $table->softDeletes();
            });
        } else {
            // If table exists, ensure it has all required columns
            Schema::table('notification_priorities', function (Blueprint $table) {
                if (!Schema::hasColumn('notification_priorities', 'deleted_at')) {
                    $table->softDeletes();
                }
                if (!Schema::hasColumn('notification_priorities', 'organization_id')) {
                    $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->nullOnDelete();
                }
                if (!Schema::hasColumn('notification_priorities', 'notification_type')) {
                    $table->string('notification_type')->after('organization_id');
                }
                if (!Schema::hasColumn('notification_priorities', 'priority')) {
                    $table->string('priority')->default('medium')->after('notification_type');
                }
                if (!Schema::hasColumn('notification_priorities', 'is_critical')) {
                    $table->boolean('is_critical')->default(false)->after('priority');
                }
            });
        }
    }

    public function down(): void
    {
        // Don't drop the table in down() to avoid data loss
        // If you need to rollback, do it manually
    }
};

