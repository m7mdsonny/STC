<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Models\License;
use App\Models\EdgeServer;
use App\Models\Camera;
use App\Models\Event;
use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EndToEndTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh');
        $this->artisan('db:seed');
    }

    /** @test */
    public function full_flow_from_org_creation_to_event_ingestion()
    {
        // 1. Create subscription plan
        $plan = SubscriptionPlan::create([
            'name' => 'test_plan',
            'name_ar' => 'خطة تجريبية',
            'max_cameras' => 10,
            'max_edge_servers' => 2,
            'is_active' => true,
        ]);

        // 2. Create organization
        $org = Organization::create([
            'name' => 'Test Organization',
            'subscription_plan' => 'test_plan',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('organizations', [
            'id' => $org->id,
            'name' => 'Test Organization',
        ]);

        // 3. Create license
        $license = License::create([
            'organization_id' => $org->id,
            'license_key' => 'TEST-LICENSE-' . uniqid(),
            'status' => 'active',
            'max_cameras' => 10,
        ]);

        $this->assertDatabaseHas('licenses', [
            'id' => $license->id,
            'organization_id' => $org->id,
            'status' => 'active',
        ]);

        // 4. Create organization admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@testorg.com',
            'password' => Hash::make('password123'),
            'organization_id' => $org->id,
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'organization_id' => $org->id,
            'role' => 'admin',
        ]);

        // 5. Login as admin
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@testorg.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertOk()
            ->assertJsonStructure(['token', 'user']);

        $token = $loginResponse->json('token');

        // 6. Create edge server
        $edgeResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/edge-servers', [
                'name' => 'Test Edge Server',
                'license_id' => $license->id,
            ]);

        $edgeResponse->assertCreated()
            ->assertJsonStructure(['id', 'edge_key', 'edge_secret']);

        $edgeId = $edgeResponse->json('id');
        $edgeKey = $edgeResponse->json('edge_key');
        $edgeSecret = $edgeResponse->json('edge_secret');

        $this->assertDatabaseHas('edge_servers', [
            'id' => $edgeId,
            'organization_id' => $org->id,
            'license_id' => $license->id,
        ]);

        // 7. Edge server sends heartbeat with HMAC
        $timestamp = time();
        $body = json_encode([
            'version' => '1.0.0',
            'online' => true,
        ]);
        $bodyHash = hash('sha256', $body);
        $message = "POST|/api/v1/edges/heartbeat|{$timestamp}|{$bodyHash}";
        $signature = hash_hmac('sha256', $message, $edgeSecret);

        $heartbeatResponse = $this->withHeaders([
            'X-EDGE-KEY' => $edgeKey,
            'X-EDGE-TIMESTAMP' => (string) $timestamp,
            'X-EDGE-SIGNATURE' => $signature,
        ])->postJson('/api/v1/edges/heartbeat', [
            'version' => '1.0.0',
            'online' => true,
        ]);

        $heartbeatResponse->assertOk()
            ->assertJsonStructure(['ok', 'edge']);

        // 8. Create camera via admin
        $cameraResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/cameras', [
                'edge_server_id' => $edgeId,
                'name' => 'Test Camera',
                'rtsp_url' => 'rtsp://example.com/camera',
            ]);

        $cameraResponse->assertCreated();
        $cameraId = $cameraResponse->json('id');

        $this->assertDatabaseHas('cameras', [
            'id' => $cameraId,
            'organization_id' => $org->id,
            'edge_server_id' => $edgeId,
        ]);

        // 9. Edge server fetches cameras
        $timestamp = time();
        $body = '';
        $bodyHash = hash('sha256', $body);
        $message = "GET|/api/v1/edges/cameras|{$timestamp}|{$bodyHash}";
        $signature = hash_hmac('sha256', $message, $edgeSecret);

        $camerasResponse = $this->withHeaders([
            'X-EDGE-KEY' => $edgeKey,
            'X-EDGE-TIMESTAMP' => (string) $timestamp,
            'X-EDGE-SIGNATURE' => $signature,
        ])->getJson('/api/v1/edges/cameras');

        $camerasResponse->assertOk()
            ->assertJsonStructure(['cameras', 'count']);

        $this->assertGreaterThanOrEqual(1, $camerasResponse->json('count'));

        // 10. Edge server ingests event
        $eventData = [
            'camera_id' => $cameraResponse->json('camera_id'),
            'event_type' => 'fire_detection',
            'timestamp' => now()->toIso8601String(),
            'confidence' => 0.95,
            'location' => 'Building A',
        ];

        $timestamp = time();
        $body = json_encode($eventData);
        $bodyHash = hash('sha256', $body);
        $message = "POST|/api/v1/edges/events|{$timestamp}|{$bodyHash}";
        $signature = hash_hmac('sha256', $message, $edgeSecret);

        $eventResponse = $this->withHeaders([
            'X-EDGE-KEY' => $edgeKey,
            'X-EDGE-TIMESTAMP' => (string) $timestamp,
            'X-EDGE-SIGNATURE' => $signature,
        ])->postJson('/api/v1/edges/events', $eventData);

        $eventResponse->assertCreated()
            ->assertJsonStructure(['id', 'event_type']);

        $this->assertDatabaseHas('events', [
            'organization_id' => $org->id,
            'edge_server_id' => $edgeId,
            'event_type' => 'fire_detection',
        ]);

        // 11. Admin views dashboard
        $dashboardResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/dashboard/organization');

        $dashboardResponse->assertOk()
            ->assertJsonStructure([
                'total_cameras',
                'total_edge_servers',
                'total_alerts',
            ]);
    }
}
