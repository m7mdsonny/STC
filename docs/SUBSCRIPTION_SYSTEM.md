# Subscription System Documentation

**Date**: 2025-01-30  
**Status**: ✅ **COMPLETE**

---

## Overview

The subscription system provides a flexible, admin-controlled subscription management system for the Cloud Backend. It allows Super Admins to:
- Create and manage subscription plans
- Assign plans to organizations
- Enforce limits and module access
- Track subscription status and expiration

---

## Architecture

### Database Schema

#### `subscription_plans` Table
- `id` - Primary key
- `name` - Plan identifier (unique)
- `name_ar` - Arabic name
- `max_cameras` - Maximum cameras allowed
- `max_edge_servers` - Maximum edge servers allowed
- `available_modules` - JSON array of enabled AI modules (e.g., ["market", "fire"])
- `notification_channels` - JSON array of notification channels
- `price_monthly` - Monthly price
- `price_yearly` - Yearly price
- `sms_quota` - SMS quota per month
- `retention_days` - Data retention period in days (NEW)
- `is_active` - Plan status (active/deprecated)
- `created_at`, `updated_at`, `deleted_at`

#### `organization_subscriptions` Table (NEW)
- `id` - Primary key
- `organization_id` - Foreign key to organizations
- `subscription_plan_id` - Foreign key to subscription_plans
- `starts_at` - Subscription start date
- `ends_at` - Subscription end date (nullable)
- `status` - active, cancelled, expired
- `notes` - Admin notes
- `created_at`, `updated_at`, `deleted_at`

---

## Models

### SubscriptionPlan
```php
- hasMany(SubscriptionPlanLimit::class) - Custom limits
- hasManyThrough(Organization::class, OrganizationSubscription::class) - Organizations
```

### OrganizationSubscription
```php
- belongsTo(Organization::class)
- belongsTo(SubscriptionPlan::class)
- isActive() - Check if subscription is currently active
```

### Organization
```php
- hasOne(OrganizationSubscription::class) - Active subscription
- hasMany(OrganizationSubscription::class) - All subscriptions
- belongsTo(SubscriptionPlan::class) - Legacy compatibility
```

---

## Service Layer

### SubscriptionService

Located at: `app/Services/SubscriptionService.php`

#### Key Methods:

**`getActiveSubscription(Organization $organization): ?OrganizationSubscription`**
- Returns the currently active subscription for an organization

**`getEffectivePlan(Organization $organization): ?SubscriptionPlan`**
- Returns the effective plan (from active subscription or organization field)
- Backward compatible with legacy `subscription_plan` field

**`checkLimit(Organization $organization, string $limitType, int $currentCount): array`**
- Checks if organization can perform an action based on limits
- Returns: `['allowed' => bool, 'message' => string, 'limit' => int, 'current' => int]`
- Supported limit types: `cameras`, `edge_servers`

**`isModuleEnabled(Organization $organization, string $module): bool`**
- Checks if a specific AI module is enabled for the organization

**`getSubscriptionDetails(Organization $organization): array`**
- Returns comprehensive subscription details for API responses
- Includes: plan info, limits, enabled modules, subscription status

**`assignPlan(Organization $organization, SubscriptionPlan $plan, ?DateTime $startsAt, ?DateTime $endsAt): OrganizationSubscription`**
- Assigns a subscription plan to an organization
- Cancels existing active subscriptions
- Updates organization's legacy fields for backward compatibility

---

## API Endpoints

### Subscription Plans (Super Admin Only)

```
GET    /api/v1/subscription-plans              - List all plans
POST   /api/v1/subscription-plans              - Create plan
GET    /api/v1/subscription-plans/{id}         - Get plan details
PUT    /api/v1/subscription-plans/{id}         - Update plan
DELETE /api/v1/subscription-plans/{id}         - Delete plan
```

### Organization Subscriptions

```
GET    /api/v1/organizations/{org}/subscription       - Get subscription details
POST   /api/v1/organizations/{org}/subscription/assign - Assign subscription (Super Admin)
GET    /api/v1/organizations/{org}/subscriptions      - Get all subscriptions
POST   /api/v1/subscriptions/{id}/cancel              - Cancel subscription (Super Admin)
```

