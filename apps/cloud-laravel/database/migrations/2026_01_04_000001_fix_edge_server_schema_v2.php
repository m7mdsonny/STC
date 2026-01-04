<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('licenses')) {
            return;
        }

        $database = DB::getDatabaseName();

        // Drop any foreign keys that still reference edge_server_id (ghost or otherwise)
        $foreignKeys = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', 'licenses')
            ->where('COLUMN_NAME', 'edge_server_id')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->pluck('CONSTRAINT_NAME')
            ->unique()
            ->all();

        foreach ($foreignKeys as $constraint) {
            try {
                Schema::table('licenses', function (Blueprint $table) use ($constraint) {
                    $table->dropForeign($constraint);
                });
            } catch (\Throwable $e) {
                // Ignore drop failures on MariaDB ghost constraints
            }
        }

        // Drop any indexes on edge_server_id regardless of their generated name
        $indexes = DB::table('information_schema.STATISTICS')
            ->select('INDEX_NAME')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', 'licenses')
            ->where('COLUMN_NAME', 'edge_server_id')
            ->pluck('INDEX_NAME')
            ->unique()
            ->all();

        foreach ($indexes as $index) {
            if ($index === 'PRIMARY') {
                continue;
            }

            try {
                DB::statement(sprintf('ALTER TABLE `licenses` DROP INDEX `%s`', $index));
            } catch (\Throwable $e) {
                // Ignore drop failures caused by ghost metadata
            }
        }

        $columnExists = Schema::hasColumn('licenses', 'edge_server_id');

        if (!$columnExists) {
            Schema::table('licenses', function (Blueprint $table) {
                $table->unsignedBigInteger('edge_server_id')->nullable()->after('status');
            });
        } else {
            $column = DB::table('information_schema.COLUMNS')
                ->select('COLUMN_TYPE', 'IS_NULLABLE')
                ->where('TABLE_SCHEMA', $database)
                ->where('TABLE_NAME', 'licenses')
                ->where('COLUMN_NAME', 'edge_server_id')
                ->first();

            $needsAlter = !$column
                || stripos($column->COLUMN_TYPE, 'bigint') === false
                || stripos($column->COLUMN_TYPE, 'unsigned') === false
                || $column->IS_NULLABLE !== 'YES';

            if ($needsAlter) {
                DB::statement('ALTER TABLE `licenses` MODIFY COLUMN `edge_server_id` BIGINT UNSIGNED NULL');
            }
        }

        $hasForeign = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', 'licenses')
            ->where('COLUMN_NAME', 'edge_server_id')
            ->where('REFERENCED_TABLE_NAME', 'edge_servers')
            ->exists();

        if (!$hasForeign && Schema::hasTable('edge_servers')) {
            Schema::table('licenses', function (Blueprint $table) {
                $table->foreign('edge_server_id')->references('id')->on('edge_servers')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('licenses')) {
            return;
        }

        $database = DB::getDatabaseName();

        $foreignKeys = DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', $database)
            ->where('TABLE_NAME', 'licenses')
            ->where('COLUMN_NAME', 'edge_server_id')
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->pluck('CONSTRAINT_NAME')
            ->unique()
            ->all();

        foreach ($foreignKeys as $constraint) {
            try {
                Schema::table('licenses', function (Blueprint $table) use ($constraint) {
                    $table->dropForeign($constraint);
                });
            } catch (\Throwable $e) {
                // Best-effort cleanup only
            }
        }

        try {
            DB::statement('ALTER TABLE `licenses` MODIFY COLUMN `edge_server_id` VARCHAR(255) NULL');
        } catch (\Throwable $e) {
            // Leave column as-is if downgrade is unsafe
        }
    }
};
