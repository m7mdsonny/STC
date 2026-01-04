<?php

namespace Tests\Feature;

use App\Models\License;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DomainExecutionFlowTest extends TestCase
{
    use RefreshDatabase;

    private SubscriptionPlan $plan;
    private Organization $organization;
    private User $superAdmin;
    private User $orgAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->plan = SubscriptionPlan::create([
            'name' => 'pro',
            'name_ar' => 'برو',
            'max_cameras' => 10,
            'max_edge_servers' => 5,
            'is_active' => true,
        ]);

        $this->organization = Organization::create([
            'name' => 'Acme Org',
            'subscription_plan' => $this->plan->name,
            'is_active' => true,
        ]);

        $this->superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@example.com',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
            'is_super_admin' => true,
            'is_active' => true,
        ]);

        $this->orgAdmin = User::create([
            'name' => 'Org Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'organization_id' => $this->organization->id,
            'is_active' => true,
        ]);
    }

    public function test_core_actions_execute_and_persist()
    {
        Sanctum::actingAs($this->superAdmin);

        $licenseResponse = $this->postJson('/api/v1/licenses', [
            'organization_id' => $this->organization->id,
            'plan' => $this->plan->name,
            'max_cameras' => 5,
            'expires_at' => Carbon::now()->addMonth()->toIso8601String(),
        ]);

        $licenseResponse->assertCreated();
        $licenseId = $licenseResponse->json('id');
        $this->assertDatabaseHas('licenses', [
            'id' => $licenseId,
            'organization_id' => $this->organization->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->orgAdmin);

        $edgeResponse = $this->postJson('/api/v1/edge-servers', [
            'name' => 'Edge A',
            'ip_address' => '10.0.0.2',
            'license_id' => $licenseId,
        ]);

        $edgeResponse->assertCreated();
        $edgeId = $edgeResponse->json('id');
        $this->assertDatabaseHas('edge_servers', [
            'id' => $edgeId,
            'organization_id' => $this->organization->id,
            'license_id' => $licenseId,
        ]);

        $cameraResponse = $this->postJson('/api/v1/cameras', [
            'edge_server_id' => $edgeId,
            'name' => 'Front Door',
            'rtsp_url' => 'rtsp://example.com/stream',
        ]);

        $cameraResponse->assertCreated();
        $cameraId = $cameraResponse->json('id');
        $this->assertDatabaseHas('cameras', [
            'id' => $cameraId,
            'edge_server_id' => $edgeId,
            'organization_id' => $this->organization->id,
        ]);

        $userResponse = $this->postJson('/api/v1/users', [
            'name' => 'Viewer User',
            'email' => 'viewer@example.com',
            'password' => 'secret123',
            'role' => 'viewer',
        ]);

        $userResponse->assertCreated();
        $createdUserId = $userResponse->json('id');
        $this->assertDatabaseHas('users', [
            'id' => $createdUserId,
            'organization_id' => $this->organization->id,
        ]);

        $deleteCamera = $this->deleteJson("/api/v1/cameras/{$cameraId}");
        $deleteCamera->assertOk();
        $this->assertSoftDeleted('cameras', ['id' => $cameraId]);

        $deleteEdge = $this->deleteJson("/api/v1/edge-servers/{$edgeId}");
        $deleteEdge->assertOk();
        $this->assertSoftDeleted('edge_servers', ['id' => $edgeId]);

        Sanctum::actingAs($this->superAdmin);
        $deleteLicense = $this->deleteJson("/api/v1/licenses/{$licenseId}");
        $deleteLicense->assertOk();
        $this->assertSoftDeleted('licenses', ['id' => $licenseId]);

        $deleteUser = $this->deleteJson("/api/v1/users/{$createdUserId}");
        $deleteUser->assertOk();
        $this->assertSoftDeleted('users', ['id' => $createdUserId]);
    }

    public function test_org_admin_cannot_manage_other_org_resources()
    {
        $otherOrganization = Organization::create([
            'name' => 'Other Org',
            'subscription_plan' => $this->plan->name,
            'is_active' => true,
        ]);

        License::create([
            'organization_id' => $this->organization->id,
            'plan' => $this->plan->name,
            'license_key' => 'ORG1-LICENSE',
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->orgAdmin);

        $response = $this->postJson('/api/v1/edge-servers', [
            'name' => 'Cross Org Edge',
            'organization_id' => $otherOrganization->id,
            'ip_address' => '10.0.0.9',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('edge_servers', [
            'name' => 'Cross Org Edge',
            'organization_id' => $otherOrganization->id,
        ]);
    }
}
