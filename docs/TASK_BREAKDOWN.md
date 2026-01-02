# TASK_BREAKDOWN.md - Implementation Tasks by Phase

**Generated**: 2025-12-30  
**Purpose**: Detailed task breakdown for remaining phases with files, acceptance criteria, and dependencies

---

## Status Summary

- ✅ **PHASE A**: COMPLETED - System understanding and documentation
- ✅ **PHASE DB**: COMPLETED - Database schema completion
- 🔄 **PHASE B**: PENDING - Security & Tenant Hardening
- 🔄 **PHASE C**: PENDING - Web Portal Truth Alignment
- 🔄 **PHASE C-MOBILE**: PENDING - Mobile Compatibility
- 🔄 **PHASE D**: PENDING - SaaS Enforcement (Plans/Quotas)
- 🔄 **PHASE E**: PENDING - Edge Integration (Secure + Real)
- 🔄 **PHASE F**: PENDING - Testing + CI + Runbook

---

## PHASE B: Security & Tenant Hardening (BLOCKERS)

### B1: Route Protection

**Goal**: Move all non-auth routes under auth:sanctum, add throttling

**Tasks**:
1. **Move public edge endpoints to signed authentication**
   - Files: `apps/cloud-laravel/routes/api.php`
   - Change: Move `/v1/edges/heartbeat`, `/v1/edges/events`, `/v1/edges/cameras` to require HMAC signature (not auth:sanctum)
   - Keep `/v1/licensing/validate` public but add rate limiting
   - Add throttle middleware: `throttle:60,1` for auth endpoints, `throttle:100,1` for edge endpoints

**Acceptance Criteria**:
- [ ] All edge endpoints require HMAC signature
- [ ] Auth endpoints have rate limiting
- [ ] Public endpoints have rate limiting
- [ ] No unauthorized access possible

**Dependencies**: PHASE E (HMAC implementation)

---

### B2: Policies & Middleware

**Goal**: Create comprehensive authorization policies and middleware

**Tasks**:
1. **Create Policies**
   - Files to create:
     - `apps/cloud-laravel/app/Policies/OrganizationPolicy.php`
     - `apps/cloud-laravel/app/Policies/UserPolicy.php`
     - `apps/cloud-laravel/app/Policies/LicensePolicy.php`
     - `apps/cloud-laravel/app/Policies/CameraPolicy.php`
     - `apps/cloud-laravel/app/Policies/EdgeServerPolicy.php`
     - `apps/cloud-laravel/app/Policies/EventPolicy.php`
   
2. **Create Middleware**
   - Files to create:
     - `apps/cloud-laravel/app/Http/Middleware/EnsureSuperAdmin.php`
     - `apps/cloud-laravel/app/Http/Middleware/EnsureOrgMember.php`
     - `apps/cloud-laravel/app/Http/Middleware/EnsureOrgManager.php`
     - `apps/cloud-laravel/app/Http/Middleware/VerifyEdgeSignature.php` (for PHASE E)

