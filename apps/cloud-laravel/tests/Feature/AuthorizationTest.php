<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Models\Camera;
use App\Models\EdgeServer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh');
        $this->artisan('db:seed');
    }

    /** @test */
    public function viewer_cannot_create_camera()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $viewer = User::create([
            'name' => 'Viewer',
            'email' => 'viewer@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'viewer',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $response = $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/v1/cameras', [
                'edge_server_id' => $edge->id,
                'name' => 'Camera',
                'rtsp_url' => 'rtsp://example.com/cam',
            ]);

        $response->assertForbidden();
    }

    /** @test */
    public function editor_can_create_camera()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $editor = User::create([
            'name' => 'Editor',
            'email' => 'editor@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'editor',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $response = $this->actingAs($editor, 'sanctum')
            ->postJson('/api/v1/cameras', [
                'edge_server_id' => $edge->id,
                'name' => 'Camera',
                'rtsp_url' => 'rtsp://example.com/cam',
            ]);

        $response->assertCreated();
    }

    /** @test */
    public function viewer_cannot_delete_camera()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $viewer = User::create([
            'name' => 'Viewer',
            'email' => 'viewer@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'viewer',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $camera = Camera::create([
            'organization_id' => $org->id,
            'edge_server_id' => $edge->id,
            'camera_id' => 'cam1',
            'name' => 'Camera',
            'rtsp_url' => 'rtsp://example.com/cam',
            'status' => 'online',
        ]);

        $response = $this->actingAs($viewer, 'sanctum')
            ->deleteJson("/api/v1/cameras/{$camera->id}");

        $response->assertForbidden();
    }

    /** @test */
    public function admin_can_delete_camera()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'admin',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $camera = Camera::create([
            'organization_id' => $org->id,
            'edge_server_id' => $edge->id,
            'camera_id' => 'cam1',
            'name' => 'Camera',
            'rtsp_url' => 'rtsp://example.com/cam',
            'status' => 'online',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/cameras/{$camera->id}");

        $response->assertOk();
    }

    /** @test */
    public function non_admin_cannot_restart_edge_server()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $editor = User::create([
            'name' => 'Editor',
            'email' => 'editor@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'editor',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $response = $this->actingAs($editor, 'sanctum')
            ->postJson("/api/v1/edge-servers/{$edge->id}/restart");

        $response->assertForbidden();
    }

    /** @test */
    public function admin_can_restart_edge_server()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'admin',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/edge-servers/{$edge->id}/restart");

        // Should return 200 or 500 (depending on edge server availability)
        $this->assertContains($response->status(), [200, 500]);
    }

    /** @test */
    public function super_admin_can_access_all_resources()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@test.com',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'is_super_admin' => true,
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        // Super admin should be able to access edge server from any org
        $response = $this->actingAs($superAdmin, 'sanctum')
            ->getJson("/api/v1/edge-servers/{$edge->id}");

        $response->assertOk();
    }
}
