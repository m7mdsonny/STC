<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Align ai_modules table with model expectations without dropping data
        if (Schema::hasTable('ai_modules')) {
            Schema::table('ai_modules', function (Blueprint $table) {
                if (!Schema::hasColumn('ai_modules', 'display_name')) {
                    $table->string('display_name')->nullable()->after('name');
                }

                if (!Schema::hasColumn('ai_modules', 'display_name_ar')) {
                    $table->string('display_name_ar')->nullable()->after('display_name');
                }

                if (!Schema::hasColumn('ai_modules', 'description_ar')) {
                    $table->text('description_ar')->nullable()->after('description');
                }

                if (!Schema::hasColumn('ai_modules', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('description_ar');
                }

                if (!Schema::hasColumn('ai_modules', 'deleted_at')) {
                    $table->timestamp('deleted_at')->nullable()->after('updated_at');
                }

                if (!Schema::hasColumn('ai_modules', 'icon')) {
                    $table->string('icon')->nullable()->after('min_resolution');
                }

                if (!Schema::hasColumn('ai_modules', 'display_order')) {
                    $table->integer('display_order')->default(0)->after('icon');
                }
            });

            // Restore module_key as a nullable unique identifier if it was dropped previously
            if (!Schema::hasColumn('ai_modules', 'module_key')) {
                Schema::table('ai_modules', function (Blueprint $table) {
                    $table->string('module_key')->nullable()->unique()->first();
                });
            }

            // Ensure name uniqueness aligns to model comment without dropping data
            $this->ensureUniqueIndex('ai_modules', 'ai_modules_name_unique', ['name']);
        }

        // Harden foreign keys and indexes for organization-scoped tables
        $this->ensureIndexes('edge_servers', ['organization_id', 'license_id']);
        $this->ensureIndexes('licenses', ['organization_id', 'subscription_plan_id', 'edge_server_id']);
        $this->ensureIndexes('ai_module_configs', ['organization_id', 'module_id']);
        $this->ensureIndexes('integrations', ['organization_id', 'edge_server_id']);
        $this->ensureIndexes('notifications', ['organization_id', 'user_id', 'edge_server_id']);
        $this->ensureIndexes('events', ['organization_id', 'edge_server_id']);
    }

    public function down(): void
    {
        if (Schema::hasTable('ai_modules')) {
            Schema::table('ai_modules', function (Blueprint $table) {
                foreach (['display_name', 'display_name_ar', 'description_ar', 'is_active', 'icon', 'display_order'] as $column) {
                    if (Schema::hasColumn('ai_modules', $column)) {
                        $table->dropColumn($column);
                    }
                }

                if (Schema::hasColumn('ai_modules', 'module_key')) {
                    if ($this->indexExists('ai_modules', 'ai_modules_module_key_unique')) {
                        $table->dropUnique('ai_modules_module_key_unique');
                    }

                    $table->dropColumn('module_key');
                }

                if ($this->indexExists('ai_modules', 'ai_modules_name_unique')) {
                    $table->dropUnique('ai_modules_name_unique');
                }

                if (Schema::hasColumn('ai_modules', 'deleted_at')) {
                    $table->dropColumn('deleted_at');
                }
            });
        }

        $this->dropIndexes('edge_servers', ['organization_id', 'license_id']);
        $this->dropIndexes('licenses', ['organization_id', 'subscription_plan_id', 'edge_server_id']);
        $this->dropIndexes('ai_module_configs', ['organization_id', 'module_id']);
        $this->dropIndexes('integrations', ['organization_id', 'edge_server_id']);
        $this->dropIndexes('notifications', ['organization_id', 'user_id', 'edge_server_id']);
        $this->dropIndexes('events', ['organization_id', 'edge_server_id']);
    }

    private function ensureUniqueIndex(string $table, string $indexName, array $columns): void
    {
        if (!$this->indexExists($table, $indexName)) {
            Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                $table->unique($columns, $indexName);
            });
        }
    }

    private function ensureIndexes(string $table, array $columns): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        foreach ($columns as $column) {
            if (Schema::hasColumn($table, $column)) {
                $indexName = $table . '_' . $column . '_index';
                if (!$this->indexExists($table, $indexName)) {
                    Schema::table($table, function (Blueprint $table) use ($column, $indexName) {
                        $table->index($column, $indexName);
                    });
                }
            }
        }
    }

    private function dropIndexes(string $table, array $columns): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        foreach ($columns as $column) {
            $indexName = $table . '_' . $column . '_index';
            if ($this->indexExists($table, $indexName)) {
                Schema::table($table, function (Blueprint $table) use ($indexName) {
                    $table->dropIndex($indexName);
                });
            }
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();
        $prefix = $connection->getTablePrefix();

        $result = DB::select(
            'SELECT COUNT(1) as count FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
            [$database, $prefix . $table, $indexName]
        );

        return !empty($result) && $result[0]->count > 0;
    }
};
