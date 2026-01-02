<?php

namespace Tests\Feature;

use App\Models\SystemBackup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SystemBackupControllerTest extends TestCase
{
    use RefreshDatabase;

    protected string $dbPath;

    protected function setUp(): void
    {
        $this->dbPath = storage_path('framework/testing.sqlite');
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => $this->dbPath,
        ]);

        if (!is_dir(dirname($this->dbPath))) {
            mkdir(dirname($this->dbPath), 0777, true);
        }

        parent::setUp();

        if (!file_exists($this->dbPath)) {
            touch($this->dbPath);
        }
    }

    public function test_super_admin_can_create_download_and_restore_backups()
    {
        Storage::fake('local');
        $admin = $this->createSuperAdmin();

        $create = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/backups');
        $create->assertCreated();
        $backupId = $create->json('id');
        $path = $create->json('file_path');

        Storage::disk('local')->assertExists($path);
        $this->assertDatabaseHas('system_backups', [
            'id' => $backupId,
            'status' => 'completed',
            'created_by' => $admin->id,
        ]);

        $download = $this->actingAs($admin, 'sanctum')->get("/api/v1/backups/{$backupId}/download");
        $download->assertOk();

        $newUser = User::create([
            'name' => 'Temp User',
            'email' => 'temp@example.com',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('users', ['email' => $newUser->email]);

        $restore = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/backups/{$backupId}/restore");
        $restore->assertOk()->assertJson(['message' => 'Database restored successfully']);

        $this->assertDatabaseMissing('users', ['email' => $newUser->email]);
        $this->assertEquals('restored', SystemBackup::find($backupId)->status);
    }

    protected function createSuperAdmin(): User
    {
        return User::create([
            'name' => 'Root Admin',
            'email' => 'root@example.com',
            'password' => Hash::make('secret123'),
            'is_active' => true,
            'role' => 'super_admin',
        ]);
    }
}
