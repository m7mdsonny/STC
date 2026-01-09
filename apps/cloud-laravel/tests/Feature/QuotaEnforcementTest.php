<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Models\Camera;
use App\Models\EdgeServer;
use App\Models\License;
use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class QuotaEnforcementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh');
        $this->artisan('db:seed');
    }

    /** @test */
    public function cannot_create_camera_when_quota_exceeded()
    {
        // Create plan with limited cameras
        $plan = SubscriptionPlan::create([
            'name' => 'limited',
            'name_ar' => 'محدود',
            'max_cameras' => 2,
            'max_edge_servers' => 1,
            'is_active' => true,
        ]);

        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'limited',
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'org_admin',
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

        // Create 2 cameras (at quota limit)
        Camera::create([
            'organization_id' => $org->id,
            'edge_server_id' => $edge->id,
            'camera_id' => 'cam1',
            'name' => 'Camera 1',
            'rtsp_url' => 'rtsp://example.com/cam1',
            'status' => 'online',
        ]);

        Camera::create([
            'organization_id' => $org->id,
            'edge_server_id' => $edge->id,
            'camera_id' => 'cam2',
            'name' => 'Camera 2',
            'rtsp_url' => 'rtsp://example.com/cam2',
            'status' => 'online',
        ]);

        // Try to create third camera (should fail)
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cameras', [
                'edge_server_id' => $edge->id,
                'name' => 'Camera 3',
                'rtsp_url' => 'rtsp://example.com/cam3',
            ]);

        $response->assertStatus(403)
            ->assertJsonFragment(['message']);
        
        $this->assertStringContainsString('quota exceeded', strtolower($response->json('message')));
    }

    /** @test */
    public function cannot_create_edge_server_when_quota_exceeded()
    {
        $plan = SubscriptionPlan::create([
            'name' => 'limited',
            'name_ar' => 'محدود',
            'max_cameras' => 10,
            'max_edge_servers' => 1,
            'is_active' => true,
        ]);

        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'limited',
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'org_admin',
            'is_active' => true,
        ]);

        // Create 1 edge server (at quota limit)
        EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'edge1',
            'edge_key' => 'key1',
            'edge_secret' => 'secret1',
            'name' => 'Edge 1',
            'online' => true,
        ]);

        // Try to create second edge server (should fail)
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/edge-servers', [
                'name' => 'Edge 2',
            ]);

        $response->assertStatus(403)
            ->assertJsonFragment(['message']);
        
        $this->assertStringContainsString('quota exceeded', strtolower($response->json('message')));
    }

    /** @test */
    public function license_quota_takes_priority_over_plan_quota()
    {
        $plan = SubscriptionPlan::create([
            'name' => 'limited',
            'name_ar' => 'محدود',
            'max_cameras' => 2,
            'max_edge_servers' => 1,
            'is_active' => true,
        ]);

        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'limited',
            'is_active' => true,
        ]);

        // Create license with higher quota
        $license = License::create([
            'organization_id' => $org->id,
            'license_key' => 'test-license-key',
            'status' => 'active',
            'max_cameras' => 10, // Higher than plan limit
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'org_admin',
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

        // Should be able to create up to 10 cameras (license limit), not 2 (plan limit)
        for ($i = 1; $i <= 10; $i++) {
            $response = $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/cameras', [
                    'edge_server_id' => $edge->id,
                    'name' => "Camera {$i}",
                    'rtsp_url' => "rtsp://example.com/cam{$i}",
                ]);

            $response->assertStatus(201);
        }

        // 11th camera should fail
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cameras', [
                'edge_server_id' => $edge->id,
                'name' => 'Camera 11',
                'rtsp_url' => 'rtsp://example.com/cam11',
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function unlimited_quota_allows_unlimited_resources()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => Hash::make('password'),
            'organization_id' => $org->id,
            'role' => 'org_admin',
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

        // Should be able to create multiple cameras without quota restriction
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->actingAs($user, 'sanctum')
                ->postJson('/api/v1/cameras', [
                    'edge_server_id' => $edge->id,
                    'name' => "Camera {$i}",
                    'rtsp_url' => "rtsp://example.com/cam{$i}",
                ]);

            $response->assertStatus(201);
        }
    }
}
