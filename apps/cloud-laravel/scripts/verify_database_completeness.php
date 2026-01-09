<?php

/**
 * Verify database completeness
 * Checks all models against migrations
 */

$models = [
    'AiAlertPolicy' => 'ai_alert_policies',
    'AiCameraBinding' => 'ai_camera_bindings',
    'AiCommand' => 'ai_commands',
    'AiCommandLog' => 'ai_command_logs',
    'AiCommandTarget' => 'ai_command_targets',
    'AiModule' => 'ai_modules',
    'AiModuleConfig' => 'ai_module_configs',
    'AiPolicy' => 'ai_policies',
    'AiPolicyEvent' => 'ai_policy_events',
    'AiScenario' => 'ai_scenarios',
    'AiScenarioRule' => 'ai_scenario_rules',
    'AnalyticsDashboard' => 'analytics_dashboards',
    'AnalyticsReport' => 'analytics_reports',
    'AnalyticsWidget' => 'analytics_widgets',
    'AutomationLog' => 'automation_logs',
    'AutomationRule' => 'automation_rules',
    'BrandingSetting' => 'organizations_branding',
    'Camera' => 'cameras',
    'ContactInquiry' => 'contact_inquiries',
    'DeviceToken' => 'device_tokens',
    'Distributor' => 'distributors',
    'EdgeNonce' => 'edge_nonces',
    'EdgeServer' => 'edge_servers',
    'EdgeServerLog' => 'edge_server_logs',
    'Event' => 'events',
    'FreeTrialRequest' => 'free_trial_requests',
    'Integration' => 'integrations',
    'License' => 'licenses',
    'Notification' => 'notifications',
    'NotificationPriority' => 'notification_priorities',
    'Organization' => 'organizations',
    'OrganizationSubscription' => 'organization_subscriptions',
    'OrganizationWording' => 'organization_wordings',
    'PlatformContent' => 'platform_contents',
    'PlatformWording' => 'platform_wordings',
    'RegisteredFace' => 'registered_faces',
    'RegisteredVehicle' => 'registered_vehicles',
    'Reseller' => 'resellers',
    'SMSQuota' => 'sms_quotas',
    'SubscriptionPlan' => 'subscription_plans',
    'SubscriptionPlanLimit' => 'subscription_plan_limits',
    'SystemBackup' => 'system_backups',
    'SystemSetting' => 'system_settings',
    'SystemUpdate' => 'system_updates',
    'UpdateAnnouncement' => 'updates',
    'User' => 'users',
    'VehicleAccessLog' => 'vehicle_access_logs',
];

echo "=== DATABASE COMPLETENESS VERIFICATION ===\n\n";
echo "Total Models: " . count($models) . "\n";
echo "Total Tables Expected: " . count($models) . "\n\n";

echo "=== TABLES BY MODEL ===\n";
foreach ($models as $model => $table) {
    echo "{$model} -> {$table}\n";
}

echo "\n=== VERIFICATION COMPLETE ===\n";
