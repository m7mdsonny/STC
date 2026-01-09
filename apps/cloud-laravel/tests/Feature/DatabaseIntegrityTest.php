<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Organization;
use App\Models\User;
use App\Models\License;
use App\Models\EdgeServer;
use App\Models\Camera;
use App\Models\Event;
use App\Models\EdgeServerLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\WithFaker;

class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test foreign key integrity
     */
    public function test_foreign_key_integrity(): void
    {
        // Create organization
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'max_cameras' => 10,
            'max_edge_servers' => 2,
        ]);
        
        // Create license with organization_id
        $license = License::create([
            'organization_id' => $org->id,
            'license_key' => 'TEST-KEY-' . uniqid(),
            'plan' => 'basic',
            'status' => 'active',
            'max_cameras' => 10,
        ]);
        
        // Verify FK constraint works
        $this->assertEquals($org->id, $license->organization_id);
        
        // Create edge server with organization_id
        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'license_id' => $license->id,
            'edge_id' => 'TEST-EDGE-' . uniqid(),
            'name' => 'Test Edge',
        ]);
        
        $this->assertEquals($org->id, $edge->organization_id);
        $this->assertEquals($license->id, $edge->license_id);
        
        // Create camera with organization_id and edge_server_id
        $camera = Camera::create([
            'organization_id' => $org->id,
            'edge_server_id' => $edge->id,
            'camera_id' => 'TEST-CAM-' . uniqid(),
            'name' => 'Test Camera',
            'status' => 'offline',
        ]);
        
        $this->assertEquals($org->id, $camera->organization_id);
        $this->assertEquals($edge->id, $camera->edge_server_id);
    }

    /**
     * Test cascade delete behavior
     */
    public function test_cascade_delete_organization(): void
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'max_cameras' => 10,
            'max_edge_servers' => 2,
        ]);
        
        $license = License::create([
            'organization_id' => $org->id,
            'license_key' => 'TEST-KEY-' . uniqid(),
            'plan' => 'basic',
            'status' => 'active',
            'max_cameras' => 10,
        ]);
        
        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'TEST-EDGE-' . uniqid(),
            'name' => 'Test Edge',
        ]);
        
        $camera = Camera::create([
            'organization_id' => $org->id,
            'edge_server_id' => $edge->id,
            'camera_id' => 'TEST-CAM-' . uniqid(),
            'name' => 'Test Camera',
            'status' => 'offline',
        ]);
        
        $log = EdgeServerLog::create([
            'edge_server_id' => $edge->id,
            'organization_id' => $org->id,
            'level' => 'info',
            'message' => 'Test log',
        ]);
        
        // Delete organization
        $org->delete();
        
        // Verify cascade delete
        $this->assertDatabaseMissing('licenses', ['id' => $license->id]);
        $this->assertDatabaseMissing('edge_servers', ['id' => $edge->id]);
        $this->assertDatabaseMissing('cameras', ['id' => $camera->id]);
        $this->assertDatabaseMissing('edge_server_logs', ['id' => $log->id]);
    }

    /**
     * Test orphan prevention - organization_id NOT NULL
     */
    public function test_orphan_prevention(): void
    {
        // Try to create edge server without organization_id (should fail)
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        EdgeServer::create([
            'edge_id' => 'TEST-EDGE-' . uniqid(),
            'name' => 'Test Edge',
            'organization_id' => null, // Should fail - NOT NULL constraint
        ]);
    }

    /**
     * Test tenant isolation at DB level
     */
    public function test_tenant_isolation_not_null(): void
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'max_cameras' => 10,
            'max_edge_servers' => 2,
        ]);
        
        // All tenant tables must have organization_id NOT NULL
        $license = License::create([
            'organization_id' => $org->id,
            'license_key' => 'TEST-KEY-' . uniqid(),
            'plan' => 'basic',
            'status' => 'active',
            'max_cameras' => 10,
        ]);
        $this->assertNotNull($license->organization_id);
        
        $edge = EdgeServer::create([
            'organization_id' => $org->id,
            'edge_id' => 'TEST-EDGE-' . uniqid(),
            'name' => 'Test Edge',
        ]);
        $this->assertNotNull($edge->organization_id);
        
        $camera = Camera::create([
            'organization_id' => $org->id,
            'camera_id' => 'TEST-CAM-' . uniqid(),
            'name' => 'Test Camera',
            'status' => 'offline',
        ]);
        $this->assertNotNull($camera->organization_id);
        
        $log = EdgeServerLog::create([
            'edge_server_id' => $edge->id,
            'organization_id' => $org->id,
            'level' => 'info',
            'message' => 'Test log',
        ]);
        $this->assertNotNull($log->organization_id);
    }

    /**
     * Test unique constraints
     */
    public function test_unique_constraints(): void
    {
        $org = Organization::create([
            'name' => 'Test Org',
            'subscription_plan' => 'basic',
            'max_cameras' => 10,
            'max_edge_servers' => 2,
        ]);
        
        // Test license_key unique
        $license1 = License::create([
            'organization_id' => $org->id,
            'license_key' => 'TEST-KEY-123',
            'plan' => 'basic',
            'status' => 'active',
            'max_cameras' => 10,
        ]);
        
        $this->expectException(\Illuminate\Database\QueryException::class);
        
        License::create([
            'organization_id' => $org->id,
            'license_key' => 'TEST-KEY-123', // Duplicate - should fail
            'plan' => 'basic',
            'status' => 'active',
            'max_cameras' => 10,
        ]);
    }

    /**
     * Test indexes exist for performance
     */
    public function test_indexes_exist(): void
    {
        // Run migrations first
        $this->artisan('migrate');
        
        $indexes = DB::select("SHOW INDEXES FROM licenses WHERE Key_name != 'PRIMARY'");
        $indexNames = array_column($indexes, 'Key_name');
        
        $this->assertContains('licenses_organization_id_index', $indexNames);
        $this->assertContains('licenses_status_index', $indexNames);
        
        $edgeIndexes = DB::select("SHOW INDEXES FROM edge_servers WHERE Key_name != 'PRIMARY'");
        $edgeIndexNames = array_column($edgeIndexes, 'Key_name');
        
        $this->assertContains('edge_servers_organization_id_index', $edgeIndexNames);
        $this->assertContains('edge_servers_license_id_index', $edgeIndexNames);
    }
}
