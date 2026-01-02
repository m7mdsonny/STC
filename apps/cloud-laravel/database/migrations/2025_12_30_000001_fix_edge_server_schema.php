<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fix licenses.edge_server_id to be a proper foreign key
        if (Schema::hasTable('licenses')) {
            Schema::table('licenses', function (Blueprint $table) {
                // Check if column exists and is string type
                if (Schema::hasColumn('licenses', 'edge_server_id')) {
                    // Drop the old string column if it exists
                    $table->dropColumn('edge_server_id');
                }
            });
            
            Schema::table('licenses', function (Blueprint $table) {
                // Add proper foreign key
                $table->foreignId('edge_server_id')->nullable()->after('status')->constrained('edge_servers')->nullOnDelete();
            });
        }

        // Add IP address fields to edge_servers
        if (Schema::hasTable('edge_servers')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                if (!Schema::hasColumn('edge_servers', 'internal_ip')) {
                    $table->string('internal_ip')->nullable()->after('ip_address');
                }
                if (!Schema::hasColumn('edge_servers', 'public_ip')) {
                    $table->string('public_ip')->nullable()->after('internal_ip');
                }
                if (!Schema::hasColumn('edge_servers', 'hostname')) {
                    $table->string('hostname')->nullable()->after('public_ip');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('edge_servers')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                if (Schema::hasColumn('edge_servers', 'hostname')) {
                    $table->dropColumn('hostname');
                }
                if (Schema::hasColumn('edge_servers', 'public_ip')) {
                    $table->dropColumn('public_ip');
                }
                if (Schema::hasColumn('edge_servers', 'internal_ip')) {
                    $table->dropColumn('internal_ip');
                }
            });
        }

        if (Schema::hasTable('licenses')) {
            Schema::table('licenses', function (Blueprint $table) {
                if (Schema::hasColumn('licenses', 'edge_server_id')) {
                    $table->dropForeign(['edge_server_id']);
                    $table->dropColumn('edge_server_id');
                }
            });
            
            Schema::table('licenses', function (Blueprint $table) {
                $table->string('edge_server_id')->nullable();
            });
        }
    }
};
