<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LicenseController;
use App\Http\Controllers\EdgeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Controllers\BrandingController;
use App\Http\Controllers\PlatformContentController;
use App\Http\Controllers\NotificationPriorityController;
use App\Http\Controllers\SmsQuotaController;
use App\Http\Controllers\SystemBackupController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AiPolicyController;
use App\Http\Controllers\UpdateAnnouncementController;
use App\Http\Controllers\SystemUpdateController;
use App\Http\Controllers\PublicContentController;
use App\Http\Controllers\AiCommandController;
use App\Http\Controllers\AiModuleController;
use App\Http\Controllers\CameraController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\PlatformWordingController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\AutomationRuleController;
use App\Http\Controllers\MarketController;
use App\Http\Controllers\OrganizationSubscriptionController;

Route::prefix('v1')->group(function () {
    // Public endpoints (no authentication required)
    Route::get('/public/landing', [PublicContentController::class, 'landing']);
    Route::post('/public/contact', [PublicContentController::class, 'submitContact'])->middleware('throttle:10,1');
    Route::get('/public/updates', [UpdateAnnouncementController::class, 'publicIndex']);
    Route::get('/branding', [BrandingController::class, 'showPublic']);

    // Auth endpoints with throttling
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1'); // 5 attempts per minute
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:3,1'); // 3 attempts per minute
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    // Public licensing endpoint (rate-limited for security)
    Route::post(
        '/licensing/validate',
        [LicenseController::class, 'validateKey']
    )->middleware('throttle:10,1'); // Reduced from 100/min to 10/min for security

    // Heartbeat endpoint: public for first registration (generates edge_key/edge_secret)
    Route::post('/edges/heartbeat', [EdgeController::class, 'heartbeat'])->middleware('throttle:100,1');

    // Edge Server endpoints (HMAC-secured ONLY - NO public access)
    Route::middleware(['verify.edge.signature', 'throttle:100,1'])->group(function () {
        Route::post('/edges/events', [EventController::class, 'ingest']);
        Route::get('/edges/cameras', [EdgeController::class, 'getCamerasForEdge']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('/auth/password', [AuthController::class, 'changePassword']);
        
        // Subscription details (for clients - Mobile/Web)
        Route::get('/subscription', [OrganizationSubscriptionController::class, 'showCurrent']);
        
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/register-device', [NotificationController::class, 'registerDevice']);
        Route::post('/auth/register-fcm-token', [NotificationController::class, 'registerDevice']); // Alias for mobile app compatibility
        Route::delete('/notifications/unregister-device', [NotificationController::class, 'unregisterDevice']);
        Route::get('/notifications/devices', [NotificationController::class, 'getDevices']);
        Route::get('/notifications/settings', [NotificationController::class, 'getSettings']);
        Route::put('/notifications/settings/{id}', [NotificationController::class, 'updateSetting']);
        Route::get('/notifications/config', [NotificationController::class, 'getOrgConfig']);
        Route::put('/notifications/config', [NotificationController::class, 'updateOrgConfig']);
        Route::get('/notifications/alert-priorities', [NotificationController::class, 'getAlertPriorities']);
        Route::post('/notifications/alert-priorities', [NotificationController::class, 'createAlertPriority']);
        Route::put('/notifications/alert-priorities/{id}', [NotificationController::class, 'updateAlertPriority']);
        Route::delete('/notifications/alert-priorities/{id}', [NotificationController::class, 'deleteAlertPriority']);
        Route::get('/notifications/logs', [NotificationController::class, 'getLogs']);
        Route::post('/notifications/test', [NotificationController::class, 'sendTest']);
        Route::get('/notifications/quota', [NotificationController::class, 'getQuota']);

        Route::get('/dashboard/admin', [DashboardController::class, 'admin']);
        Route::get('/dashboard', [DashboardController::class, 'organization']);

        Route::get('/organizations', [OrganizationController::class, 'index']);
        Route::post('/organizations', [OrganizationController::class, 'store']);
        Route::get('/organizations/{organization}', [OrganizationController::class, 'show']);
        Route::put('/organizations/{organization}', [OrganizationController::class, 'update']);
        Route::delete('/organizations/{organization}', [OrganizationController::class, 'destroy']);
        Route::post('/organizations/{organization}/toggle-active', [OrganizationController::class, 'toggleActive']);
                Route::put('/organizations/{organization}/plan', [OrganizationController::class, 'updatePlan']);
                Route::get('/organizations/{organization}/stats', [OrganizationController::class, 'stats']);
                
                // Organization Subscriptions
                Route::get('/organizations/{organization}/subscription', [OrganizationSubscriptionController::class, 'show']);
                Route::post('/organizations/{organization}/subscription/assign', [OrganizationSubscriptionController::class, 'assign']);
                Route::get('/organizations/{organization}/subscriptions', [OrganizationSubscriptionController::class, 'index']);
                Route::post('/subscriptions/{organizationSubscription}/cancel', [OrganizationSubscriptionController::class, 'cancel']);
        Route::post('/organizations/{organization}/upload-logo', [OrganizationController::class, 'uploadLogo']);
        Route::post('/organizations/{organization}/sms-quota/consume', [SmsQuotaController::class, 'consume']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        // SECURITY FIX: reset-password endpoint deprecated - use Laravel password reset flow
        // Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::post('/users/{user}/toggle-active', [UserController::class, 'toggleActive'])->middleware('role:super_admin,admin');

        Route::get('/licenses', [LicenseController::class, 'index']);
        Route::post('/licenses', [LicenseController::class, 'store']);
        Route::get('/licenses/{license}', [LicenseController::class, 'show']);
        Route::put('/licenses/{license}', [LicenseController::class, 'update']);
        Route::delete('/licenses/{license}', [LicenseController::class, 'destroy']);
        Route::post('/licenses/{license}/activate', [LicenseController::class, 'activate']);
        Route::post('/licenses/{license}/suspend', [LicenseController::class, 'suspend']);
        Route::post('/licenses/{license}/renew', [LicenseController::class, 'renew']);
        Route::post('/licenses/{license}/regenerate-key', [LicenseController::class, 'regenerateKey']);

        Route::get('/subscription-plans', [SubscriptionPlanController::class, 'index']);
        Route::post('/subscription-plans', [SubscriptionPlanController::class, 'store']);
        Route::get('/subscription-plans/{subscriptionPlan}', [SubscriptionPlanController::class, 'show']);
        Route::put('/subscription-plans/{subscriptionPlan}', [SubscriptionPlanController::class, 'update']);
        Route::delete('/subscription-plans/{subscriptionPlan}', [SubscriptionPlanController::class, 'destroy']);

        Route::get('/edge-servers', [EdgeController::class, 'index']);
        Route::get('/edge-servers/stats', [EdgeController::class, 'stats']); // Mobile app endpoint
        Route::post('/edge-servers', [EdgeController::class, 'store'])->middleware('active.subscription');
        Route::get('/edge-servers/{edgeServer}', [EdgeController::class, 'show']);
        Route::put('/edge-servers/{edgeServer}', [EdgeController::class, 'update'])->middleware('active.subscription');
        Route::delete('/edge-servers/{edgeServer}', [EdgeController::class, 'destroy']);
        Route::get('/edge-servers/{edgeServer}/logs', [EdgeController::class, 'logs']);
        Route::post('/edge-servers/{edgeServer}/restart', [EdgeController::class, 'restart']);
        Route::post('/edge-servers/{edgeServer}/sync-config', [EdgeController::class, 'syncConfig']);
        Route::get('/edge-servers/{edgeServer}/config', [EdgeController::class, 'config']);

        Route::get('/cameras', [CameraController::class, 'index']);
        Route::get('/cameras/stats', [CameraController::class, 'stats']); // Mobile app endpoint
        Route::post('/cameras', [CameraController::class, 'store'])->middleware('active.subscription');
        Route::get('/cameras/{camera}', [CameraController::class, 'show']);
        Route::put('/cameras/{camera}', [CameraController::class, 'update']);
        Route::delete('/cameras/{camera}', [CameraController::class, 'destroy']);
        Route::get('/cameras/{camera}/snapshot', [CameraController::class, 'getSnapshot']);
        Route::get('/cameras/{camera}/stream', [CameraController::class, 'getStreamUrl']);
        Route::post('/cameras/test-connection', [CameraController::class, 'testConnection']);

        Route::get('/alerts', [AlertController::class, 'index']);
        Route::get('/alerts/stats', [AlertController::class, 'stats']); // Mobile app endpoint
        Route::get('/alerts/{alert}', [AlertController::class, 'show']);
        Route::post('/alerts/{alert}/acknowledge', [AlertController::class, 'acknowledge']);
        Route::post('/alerts/{alert}/resolve', [AlertController::class, 'resolve']);
        Route::post('/alerts/{alert}/false-alarm', [AlertController::class, 'markFalseAlarm']);
        Route::post('/alerts/bulk-acknowledge', [AlertController::class, 'bulkAcknowledge']);
        Route::post('/alerts/bulk-resolve', [AlertController::class, 'bulkResolve']);

        // Market Module endpoints
        Route::get('/market/dashboard', [MarketController::class, 'dashboard']);
        Route::get('/market/events', [MarketController::class, 'events']);
        Route::get('/market/events/{id}', [MarketController::class, 'show']);

        // Subscription details (for clients - Mobile/Web)
        Route::get('/subscription', [OrganizationSubscriptionController::class, 'showCurrent']);

        Route::get('/people', [PersonController::class, 'index']);
        Route::post('/people', [PersonController::class, 'store']);
        Route::get('/people/{person}', [PersonController::class, 'show']);
        Route::put('/people/{person}', [PersonController::class, 'update']);
        Route::delete('/people/{person}', [PersonController::class, 'destroy']);
        Route::post('/people/{person}/toggle-active', [PersonController::class, 'toggleActive']);
        Route::post('/people/{person}/photo', [PersonController::class, 'uploadPhoto']);
        Route::get('/people/departments', [PersonController::class, 'getDepartments']);

        Route::get('/vehicles', [VehicleController::class, 'index']);
        Route::post('/vehicles', [VehicleController::class, 'store']);
        Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show']);
        Route::put('/vehicles/{vehicle}', [VehicleController::class, 'update']);
        Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy']);
        Route::post('/vehicles/{vehicle}/toggle-active', [VehicleController::class, 'toggleActive']);
        Route::get('/vehicles/access-logs', [VehicleController::class, 'getAccessLogs']);

        Route::get('/settings/landing', [SettingsController::class, 'getLanding']);
        Route::put('/settings/landing', [SettingsController::class, 'updateLanding']);
        Route::get('/settings/system', [SettingsController::class, 'getSystem']);
        Route::put('/settings/system', [SettingsController::class, 'updateSystem']);
        Route::get('/settings/sms', [SettingsController::class, 'getSms']);
        Route::put('/settings/sms', [SettingsController::class, 'updateSms']);
        Route::post('/settings/sms/test', [SettingsController::class, 'testSms']);
        Route::get('/settings/plans', [SettingsController::class, 'getPlans']);
        Route::put('/settings/plans/{plan}', [SettingsController::class, 'updatePlan']);
        Route::get('/settings/resellers', [SettingsController::class, 'resellers']);
        Route::post('/settings/resellers', [SettingsController::class, 'storeReseller']);
        Route::put('/settings/resellers/{reseller}', [SettingsController::class, 'updateReseller']);
        Route::delete('/settings/resellers/{reseller}', [SettingsController::class, 'deleteReseller']);
        Route::post('/settings/upload-logo', [SettingsController::class, 'uploadLogo']);

        Route::get('/super-admin/settings', [SystemSettingsController::class, 'show']);
        Route::put('/super-admin/settings', [SystemSettingsController::class, 'update']);
        Route::post('/super-admin/test-email', [SystemSettingsController::class, 'testEmail']);
        Route::post('/super-admin/test-sms', [SystemSettingsController::class, 'testSms']);
        Route::post('/super-admin/test-fcm', [SystemSettingsController::class, 'testFcm']);
        Route::post('/super-admin/clear-cache', [SystemSettingsController::class, 'clearCache']);
        Route::get('/super-admin/check', [SystemSettingsController::class, 'check']);

        Route::get('/super-admin/branding', [BrandingController::class, 'showGlobal']);
        Route::put('/super-admin/branding', [BrandingController::class, 'updateGlobal']);
        Route::post('/super-admin/branding/upload-logo', [BrandingController::class, 'uploadLogo']);
        Route::get('/super-admin/branding/{organization}', [BrandingController::class, 'showForOrganization']);
        Route::put('/super-admin/branding/{organization}', [BrandingController::class, 'updateForOrganization']);

        Route::get('/content', [PlatformContentController::class, 'index']);
        Route::get('/content/{section}', [PlatformContentController::class, 'section']);
        Route::put('/content', [PlatformContentController::class, 'update']);

        Route::get('/notification-priorities', [NotificationPriorityController::class, 'index']);
        Route::post('/notification-priorities', [NotificationPriorityController::class, 'store']);
        Route::put('/notification-priorities/{notificationPriority}', [NotificationPriorityController::class, 'update']);
        Route::delete('/notification-priorities/{notificationPriority}', [NotificationPriorityController::class, 'destroy']);

        Route::get('/organizations/{organization}/sms-quota', [SmsQuotaController::class, 'show']);
        Route::put('/organizations/{organization}/sms-quota', [SmsQuotaController::class, 'update']);

        Route::get('/backups', [SystemBackupController::class, 'index']);
        Route::post('/backups', [SystemBackupController::class, 'store']);
        Route::post('/backups/{backup}/restore', [SystemBackupController::class, 'restore']);
        Route::get('/backups/{backup}/download', [SystemBackupController::class, 'download']);

        Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);
        Route::get('/analytics/time-series', [AnalyticsController::class, 'timeSeries']);
        Route::get('/analytics/by-location', [AnalyticsController::class, 'byLocation']);
        Route::get('/analytics/by-module', [AnalyticsController::class, 'byModule']);
        Route::get('/analytics/response-times', [AnalyticsController::class, 'responseTimes']);
        Route::get('/analytics/compare', [AnalyticsController::class, 'compare']);
        Route::get('/analytics/reports', [AnalyticsController::class, 'reports']);
        Route::post('/analytics/reports', [AnalyticsController::class, 'storeReport']);
        Route::get('/analytics/reports/{report}', [AnalyticsController::class, 'showReport']);
        Route::put('/analytics/reports/{report}', [AnalyticsController::class, 'updateReport']);
        Route::delete('/analytics/reports/{report}', [AnalyticsController::class, 'deleteReport']);
        Route::post('/analytics/reports/{report}/generate', [AnalyticsController::class, 'generateReport']);
        Route::get('/analytics/reports/{report}/download', [AnalyticsController::class, 'downloadReport']);
        Route::get('/analytics/dashboards', [AnalyticsController::class, 'dashboards']);
        Route::post('/analytics/dashboards', [AnalyticsController::class, 'storeDashboard']);
        Route::get('/analytics/dashboards/{dashboard}', [AnalyticsController::class, 'showDashboard']);
        Route::put('/analytics/dashboards/{dashboard}', [AnalyticsController::class, 'updateDashboard']);
        Route::delete('/analytics/dashboards/{dashboard}', [AnalyticsController::class, 'deleteDashboard']);
        Route::post('/analytics/dashboards/{dashboard}/widgets', [AnalyticsController::class, 'createWidget']);
        Route::put('/analytics/dashboards/{dashboard}/widgets/{widget}', [AnalyticsController::class, 'updateWidget']);
        Route::delete('/analytics/dashboards/{dashboard}/widgets/{widget}', [AnalyticsController::class, 'deleteWidget']);
        Route::get('/analytics/export', [AnalyticsController::class, 'export']);
        Route::post('/analytics/export-pdf', [AnalyticsController::class, 'exportPdf']);

        Route::get('/ai-policies', [AiPolicyController::class, 'index']);
        Route::post('/ai-policies', [AiPolicyController::class, 'store']);
        Route::get('/ai-policies/effective', [AiPolicyController::class, 'effective']); // Must come before {aiPolicy} route
        Route::get('/ai-policies/{id}', [AiPolicyController::class, 'show']); // Changed from {aiPolicy} to {id} to avoid route binding conflict
        Route::put('/ai-policies/{aiPolicy}', [AiPolicyController::class, 'update']);
        Route::delete('/ai-policies/{aiPolicy}', [AiPolicyController::class, 'destroy']);
        Route::post('/ai-policies/{aiPolicy}/events', [AiPolicyController::class, 'addEvent']);

        // AI Modules (Super Admin can manage, Organization users can view configs)
        Route::get('/ai-modules', [AiModuleController::class, 'index']);
        Route::get('/ai-modules/{aiModule}', [AiModuleController::class, 'show']);
        Route::put('/ai-modules/{aiModule}', [AiModuleController::class, 'update']);
        
        // Organization AI Module Configurations
        Route::get('/ai-modules/configs', [AiModuleController::class, 'getConfigs']);
        Route::get('/ai-modules/configs/{moduleId}', [AiModuleController::class, 'getConfig']);
        Route::put('/ai-modules/configs/{moduleId}', [AiModuleController::class, 'updateConfig']);
        Route::post('/ai-modules/configs/{moduleId}/enable', [AiModuleController::class, 'enableModule']);
        Route::post('/ai-modules/configs/{moduleId}/disable', [AiModuleController::class, 'disableModule']);

        // Platform Wordings (Super Admin manages, Organizations can customize)
        Route::get('/wordings', [PlatformWordingController::class, 'index']);
        Route::get('/wordings/{wording}', [PlatformWordingController::class, 'show']);
        Route::post('/wordings', [PlatformWordingController::class, 'store']);
        Route::put('/wordings/{wording}', [PlatformWordingController::class, 'update']);
        Route::delete('/wordings/{wording}', [PlatformWordingController::class, 'destroy']);
        
        // Organization-specific wordings
        Route::get('/wordings/organization', [PlatformWordingController::class, 'getForOrganization']);
        Route::post('/wordings/{wording}/customize', [PlatformWordingController::class, 'customizeForOrganization']);
        Route::delete('/wordings/{wording}/customize', [PlatformWordingController::class, 'removeCustomization']);

        Route::get('/updates', [UpdateAnnouncementController::class, 'index']);
        Route::post('/updates', [UpdateAnnouncementController::class, 'store']);
        Route::put('/updates/{update}', [UpdateAnnouncementController::class, 'update']);
        Route::delete('/updates/{update}', [UpdateAnnouncementController::class, 'destroy']);
        Route::post('/updates/{update}/toggle', [UpdateAnnouncementController::class, 'togglePublish']);

        // System Updates (Real Update System)
        Route::get('/system-updates', [SystemUpdateController::class, 'index']);
        Route::post('/system-updates/upload', [SystemUpdateController::class, 'upload']);
        Route::post('/system-updates/{updateId}/install', [SystemUpdateController::class, 'install']);
        Route::post('/system-updates/rollback/{backupId}', [SystemUpdateController::class, 'rollback']);
        Route::get('/system-updates/current-version', [SystemUpdateController::class, 'currentVersion']);

        Route::get('/ai-commands', [AiCommandController::class, 'index']);
        Route::post('/ai-commands', [AiCommandController::class, 'store']);
        Route::post('/ai-commands/execute', [AiCommandController::class, 'execute']); // For Organization Owners
        Route::post('/ai-commands/{aiCommand}/ack', [AiCommandController::class, 'ack']);
        Route::post('/ai-commands/{aiCommand}/retry', [AiCommandController::class, 'retry']);
        Route::get('/ai-commands/{aiCommand}/logs', [AiCommandController::class, 'logs']);

        Route::get('/integrations', [IntegrationController::class, 'index']);
        Route::post('/integrations', [IntegrationController::class, 'store']);
        Route::get('/integrations/{integration}', [IntegrationController::class, 'show']);
        Route::put('/integrations/{integration}', [IntegrationController::class, 'update']);
        Route::delete('/integrations/{integration}', [IntegrationController::class, 'destroy']);
        Route::post('/integrations/{integration}/toggle-active', [IntegrationController::class, 'toggleActive']);
        Route::post('/integrations/{integration}/test', [IntegrationController::class, 'testConnection']);
        Route::get('/integrations/types', [IntegrationController::class, 'getAvailableTypes']);

        // Automation Rules
        Route::get('/automation-rules', [AutomationRuleController::class, 'index']);
        Route::post('/automation-rules', [AutomationRuleController::class, 'store']);
        Route::get('/automation-rules/{automationRule}', [AutomationRuleController::class, 'show']);
        Route::put('/automation-rules/{automationRule}', [AutomationRuleController::class, 'update']);
        Route::delete('/automation-rules/{automationRule}', [AutomationRuleController::class, 'destroy']);
        Route::post('/automation-rules/{automationRule}/toggle-active', [AutomationRuleController::class, 'toggleActive']);
        Route::post('/automation-rules/{automationRule}/test', [AutomationRuleController::class, 'test']);
        Route::get('/automation-rules/{automationRule}/logs', [AutomationRuleController::class, 'getLogs']);
        Route::get('/automation-rules/triggers', [AutomationRuleController::class, 'getAvailableTriggers']);
        Route::get('/automation-rules/actions', [AutomationRuleController::class, 'getAvailableActions']);
    });
});
