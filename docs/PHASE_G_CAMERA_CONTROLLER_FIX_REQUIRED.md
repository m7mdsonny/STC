# PHASE G - CameraController Subscription Enforcement - Manual Fix Required

## Issue
CameraController::store() method does NOT check subscription limits before creating cameras.

## Required Fix

**File**: `apps/cloud-laravel/app/Http/Controllers/CameraController.php`

### Step 1: Add imports (around line 8-12)
```php
use App\Models\Organization;
use App\Services\SubscriptionService;
```

### Step 2: Add enforcement check (after line 124, before line 126)
Add this code block:
```php
        // Check subscription limit enforcement
        try {
            $org = Organization::findOrFail($organizationId);
            $subscriptionService = app(SubscriptionService::class);
            $subscriptionService->assertCanCreateCamera($org);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 403);
        }
```

### Complete Code Context:
```php
        // Verify edge server belongs to organization
        $edgeServer = EdgeServer::findOrFail($data['edge_server_id']);
        if ($edgeServer->organization_id !== (int) $organizationId) {
            return response()->json(['message' => 'Edge server does not belong to your organization'], 403);
        }

        // Check subscription limit enforcement
        try {
            $org = Organization::findOrFail($organizationId);
            $subscriptionService = app(SubscriptionService::class);
            $subscriptionService->assertCanCreateCamera($org);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 403);
        }

        // Generate unique camera_id if not provided
```

---

**Status**: ⚠️ Manual fix required - automated search_replace failed due to file state