3. **Apply Policies to Controllers**
   - Files to modify:
     - `apps/cloud-laravel/app/Http/Controllers/OrganizationController.php`
     - `apps/cloud-laravel/app/Http/Controllers/UserController.php`
     - `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
     - `apps/cloud-laravel/app/Http/Controllers/CameraController.php`
     - `apps/cloud-laravel/app/Http/Controllers/EventController.php`

**Acceptance Criteria**:
- [ ] All policies created and registered in `AuthServiceProvider`
- [ ] All controllers use `$this->authorize()` or `authorizeResource()`
- [ ] Middleware applied to routes
- [ ] No endpoint accessible without proper authorization
- [ ] Tenant isolation enforced at policy level

**Dependencies**: None

---

### B3: Fix Critical Endpoints

**Goal**: Fix all endpoints with missing authorization

**Tasks**:

1. **Users::toggleActive**
   - File: `apps/cloud-laravel/app/Http/Controllers/UserController.php`
   - Change: Add `$this->authorize('update', $user)` and verify same organization
   - Test: Cannot toggle users from other orgs

2. **Users::resetPassword**
   - File: `apps/cloud-laravel/app/Http/Controllers/UserController.php`
   - Change: 
     - Remove endpoint OR
     - Implement Laravel password reset workflow (token-based)
     - Never return plaintext password
   - Test: Password reset uses token, no plaintext returned

3. **Organizations::toggleActive**
   - File: `apps/cloud-laravel/app/Http/Controllers/OrganizationController.php`
   - Change: Add `$this->authorize('update', $organization)` (Super Admin only)
   - Test: Only super admin can toggle

4. **Organizations::index**
   - File: `apps/cloud-laravel/app/Http/Controllers/OrganizationController.php`
   - Change: Filter by user's organization unless super admin
   - Test: Non-super-admin only sees their org

5. **Organizations::show**
   - File: `apps/cloud-laravel/app/Http/Controllers/OrganizationController.php`
   - Change: Add `$this->authorize('view', $organization)`
   - Test: Cannot view other orgs

6. **Organizations::stats**
   - File: `apps/cloud-laravel/app/Http/Controllers/OrganizationController.php`
   - Change: Add authorization + fix wrong counts (cameras, alerts)
   - Test: Correct counts, proper authorization

7. **EdgeController::logs**
   - File: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
   - Change: Add `$this->authorize('view', $edgeServer)`
   - Test: Cannot view logs from other orgs

8. **EdgeController::config**
   - File: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
   - Change: Add `$this->authorize('view', $edgeServer)`
   - Test: Cannot view config from other orgs

**Acceptance Criteria**:
- [ ] All endpoints have authorization checks
- [ ] No cross-tenant access possible
- [ ] Password reset uses tokens (if implemented)
- [ ] Organization stats return correct counts

**Dependencies**: B2 (Policies)

---

### B4: Remove Mass Assignment Vulnerability

**Goal**: Define $fillable for all models, remove BaseModel $guarded = []

**Tasks**:

1. **Fix BaseModel**
   - File: `apps/cloud-laravel/app/Models/BaseModel.php`
   - Change: Remove `protected $guarded = []` or make it `protected $guarded = ['*']`

2. **Add $fillable to All Models**
   - Files to modify:
     - `apps/cloud-laravel/app/Models/User.php`
     - `apps/cloud-laravel/app/Models/Organization.php`
     - `apps/cloud-laravel/app/Models/License.php`
     - `apps/cloud-laravel/app/Models/EdgeServer.php` (already has $fillable)
     - `apps/cloud-laravel/app/Models/Camera.php`
     - `apps/cloud-laravel/app/Models/Event.php`
     - `apps/cloud-laravel/app/Models/EdgeServerLog.php`
     - All other models

3. **Create FormRequest Classes**
   - Files to create:
     - `apps/cloud-laravel/app/Http/Requests/StoreUserRequest.php`
     - `apps/cloud-laravel/app/Http/Requests/UpdateUserRequest.php`
     - `apps/cloud-laravel/app/Http/Requests/StoreOrganizationRequest.php`
     - `apps/cloud-laravel/app/Http/Requests/StoreEdgeServerRequest.php`
     - `apps/cloud-laravel/app/Http/Requests/StoreCameraRequest.php`
     - And more...

4. **Update Controllers to Use FormRequests**
   - Replace `$request->validate()` with FormRequest classes
   - Files: All controllers

**Acceptance Criteria**:
- [ ] BaseModel no longer has `$guarded = []`
- [ ] All models have explicit `$fillable` arrays
- [ ] All create/update endpoints use FormRequest validation
- [ ] Cannot mass assign `is_super_admin`, `role`, `organization_id` without authorization
- [ ] Tests verify mass assignment protection

**Dependencies**: None

---

### B5: Standardize Responses

**Goal**: Consistent JSON error format and HTTP status codes

**Tasks**:

1. **Create ApiResponse Trait**
   - File: `apps/cloud-laravel/app/Traits/ApiResponse.php`
   - Methods: `success()`, `error()`, `validationError()`, `unauthorized()`, `forbidden()`, `notFound()`

2. **Update All Controllers**
   - Use trait methods for consistent responses
   - Files: All controllers

3. **Update Exception Handler**
   - File: `apps/cloud-laravel/app/Exceptions/Handler.php`
   - Return consistent JSON format for all errors

**Acceptance Criteria**:
- [ ] All responses use consistent format: `{ success: bool, message: string, data?: any, errors?: object }`
- [ ] Correct HTTP status codes (401, 403, 422, 404, 201, etc.)
- [ ] Mobile app compatibility maintained

**Dependencies**: None

---

## PHASE C: Web Portal Truth Alignment

### C1: Verify UI Actions Match Backend

**Goal**: No misleading UI - either fully implemented or disabled

**Tasks**:

1. **Dashboard Widgets**
   - File: `apps/web-portal/src/pages/Dashboard.tsx`
   - Change: 
     - Hide attendance/visitors widgets OR implement backend
     - Hide weekly_stats OR implement backend
   - Backend: `apps/cloud-laravel/app/Http/Controllers/DashboardController.php`
     - Implement attendance/visitors if needed OR return null and hide UI

2. **Edge Server Actions**
   - File: `apps/web-portal/src/pages/Settings.tsx`
   - Change:
     - Disable "Restart Edge" button OR implement real command (PHASE E)
     - Disable "Sync Config" button OR implement real command (PHASE E)
   - Show clear message: "Feature not yet implemented" if disabled

3. **Analytics Pages**
   - Files: `apps/web-portal/src/pages/Analytics.tsx`, `AdvancedAnalytics.tsx`
   - Change:
     - Hide placeholder widgets OR implement real analytics
   - Backend: `apps/cloud-laravel/app/Http/Controllers/AnalyticsController.php`
     - Implement real queries OR return empty data and hide UI

**Acceptance Criteria**:
- [ ] No UI buttons that don't do real work
- [ ] No placeholder metrics shown as real data
- [ ] Clear "Not Implemented" messages if feature disabled
- [ ] All working features show real data

**Dependencies**: PHASE E (for edge commands)

---

### C2: Fix Silent Failures

**Goal**: Show clear errors when operations fail

**Tasks**:

1. **Camera Sync Errors**
   - File: `apps/cloud-laravel/app/Http/Controllers/CameraController.php`
   - Change: Return error if sync fails, don't log silently
   - Frontend: `apps/web-portal/src/pages/Cameras.tsx`
   - Change: Show error message if sync fails

2. **Edge Server Errors**
   - File: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
   - Change: Return clear errors for offline edges, missing IPs
   - Frontend: Show error messages

**Acceptance Criteria**:
- [ ] No silent failures
- [ ] Users see clear error messages
- [ ] Errors are actionable (e.g., "Edge server offline", "Missing IP address")

**Dependencies**: None

---

## PHASE C-MOBILE: Mobile Compatibility

### CM1: Identify Mobile Endpoints

**Goal**: Ensure mobile app compatibility

**Tasks**:

1. **Document Mobile Endpoints**
   - File: `docs/MOBILE_API_COMPATIBILITY.md`
   - List all endpoints used by mobile app
   - Document expected response format

2. **Backward Compatibility**
   - Ensure no breaking changes to mobile endpoints
   - If changes needed: create versioned endpoints or compatibility layer

**Acceptance Criteria**:
- [ ] Mobile app continues to work
- [ ] No breaking response format changes
- [ ] Versioned endpoints if needed

**Dependencies**: None

---

## PHASE D: SaaS Enforcement (Plans/Quotas)

### D1: Create PlanEnforcementService

**Goal**: Single source of truth for quota checks

**Tasks**:

1. **Create Service**
   - File: `apps/cloud-laravel/app/Services/PlanEnforcementService.php`
   - Methods:
     - `assertCanCreateUser(Organization $org): void`
     - `assertCanCreateCamera(Organization $org): void`
     - `assertCanCreateEdge(Organization $org): void`
     - `getCurrentUsage(Organization $org): array`

2. **Get Quota from License or Organization**
   - Check license first, fallback to organization plan
   - Consider active license with highest quota

**Acceptance Criteria**:
- [ ] Service exists with all assertion methods
- [ ] Throws exceptions with clear messages
- [ ] Tests verify quota enforcement

**Dependencies**: None

---

### D2: Apply Enforcement

**Goal**: Enforce quotas before creating resources

**Tasks**:

1. **UserController::store**
   - File: `apps/cloud-laravel/app/Http/Controllers/UserController.php`
   - Change: Call `PlanEnforcementService::assertCanCreateUser()` before creating

2. **CameraController::store**
   - File: `apps/cloud-laravel/app/Http/Controllers/CameraController.php`
   - Change: Call `PlanEnforcementService::assertCanCreateCamera()` before creating

3. **EdgeController::store**
   - File: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
   - Change: Call `PlanEnforcementService::assertCanCreateEdge()` before creating

**Acceptance Criteria**:
- [ ] Cannot exceed user quota
- [ ] Cannot exceed camera quota
- [ ] Cannot exceed edge server quota
- [ ] Clear error messages when quota exceeded
- [ ] Tests verify enforcement

**Dependencies**: D1

---

### D3: License Expiry & Grace

**Goal**: Enforce license expiry with grace period

**Tasks**:

1. **Create Middleware**
   - File: `apps/cloud-laravel/app/Http/Middleware/EnsureActiveSubscription.php`
   - Check license status and expiry
   - Allow grace period (14 days default)

2. **Apply to Restricted Endpoints**
   - Apply middleware to:
     - Camera creation/update
     - Edge server creation/update
     - User creation (if quota-based)

3. **Scheduled Job**
   - File: `apps/cloud-laravel/app/Console/Commands/DeactivateExpiredLicenses.php`
   - Deactivate licenses after grace period
   - Schedule in `app/Console/Kernel.php`

**Acceptance Criteria**:
- [ ] Expired licenses blocked after grace period
- [ ] Grace period configurable
- [ ] Scheduled job deactivates expired licenses
- [ ] Tests verify expiry enforcement

**Dependencies**: None

---

## PHASE E: Edge Integration (Secure + Real)

### E1: Fix Heartbeat Bug

**Goal**: Ensure heartbeat works correctly

**Tasks**:

1. **Verify Fix**
   - File: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
   - Status: ✅ Already fixed (moved license linking after edge creation)

**Acceptance Criteria**:
- [ ] Heartbeat returns 200, not 500
- [ ] Edge server registered correctly
- [ ] License linked correctly

**Dependencies**: None (already done)

---

### E2: Implement HMAC Authentication

**Goal**: Cryptographic authentication for edge servers

**Tasks**:

1. **Add edge_key and edge_secret to Database**
   - Status: ✅ Already added in migration

2. **Create Middleware**
   - File: `apps/cloud-laravel/app/Http/Middleware/VerifyEdgeSignature.php`
   - Verify HMAC signature:
     - `X-EDGE-KEY`: edge_key
     - `X-EDGE-TIMESTAMP`: Unix timestamp
     - `X-EDGE-SIGNATURE`: HMAC_SHA256(secret, method|path|timestamp|body_hash)
   - Replay protection: timestamp within 5 minutes

3. **Apply to Edge Endpoints**
   - File: `apps/cloud-laravel/routes/api.php`
   - Apply middleware to:
     - `POST /v1/edges/heartbeat`
     - `GET /v1/edges/cameras`
     - `POST /v1/edges/events`

4. **Update Edge Server Python Code**
   - File: `apps/edge-server/app/core/database.py`
   - Add signature headers to all requests
   - Implement HMAC signing

5. **Generate Keys on Edge Creation**
   - File: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
   - Generate `edge_key` and `edge_secret` when creating edge server
   - Return keys in response (only once)

**Acceptance Criteria**:
- [ ] Edge endpoints require valid HMAC signature
- [ ] Replay attacks prevented (timestamp check)
- [ ] Edge server Python code signs all requests
- [ ] Keys generated automatically on edge creation
- [ ] Tests verify signature validation

**Dependencies**: PHASE DB (edge_key, edge_secret columns)

---

### E3: Make Edge Commands Real

**Goal**: Actually send commands to edge servers, not just logs

**Tasks**:

1. **Create EdgeCommandService**
   - File: `apps/cloud-laravel/app/Services/EdgeCommandService.php`
   - Methods:
     - `restart(EdgeServer $edge): bool`
     - `syncConfig(EdgeServer $edge): bool`
   - Send HTTP POST to edge server API endpoint

2. **Update EdgeController**
   - File: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
   - `restart()`: Call `EdgeCommandService::restart()`
   - `syncConfig()`: Call `EdgeCommandService::syncConfig()`
   - Return real status, not fake success

3. **Update Edge Server Python**
   - File: `apps/edge-server/app/api/routes.py` (or similar)
   - Add endpoints:
     - `POST /api/restart` - Restart edge server
     - `POST /api/sync-config` - Sync configuration from cloud

4. **Update Frontend**
   - File: `apps/web-portal/src/pages/Settings.tsx`
   - Show real status from backend
   - Handle errors properly

**Acceptance Criteria**:
- [ ] Restart actually restarts edge server
- [ ] Sync config actually syncs configuration
- [ ] Real status returned (success/failure)
- [ ] Errors shown to user
- [ ] Tests verify command execution

**Dependencies**: E2 (HMAC auth for edge commands)

---

### E4: Secure Edge Endpoints

**Goal**: All edge endpoints properly secured

**Tasks**:

1. **Apply HMAC Middleware**
   - All edge endpoints require signature

2. **Rate Limiting**
   - Apply throttle to edge endpoints
   - Prevent abuse

3. **Validate Organization**
   - Verify edge belongs to organization
   - Prevent cross-tenant access

**Acceptance Criteria**:
- [ ] All edge endpoints secured
- [ ] Rate limiting applied
- [ ] Tenant isolation enforced

**Dependencies**: E2

---

## PHASE F: Testing + CI + Runbook

### F1: Backend Tests

**Goal**: Comprehensive test coverage

**Tasks**:

1. **Create Test Files**
   - `apps/cloud-laravel/tests/Feature/TenantIsolationTest.php`
   - `apps/cloud-laravel/tests/Feature/AuthorizationTest.php`
   - `apps/cloud-laravel/tests/Feature/QuotaEnforcementTest.php`
   - `apps/cloud-laravel/tests/Feature/EdgeSignatureTest.php`
   - `apps/cloud-laravel/tests/Feature/EndToEndTest.php`

2. **Write Tests**
   - Tenant isolation: Cannot access other org's data
   - Authorization: Cannot perform unauthorized actions
   - Quota enforcement: Cannot exceed limits
   - Edge signature: HMAC validation works
   - E2E: Full flow from org creation to event ingestion

**Acceptance Criteria**:
- [ ] All critical flows have tests
- [ ] Tests pass
- [ ] Coverage > 70% for critical paths

**Dependencies**: All previous phases

---

### F2: Web Build Checks

**Goal**: Ensure web portal builds successfully

**Tasks**:

1. **Verify Build**
   - Run `npm ci && npm run build`
   - Fix any TypeScript errors
   - Fix any build errors

**Acceptance Criteria**:
- [ ] Web portal builds without errors
- [ ] No TypeScript errors
- [ ] Production build works

**Dependencies**: PHASE C

---

### F3: CI Pipeline

**Goal**: Automated testing and building

**Tasks**:

1. **Create GitHub Actions**
   - File: `.github/workflows/ci.yml`
   - Backend: composer install + php artisan test
   - Web: npm ci + npm run build
   - Edge: python install + tests/lint

**Acceptance Criteria**:
- [ ] CI runs on every push
- [ ] All checks pass
- [ ] Failures block merge

**Dependencies**: F1, F2

---

### F4: Runbook

**Goal**: Production deployment guide

**Tasks**:

1. **Create Runbook**
   - File: `docs/RUNBOOK.md`
   - MySQL setup
   - Backend: env + migrate + seed + run
   - Web: env + build + run
   - Edge: env + bind edge_key/secret + run
   - Troubleshooting

**Acceptance Criteria**:
- [ ] Complete deployment instructions
   - [ ] Troubleshooting guide
   - [ ] All steps tested

**Dependencies**: All phases

---

## Implementation Order

1. ✅ PHASE A (Documentation)
2. ✅ PHASE DB (Database)
3. **PHASE B** (Security) - **START HERE**
4. **PHASE D** (Quotas) - Can be parallel with B
5. **PHASE E** (Edge) - Depends on B
6. **PHASE C** (Web Portal) - Depends on B, E
7. **PHASE C-MOBILE** (Mobile) - Can be parallel
8. **PHASE F** (Testing) - After all phases

---

## Estimated Effort

- **PHASE B**: 3-4 days (Security is critical)
- **PHASE D**: 1-2 days (Quota enforcement)
- **PHASE E**: 2-3 days (Edge integration)
- **PHASE C**: 1-2 days (Web portal alignment)
- **PHASE C-MOBILE**: 0.5 days (Compatibility check)
- **PHASE F**: 2-3 days (Testing + CI)

**Total**: ~10-15 days of focused development

---

**End of TASK_BREAKDOWN.md**
