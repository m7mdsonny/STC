<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add registered_face_id column if it doesn't exist
        if (!Schema::hasColumn('events', 'registered_face_id')) {
            Schema::table('events', function (Blueprint $table) {
                $table->foreignId('registered_face_id')->nullable()->after('edge_server_id')
                    ->constrained('registered_faces')->nullOnDelete();
            });
        }

        // Add registered_vehicle_id column if it doesn't exist
        if (!Schema::hasColumn('events', 'registered_vehicle_id')) {
            Schema::table('events', function (Blueprint $table) {
                $table->foreignId('registered_vehicle_id')->nullable()->after('registered_face_id')
                    ->constrained('registered_vehicles')->nullOnDelete();
            });
        }

        // Add indexes if columns exist (wrap in try-catch to handle if index already exists)
        if (Schema::hasColumn('events', 'registered_face_id')) {
            try {
                Schema::table('events', function (Blueprint $table) {
                    $table->index('registered_face_id');
                });
            } catch (\Exception $e) {
                // Index might already exist, ignore
            }
        }

        if (Schema::hasColumn('events', 'registered_vehicle_id')) {
            try {
                Schema::table('events', function (Blueprint $table) {
                    $table->index('registered_vehicle_id');
                });
            } catch (\Exception $e) {
                // Index might already exist, ignore
            }
        }
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['registered_face_id']);
            $table->dropForeign(['registered_vehicle_id']);
            $table->dropIndex(['registered_face_id']);
            $table->dropIndex(['registered_vehicle_id']);
            $table->dropColumn(['registered_face_id', 'registered_vehicle_id']);
        });
    }
};

