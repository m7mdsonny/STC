<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add organization_id to edge_server_logs for tenant isolation
        if (Schema::hasTable('edge_server_logs')) {
            Schema::table('edge_server_logs', function (Blueprint $table) {
                if (!Schema::hasColumn('edge_server_logs', 'organization_id')) {
                    // First add the column as nullable
                    $table->foreignId('organization_id')->nullable()->after('id');
                }
            });
            
            // Populate existing records by deriving from edge_server
            DB::statement('
                UPDATE edge_server_logs esl
                INNER JOIN edge_servers es ON esl.edge_server_id = es.id
                SET esl.organization_id = es.organization_id
                WHERE esl.organization_id IS NULL
            ');
            
            // Now make it NOT NULL and add foreign key
            Schema::table('edge_server_logs', function (Blueprint $table) {
                if (Schema::hasColumn('edge_server_logs', 'organization_id')) {
                    // Modify column to NOT NULL
                    DB::statement('ALTER TABLE edge_server_logs MODIFY organization_id BIGINT UNSIGNED NOT NULL');
                    
                    // Add foreign key constraint
                    $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
                    $table->index('organization_id');
                }
            });
        }

        // Add edge_key and edge_secret to edge_servers for HMAC authentication
        if (Schema::hasTable('edge_servers')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                if (!Schema::hasColumn('edge_servers', 'edge_key')) {
                    $table->string('edge_key')->unique()->nullable()->after('edge_id');
                }
                if (!Schema::hasColumn('edge_servers', 'edge_secret')) {
                    $table->string('edge_secret')->nullable()->after('edge_key');
                }
            });
        }

        // Ensure events.organization_id is NOT NULL (derive from edge_server if null)
        if (Schema::hasTable('events')) {
            // First populate null organization_id from edge_server
            DB::statement('
                UPDATE events e
                INNER JOIN edge_servers es ON e.edge_server_id = es.id
                SET e.organization_id = es.organization_id
                WHERE e.organization_id IS NULL AND e.edge_server_id IS NOT NULL
            ');
            
            // For events without edge_server, we can't enforce NOT NULL
            // But we'll add an index for performance
            Schema::table('events', function (Blueprint $table) {
                if (!Schema::hasIndex('events', 'events_organization_id_index')) {
                    $table->index('organization_id');
                }
                if (!Schema::hasIndex('events', 'events_edge_server_id_index')) {
                    $table->index('edge_server_id');
                }
                if (!Schema::hasIndex('events', 'events_occurred_at_index')) {
                    $table->index('occurred_at');
                }
            });
        }

        // Add missing indexes for performance
        if (Schema::hasTable('edge_servers')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                if (!Schema::hasIndex('edge_servers', 'edge_servers_organization_id_index')) {
                    $table->index('organization_id');
                }
                if (!Schema::hasIndex('edge_servers', 'edge_servers_license_id_index')) {
                    $table->index('license_id');
                }
                if (!Schema::hasIndex('edge_servers', 'edge_servers_online_index')) {
                    $table->index('online');
                }
                if (!Schema::hasIndex('edge_servers', 'edge_servers_last_seen_at_index')) {
                    $table->index('last_seen_at');
                }
            });
        }

        if (Schema::hasTable('licenses')) {
            Schema::table('licenses', function (Blueprint $table) {
                if (!Schema::hasIndex('licenses', 'licenses_organization_id_index')) {
                    $table->index('organization_id');
                }
                if (!Schema::hasIndex('licenses', 'licenses_status_index')) {
                    $table->index('status');
                }
                if (!Schema::hasIndex('licenses', 'licenses_edge_server_id_index')) {
                    $table->index('edge_server_id');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasIndex('users', 'users_organization_id_index')) {
                    $table->index('organization_id');
                }
                if (!Schema::hasIndex('users', 'users_role_index')) {
                    $table->index('role');
                }
                if (!Schema::hasIndex('users', 'users_is_active_index')) {
                    $table->index('is_active');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('edge_server_logs')) {
            Schema::table('edge_server_logs', function (Blueprint $table) {
                if (Schema::hasColumn('edge_server_logs', 'organization_id')) {
                    $table->dropForeign(['organization_id']);
                    $table->dropIndex(['organization_id']);
                    $table->dropColumn('organization_id');
                }
            });
        }

        if (Schema::hasTable('edge_servers')) {
            Schema::table('edge_servers', function (Blueprint $table) {
                if (Schema::hasColumn('edge_servers', 'edge_secret')) {
                    $table->dropColumn('edge_secret');
                }
                if (Schema::hasColumn('edge_servers', 'edge_key')) {
                    $table->dropUnique(['edge_key']);
                    $table->dropColumn('edge_key');
                }
            });
        }
    }
};
