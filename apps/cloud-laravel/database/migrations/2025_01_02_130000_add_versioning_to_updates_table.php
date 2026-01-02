<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('updates', function (Blueprint $table) {
            // Version fields (only if columns don't exist)
            if (!Schema::hasColumn('updates', 'version')) {
                $table->string('version')->nullable()->after('title');
            }
            if (!Schema::hasColumn('updates', 'version_type')) {
                $table->enum('version_type', ['major', 'minor', 'patch', 'hotfix'])->nullable()->after('version');
            }
            if (!Schema::hasColumn('updates', 'body') && !Schema::hasColumn('updates', 'release_notes')) {
                $table->text('release_notes')->nullable()->after('body');
            } elseif (!Schema::hasColumn('updates', 'release_notes')) {
                $table->text('release_notes')->nullable();
            }
            if (!Schema::hasColumn('updates', 'changelog')) {
                $table->text('changelog')->nullable();
            }
            if (!Schema::hasColumn('updates', 'affected_modules')) {
                $table->json('affected_modules')->nullable();
            }
            if (!Schema::hasColumn('updates', 'requires_manual_update')) {
                $table->boolean('requires_manual_update')->default(false);
            }
            if (!Schema::hasColumn('updates', 'download_url')) {
                $table->string('download_url')->nullable();
            }
            if (!Schema::hasColumn('updates', 'checksum')) {
                $table->string('checksum')->nullable();
            }
            if (!Schema::hasColumn('updates', 'file_size_mb')) {
                $table->integer('file_size_mb')->nullable();
            }
            if (!Schema::hasColumn('updates', 'release_date')) {
                $table->timestamp('release_date')->nullable();
            }
            if (!Schema::hasColumn('updates', 'end_of_support_date')) {
                $table->timestamp('end_of_support_date')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('updates', function (Blueprint $table) {
            $table->dropColumn([
                'version',
                'version_type',
                'release_notes',
                'changelog',
                'affected_modules',
                'requires_manual_update',
                'download_url',
                'checksum',
                'file_size_mb',
                'release_date',
                'end_of_support_date',
            ]);
        });
    }
};

