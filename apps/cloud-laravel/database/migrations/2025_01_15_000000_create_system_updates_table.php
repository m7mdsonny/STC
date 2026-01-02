<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_updates')) {
            Schema::create('system_updates', function (Blueprint $table) {
                $table->id();
                $table->string('version')->unique();
                $table->string('update_id')->unique(); // Folder name in updates/
                $table->json('manifest'); // Full manifest.json content (MySQL compatible)
                $table->enum('status', ['pending', 'installing', 'installed', 'failed', 'rollback'])->default('pending');
                $table->string('backup_id')->nullable(); // Backup identifier for rollback
                $table->timestamp('installed_at')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Add key/value columns to system_settings if they don't exist
        if (Schema::hasTable('system_settings')) {
            if (!Schema::hasColumn('system_settings', 'key')) {
                Schema::table('system_settings', function (Blueprint $table) {
                    $table->string('key')->nullable()->unique()->after('id');
                });
            }
            if (!Schema::hasColumn('system_settings', 'value')) {
                Schema::table('system_settings', function (Blueprint $table) {
                    $table->text('value')->nullable()->after('key');
                });
            }
            
            // Insert initial version if it doesn't exist
            $existingVersion = DB::table('system_settings')
                ->where('key', 'system_version')
                ->first();
            
            if (!$existingVersion) {
                DB::table('system_settings')->insert([
                    'key' => 'system_version',
                    'value' => '1.0.0',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_updates');
    }
};

