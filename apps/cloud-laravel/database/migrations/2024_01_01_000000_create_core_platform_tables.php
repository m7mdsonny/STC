<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('distributors')) {
            Schema::create('distributors', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('contact_email')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('resellers')) {
            Schema::create('resellers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('company_name')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('SA');
            $table->decimal('commission_rate', 5, 2)->default(0);
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->decimal('credit_limit', 12, 2)->default(0);
            $table->string('contact_person')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('organizations')) {
            Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('distributor_id')->nullable()->constrained('distributors')->nullOnDelete();
            $table->foreignId('reseller_id')->nullable()->constrained('resellers')->nullOnDelete();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('subscription_plan')->default('basic');
            $table->unsignedInteger('max_cameras')->default(4);
            $table->unsignedInteger('max_edge_servers')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('subscription_plans')) {
            Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_ar');
            $table->unsignedInteger('max_cameras')->default(4);
            $table->unsignedInteger('max_edge_servers')->default(1);
            $table->json('available_modules')->nullable();
            $table->json('notification_channels')->nullable();
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            });
        }

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
        }

        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->string('role')->default('org_admin');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('subscription_plan_limits')) {
            Schema::create('subscription_plan_limits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->string('key');
            $table->integer('value');
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('licenses')) {
            Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->string('plan')->default('basic');
            $table->string('license_key')->unique();
            $table->string('status')->default('active');
            $table->string('edge_server_id')->nullable();
            $table->unsignedInteger('max_cameras')->default(4);
            $table->json('modules')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('edge_servers')) {
            Schema::create('edge_servers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('license_id')->nullable()->constrained('licenses')->nullOnDelete();
            $table->string('edge_id')->unique();
            $table->string('name')->nullable();
            $table->string('hardware_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('version')->nullable();
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('online')->default(false);
            $table->timestamp('last_seen_at')->nullable();
            $table->json('system_info')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('edge_server_id')->nullable()->constrained('edge_servers')->nullOnDelete();
            $table->string('edge_id');
            $table->string('event_type');
            $table->string('severity');
            $table->timestamp('occurred_at');
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('edge_server_logs')) {
            Schema::create('edge_server_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('edge_server_id')->constrained('edge_servers')->cascadeOnDelete();
            $table->string('level')->default('info');
            $table->text('message');
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('edge_server_id')->nullable()->constrained('edge_servers')->nullOnDelete();
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('priority')->default('medium');
            $table->string('channel')->default('push');
            $table->string('status')->default('new');
            $table->json('meta')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

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

        if (!Schema::hasTable('sms_quotas')) {
            Schema::create('sms_quotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->unsignedInteger('monthly_limit');
            $table->unsignedInteger('used_this_month')->default(0);
            $table->timestamp('resets_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('platform_name')->default('STC AI-VAP');
            $table->string('platform_tagline')->nullable();
            $table->string('support_email')->nullable();
            $table->string('support_phone')->nullable();
            $table->string('default_timezone')->default('UTC');
            $table->string('default_language')->default('ar');
            $table->boolean('maintenance_mode')->default(false);
            $table->text('maintenance_message')->nullable();
            $table->unsignedInteger('session_timeout_minutes')->default(60);
            $table->unsignedInteger('max_login_attempts')->default(5);
            $table->unsignedInteger('password_min_length')->default(8);
            $table->boolean('require_2fa')->default(false);
            $table->boolean('allow_registration')->default(true);
            $table->boolean('require_email_verification')->default(false);
            $table->json('email_settings')->nullable();
            $table->json('sms_settings')->nullable();
            $table->json('fcm_settings')->nullable();
            $table->json('storage_settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('platform_contents')) {
            Schema::create('platform_contents', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('section')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('system_backups')) {
            Schema::create('system_backups', function (Blueprint $table) {
                $table->id();
                $table->string('file_path');
                $table->string('status')->default('pending');
                $table->json('meta')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('analytics_reports')) {
            Schema::create('analytics_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('name');
            $table->string('report_type')->default('event_summary');
            $table->json('parameters')->nullable();
            $table->json('filters')->nullable();
            $table->string('format')->default('json');
            $table->string('file_url')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->boolean('is_scheduled')->default(false);
            $table->string('schedule_cron')->nullable();
            $table->timestamp('last_generated_at')->nullable();
            $table->timestamp('next_scheduled_at')->nullable();
            $table->json('recipients')->nullable();
            $table->string('status')->default('draft');
            $table->text('error_message')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('analytics_dashboards')) {
            Schema::create('analytics_dashboards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false);
            $table->json('layout')->nullable();
            $table->boolean('is_public')->default(false);
            $table->json('shared_with')->nullable();
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('analytics_widgets')) {
            Schema::create('analytics_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dashboard_id')->constrained('analytics_dashboards')->cascadeOnDelete();
            $table->string('name');
            $table->string('widget_type');
            $table->json('config')->nullable();
            $table->string('data_source')->nullable();
            $table->json('filters')->nullable();
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->integer('width')->default(4);
            $table->integer('height')->default(3);
            $table->timestamps();
            $table->softDeletes();
            });
        }

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

        if (!Schema::hasTable('ai_policy_events')) {
            Schema::create('ai_policy_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_policy_id')->constrained('ai_policies')->cascadeOnDelete();
            $table->string('event_type');
            $table->string('label')->nullable();
            $table->json('payload')->nullable();
            $table->decimal('weight', 8, 2)->default(1.0);
            $table->timestamps();
            $table->softDeletes();
            });
        }

        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('system_backups');
        Schema::dropIfExists('platform_contents');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('sms_quotas');
        Schema::dropIfExists('notification_priorities');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('ai_policy_events');
        Schema::dropIfExists('ai_policies');
        Schema::dropIfExists('analytics_widgets');
        Schema::dropIfExists('analytics_dashboards');
        Schema::dropIfExists('analytics_reports');
        Schema::dropIfExists('edge_server_logs');
        Schema::dropIfExists('events');
        Schema::dropIfExists('edge_servers');
        Schema::dropIfExists('licenses');
        Schema::dropIfExists('subscription_plan_limits');
        Schema::dropIfExists('users');
        Schema::dropIfExists('organizations_branding');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('organizations');
        Schema::dropIfExists('resellers');
        Schema::dropIfExists('distributors');
    }
};
