<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * REMOVES biometric data storage to comply with privacy regulations.
     * face_encoding and plate_encoding columns are removed as they store
     * biometric identifiers that should not be persisted.
     */
    public function up(): void
    {
        // Remove face_encoding from registered_faces
        if (Schema::hasTable('registered_faces')) {
            Schema::table('registered_faces', function (Blueprint $table) {
                if (Schema::hasColumn('registered_faces', 'face_encoding')) {
                    $table->dropColumn('face_encoding');
                }
            });
        }

        // Remove plate_encoding from registered_vehicles
        if (Schema::hasTable('registered_vehicles')) {
            Schema::table('registered_vehicles', function (Blueprint $table) {
                if (Schema::hasColumn('registered_vehicles', 'plate_encoding')) {
                    $table->dropColumn('plate_encoding');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     * 
     * NOTE: This migration does NOT restore biometric data.
     * Once removed, biometric encodings cannot be restored.
     * This is intentional for compliance.
     */
    public function down(): void
    {
        // Do NOT restore biometric columns
        // This is intentional - biometric data should not be stored
        // If you need to restore the columns for testing, create a separate migration
    }
};
