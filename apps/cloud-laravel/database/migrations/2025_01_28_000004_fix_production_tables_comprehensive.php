<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Comprehensive fix for all production database issues
     */
    public function up(): void
    {
        // 1. Fix organizations_branding table
        if (!Schema::hasTable('organizations_branding')) {
            Schema::create('organizations_branding', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->cascadeOnDelete();
                $table->string('logo_url')->nullable();
                $table->string('logo_dark_url')->nullable();
                $table->string('favicon_url')->nullable();
                $table->string('primary_color')->default('#DCA000');
                $table->string('secondary_color')->default('#1E1E6E');
                $table->string('accent_color')->default('#10B981');
                $table->string('danger_color')->default('#EF4444');
                $table->string('warning_color')->default('#F59E0B');
                $table->string('success_color')->default('#22C55E');
                $table->string('font_family')->default('Inter');
                $table->string('heading_font')->default('Cairo');
                $table->string('border_radius')->default('8px');
                $table->text('custom_css')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        } else {
            // Ensure deleted_at exists if table exists
            Schema::table('organizations_branding', function (Blueprint $table) {
                if (!Schema::hasColumn('organizations_branding', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // 2. Fix ai_policies table
        if (!Schema::hasTable('ai_policies')) {
            Schema::create('ai_policies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
                $table->string('name');
                $table->boolean('is_enabled')->default(true);
                $table->json('modules')->nullable();
                $table->json('thresholds')->nullable();
                $table->json('actions')->nullable();
                $table->json('feature_flags')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 3. Fix system_backups table
        if (!Schema::hasTable('system_backups')) {
            Schema::create('system_backups', function (Blueprint $table) {
                $table->id();
                $table->string('file_path');
                $table->string('status')->default('pending');
                $table->json('meta')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 4. Ensure events table has meta column (not metadata)
        if (Schema::hasTable('events')) {
            Schema::table('events', function (Blueprint $table) {
                // Check if meta column exists, if not add it
                if (!Schema::hasColumn('events', 'meta')) {
                    $table->json('meta')->nullable()->after('severity');
                }
                // If metadata column exists (wrong name), we should note it but not drop it automatically
                // The code now uses 'meta', so queries will work once meta exists
            });
        }

        // 5. Ensure platform_contents has deleted_at (already handled in previous migration, but double-check)
        if (Schema::hasTable('platform_contents')) {
            Schema::table('platform_contents', function (Blueprint $table) {
                if (!Schema::hasColumn('platform_contents', 'deleted_at')) {
                    $table->softDeletes();
                }
                if (!Schema::hasColumn('platform_contents', 'key')) {
                    $table->string('key')->unique()->nullable()->after('id');
                }
                if (!Schema::hasColumn('platform_contents', 'published')) {
                    $table->boolean('published')->default(true)->after('section');
                }
            });
        }

        // 6. Ensure notification_priorities table exists (already handled, but double-check)
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
        }
    }

    public function down(): void
    {
        // Don't drop tables in down() as they might be needed
        // Only remove columns we added
        if (Schema::hasTable('platform_contents')) {
            Schema::table('platform_contents', function (Blueprint $table) {
                if (Schema::hasColumn('platform_contents', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
    }
};