### Client Endpoints (Mobile/Web)

```
GET    /api/v1/subscription                       - Get current user's subscription details
```

---

## Limit Enforcement

### Camera Limit Enforcement

**Location**: `CameraController::store()`

```php
$limitCheck = $this->subscriptionService->checkLimit($organization, 'cameras', $currentCount);
if (!$limitCheck['allowed']) {
    return response()->json([
        'message' => 'Camera limit exceeded',
        'error' => 'subscription_limit_exceeded',
        'limit_type' => 'cameras',
        'current' => $limitCheck['current'],
        'limit' => $limitCheck['limit'],
    ], 403);
}
```

### Edge Server Limit Enforcement

**Location**: `EdgeController::store()`

Similar pattern to camera limit enforcement.

### Module Enforcement

**Location**: `EventController::ingest()`

```php
if (isset($meta['module'])) {
    if (!$this->subscriptionService->isModuleEnabled($organization, $meta['module'])) {
        return response()->json([
            'ok' => false,
            'message' => 'Module not enabled',
            'error' => 'module_disabled'
        ], 403);
    }
}
```

---

## Backward Compatibility

The system maintains backward compatibility with existing organizations:

1. **Legacy `subscription_plan` field**: Organizations can still use the string `subscription_plan` field
2. **Fallback logic**: `getEffectivePlan()` falls back to organization's `subscription_plan` field if no active subscription exists
3. **Automatic sync**: When assigning a subscription, the organization's `subscription_plan`, `max_cameras`, and `max_edge_servers` fields are updated

---

## Migration Path

### For Existing Organizations

1. Organizations with `subscription_plan` field set continue to work
2. To migrate to new system:
   - Create subscription plan if needed
   - Use `/api/v1/organizations/{org}/subscription/assign` endpoint
   - System will update both new and legacy fields

### For New Organizations

- Use subscription assignment endpoint when creating organization
- System manages both new subscription table and legacy fields

---

## Client Integration

### Web Portal

Clients should fetch subscription details on login/load:
```typescript
GET /api/v1/subscription
```

Response includes:
- Enabled modules (for UI visibility)
- Limits (for validation hints)
- Subscription status
- Expiration dates

### Mobile App

Same endpoint: `GET /api/v1/subscription`

Clients should:
- Fetch subscription on app start
- Hide disabled features based on `enabled_modules`
- Validate limits before API calls (optional - server enforces)
- Show subscription status in settings

---

## Error Codes

### Subscription Limit Exceeded
```json
{
  "message": "Camera limit exceeded",
  "error": "subscription_limit_exceeded",
  "limit_type": "cameras",
  "current": 10,
  "limit": 8
}
```

### Module Disabled
```json
{
  "ok": false,
  "message": "Module not enabled",
  "error": "module_disabled"
}
```

---

## Super Admin UI

### Plans Management
- Location: `/admin/plans`
- Features:
  - Create/Edit/Delete plans
  - Set limits (cameras, edge servers, retention days)
  - Enable/disable modules
  - Set pricing

### Organization Management
- Location: `/admin/organizations`
- Features:
  - View organization details
  - Assign subscription plans
  - View subscription history
  - Manage subscription dates

---

## Best Practices

1. **Always check limits server-side** - Never trust client-side validation
2. **Use SubscriptionService** - Don't query subscription tables directly
3. **Handle gracefully** - Return clear error messages, don't crash
4. **Log subscription changes** - For audit trail
5. **Test limit enforcement** - Verify limits are enforced correctly

---

## Testing

### Unit Tests
- Test SubscriptionService methods
- Test limit checking logic
- Test backward compatibility

### Integration Tests
- Test camera creation with limits
- Test edge server creation with limits
- Test module enforcement
- Test subscription assignment

---

## Future Enhancements

- [ ] Subscription renewal automation
- [ ] Usage analytics per organization
- [ ] Custom limits per organization (override plan limits)
- [ ] Subscription upgrade/downgrade workflows
- [ ] Trial period management
- [ ] Billing integration

---

**Status**: ✅ **PRODUCTION READY**  
**Last Updated**: 2025-01-30
