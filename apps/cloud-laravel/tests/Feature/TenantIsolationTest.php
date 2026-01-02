<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Models\License;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh');
        $this->artisan('db:seed');
    }

    /** @test */
    public function user_cannot_access_other_organizations_cameras()
    {
        // Create two organizations
        $org1 = Organization::create([
            'name' => 'Organization 1',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $org2 = Organization::create([
            'name' => 'Organization 2',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        // Create users for each organization
        $user1 = User::create([
            'name' => 'User 1',
            'email' => 'user1@org1.com',
            'password' => Hash::make('password'),
            'organization_id' => $org1->id,
            'role' => 'org_admin',
            'is_active' => true,
        ]);

        $user2 = User::create([
            'name' => 'User 2',
            'email' => 'user2@org2.com',
            'password' => Hash::make('password'),
            'organization_id' => $org2->id,
            'role' => 'org_admin',
            'is_active' => true,
        ]);

        // Create edge servers
        $edge1 = EdgeServer::create([
            'organization_id' => $org1->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $edge2 = EdgeServer::create([
            'organization_id' => $org2->id,
            'edge_id' => 'edge2',
            'edge_key' => 'key2',
            'edge_secret' => 'secret2',
            'name' => 'Edge 2',
            'online' => true,
        ]);

        // Create cameras for each organization
        $camera1 = Camera::create([
            'organization_id' => $org1->id,
            'edge_server_id' => $edge1->id,
            'camera_id' => 'cam1',
            'name' => 'Camera 1',
            'rtsp_url' => 'rtsp://example.com/cam1',
            'status' => 'online',
        ]);

        $camera2 = Camera::create([
            'organization_id' => $org2->id,
            'edge_server_id' => $edge2->id,
            'camera_id' => 'cam2',
            'name' => 'Camera 2',
            'rtsp_url' => 'rtsp://example.com/cam2',
            'status' => 'online',
        ]);

        // User 1 should only see their organization's cameras
        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/v1/cameras');

        $response->assertOk();
        $cameras = $response->json('data');
        $this->assertCount(1, $cameras);
        $this->assertEquals($camera1->id, $cameras[0]['id']);

        // User 1 should not be able to access camera from org2
        $response = $this->actingAs($user1, 'sanctum')
            ->getJson("/api/v1/cameras/{$camera2->id}");

        $response->assertForbidden();
    }

    /** @test */
    public function user_cannot_access_other_organizations_edge_servers()
    {
        $org1 = Organization::create([
            'name' => 'Organization 1',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $org2 = Organization::create([
            'name' => 'Organization 2',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $user1 = User::create([
            'name' => 'User 1',
            'email' => 'user1@org1.com',
            'password' => Hash::make('password'),
            'organization_id' => $org1->id,
            'role' => 'org_admin',
            'is_active' => true,
        ]);

        $edge1 = EdgeServer::create([
            'organization_id' => $org1->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $edge2 = EdgeServer::create([
            'organization_id' => $org2->id,
            'edge_id' => 'edge2',
            'edge_key' => 'key2',
            'edge_secret' => 'secret2',
            'name' => 'Edge 2',
            'online' => true,
        ]);

        // User 1 should only see their organization's edge servers
        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/v1/edge-servers');

        $response->assertOk();
        $edges = $response->json('data');
        $this->assertCount(1, $edges);
        $this->assertEquals($edge1->id, $edges[0]['id']);

        // User 1 should not be able to access edge server from org2
        $response = $this->actingAs($user1, 'sanctum')
            ->getJson("/api/v1/edge-servers/{$edge2->id}");

        $response->assertForbidden();
    }

    /** @test */
    public function user_cannot_create_camera_for_other_organization()
    {
        $org1 = Organization::create([
            'name' => 'Organization 1',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $org2 = Organization::create([
            'name' => 'Organization 2',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $user1 = User::create([
            'name' => 'User 1',
            'email' => 'user1@org1.com',
            'password' => Hash::make('password'),
            'organization_id' => $org1->id,
            'role' => 'org_admin',
            'is_active' => true,
        ]);

        $edge2 = EdgeServer::create([
            'organization_id' => $org2->id,
            'edge_id' => 'edge2',
            'edge_key' => 'key2',
            'edge_secret' => 'secret2',
            'name' => 'Edge 2',
            'online' => true,
        ]);

        // User 1 should not be able to create camera for org2
        $response = $this->actingAs($user1, 'sanctum')
            ->postJson('/api/v1/cameras', [
                'organization_id' => $org2->id,
                'edge_server_id' => $edge2->id,
                'name' => 'Camera for Org2',
                'rtsp_url' => 'rtsp://example.com/cam',
            ]);

        $response->assertForbidden();
    }

    /** @test */
    public function super_admin_can_access_all_organizations()
    {
        $org1 = Organization::create([
            'name' => 'Organization 1',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $org2 = Organization::create([
            'name' => 'Organization 2',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'is_super_admin' => true,
            'is_active' => true,
        ]);

        $edge1 = EdgeServer::create([
            'organization_id' => $org1->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $edge2 = EdgeServer::create([
            'organization_id' => $org2->id,
            'edge_id' => 'edge2',
            'edge_key' => 'key2',
            'edge_secret' => 'secret2',
            'name' => 'Edge 2',
            'online' => true,
        ]);

        // Super admin should see all edge servers
        $response = $this->actingAs($superAdmin, 'sanctum')
            ->getJson('/api/v1/edge-servers');

        $response->assertOk();
        $edges = $response->json('data');
        $this->assertGreaterThanOrEqual(2, count($edges));
    }
}
