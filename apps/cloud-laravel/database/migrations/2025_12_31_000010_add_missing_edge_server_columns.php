<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('edge_servers')) {
            return;
        }

        Schema::table('edge_servers', function (Blueprint $table) {
            if (!Schema::hasColumn('edge_servers', 'edge_key')) {
                $table->string('edge_key')->unique()->nullable()->after('edge_id');
            }

            if (!Schema::hasColumn('edge_servers', 'edge_secret')) {
                $table->string('edge_secret')->nullable()->after('edge_key');
            }

            if (!Schema::hasColumn('edge_servers', 'secret_delivered_at')) {
                $table->timestamp('secret_delivered_at')->nullable()->after('edge_secret');
            }

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

    public function down(): void
    {
        if (!Schema::hasTable('edge_servers')) {
            return;
        }

        Schema::table('edge_servers', function (Blueprint $table) {
            foreach (['hostname', 'public_ip', 'internal_ip', 'secret_delivered_at', 'edge_secret', 'edge_key'] as $column) {
                if (Schema::hasColumn('edge_servers', $column)) {
                    if ($column === 'edge_key' && Schema::hasColumn('edge_servers', 'edge_key')) {
                        $table->dropUnique('edge_servers_edge_key_unique');
                    }

                    $table->dropColumn($column);
                }
            }
        });
    }
};
