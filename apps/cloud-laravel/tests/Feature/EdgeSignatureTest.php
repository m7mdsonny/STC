<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\EdgeServer;
use App\Models\License;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EdgeSignatureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh');
        $this->artisan('db:seed');
    }

    /** @test */
    public function heartbeat_requires_valid_hmac_signature()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $license = License::create([
            'organization_id' => $org->id,
            'license_key' => 'test-license',
            'status' => 'active',
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'license_id' => $license->id,
            'edge_id' => 'test-edge',
            'edge_key' => 'test_edge_key_123456789012345678901234567890',
            'edge_secret' => 'test_secret_123456789012345678901234567890123456789012345678901234567890',
            'name' => 'Test Edge',
            'online' => false,
        ]);

        // Request without signature
        $response = $this->postJson('/api/v1/edges/heartbeat', [
            'version' => '1.0.0',
            'online' => true,
        ]);

        $response->assertUnauthorized();
    }

    /** @test */
    public function heartbeat_with_valid_hmac_signature_succeeds()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $license = License::create([
            'organization_id' => $org->id,
            'license_key' => 'test-license',
            'status' => 'active',
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'license_id' => $license->id,
            'edge_id' => 'test-edge',
            'edge_key' => 'test_edge_key_123456789012345678901234567890',
            'edge_secret' => 'test_secret_123456789012345678901234567890123456789012345678901234567890',
            'name' => 'Test Edge',
            'online' => false,
        ]);

        // Generate valid HMAC signature
        $timestamp = time();
        $body = json_encode([
            'version' => '1.0.0',
            'online' => true,
        ]);
        $bodyHash = hash('sha256', $body);
        $message = "POST|/api/v1/edges/heartbeat|{$timestamp}|{$bodyHash}";
        $signature = hash_hmac('sha256', $message, $edge->edge_secret);

        $response = $this->withHeaders([
            'X-EDGE-KEY' => $edge->edge_key,
            'X-EDGE-TIMESTAMP' => (string) $timestamp,
            'X-EDGE-SIGNATURE' => $signature,
        ])->postJson('/api/v1/edges/heartbeat', [
            'version' => '1.0.0',
            'online' => true,
        ]);

        $response->assertOk()
            ->assertJsonStructure(['ok', 'edge']);
    }

    /** @test */
    public function heartbeat_rejects_invalid_signature()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'test-edge',
            'edge_key' => 'test_edge_key_123456789012345678901234567890',
            'edge_secret' => 'test_secret_123456789012345678901234567890123456789012345678901234567890',
            'name' => 'Test Edge',
            'online' => false,
        ]);

        $timestamp = time();
        $body = json_encode(['version' => '1.0.0', 'online' => true]);
        $bodyHash = hash('sha256', $body);
        $message = "POST|/api/v1/edges/heartbeat|{$timestamp}|{$bodyHash}";
        $invalidSignature = hash_hmac('sha256', $message, 'wrong_secret');

        $response = $this->withHeaders([
            'X-EDGE-KEY' => $edge->edge_key,
            'X-EDGE-TIMESTAMP' => (string) $timestamp,
            'X-EDGE-SIGNATURE' => $invalidSignature,
        ])->postJson('/api/v1/edges/heartbeat', [
            'version' => '1.0.0',
            'online' => true,
        ]);

        $response->assertUnauthorized();
    }

    /** @test */
    public function heartbeat_rejects_expired_timestamp()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'test-edge',
            'edge_key' => 'test_edge_key_123456789012345678901234567890',
            'edge_secret' => 'test_secret_123456789012345678901234567890123456789012345678901234567890',
            'name' => 'Test Edge',
            'online' => false,
        ]);

        // Use timestamp from 10 minutes ago (beyond 5-minute window)
        $timestamp = time() - 600;
        $body = json_encode(['version' => '1.0.0', 'online' => true]);
        $bodyHash = hash('sha256', $body);
        $message = "POST|/api/v1/edges/heartbeat|{$timestamp}|{$bodyHash}";
        $signature = hash_hmac('sha256', $message, $edge->edge_secret);

        $response = $this->withHeaders([
            'X-EDGE-KEY' => $edge->edge_key,
            'X-EDGE-TIMESTAMP' => (string) $timestamp,
            'X-EDGE-SIGNATURE' => $signature,
        ])->postJson('/api/v1/edges/heartbeat', [
            'version' => '1.0.0',
            'online' => true,
        ]);

        $response->assertUnauthorized();
    }

    /** @test */
    public function events_endpoint_requires_valid_hmac_signature()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'test-edge',
            'edge_key' => 'test_edge_key_123456789012345678901234567890',
            'edge_secret' => 'test_secret_123456789012345678901234567890123456789012345678901234567890',
            'name' => 'Test Edge',
            'online' => true,
        ]);

        // Request without signature
        $response = $this->postJson('/api/v1/edges/events', [
            'camera_id' => 'cam1',
            'event_type' => 'fire_detection',
            'timestamp' => now()->toIso8601String(),
        ]);

        $response->assertUnauthorized();
    }

    /** @test */
    public function get_cameras_endpoint_requires_valid_hmac_signature()
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'is_active' => true,
        ]);

        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'test-edge',
            'edge_key' => 'test_edge_key_123456789012345678901234567890',
            'edge_secret' => 'test_secret_123456789012345678901234567890123456789012345678901234567890',
            'name' => 'Test Edge',
            'online' => true,
        ]);

        // Request without signature
        $response = $this->getJson('/api/v1/edges/cameras');

        $response->assertUnauthorized();
    }
}
