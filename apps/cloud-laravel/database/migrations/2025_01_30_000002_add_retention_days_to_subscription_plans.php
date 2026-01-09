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
        if (Schema::hasTable('subscription_plans')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                if (!Schema::hasColumn('subscription_plans', 'retention_days')) {
                    $table->unsignedInteger('retention_days')->default(30)->after('sms_quota');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('subscription_plans')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                if (Schema::hasColumn('subscription_plans', 'retention_days')) {
                    $table->dropColumn('retention_days');
                }
            });
        }
    }
};
