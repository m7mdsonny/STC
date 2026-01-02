<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('platform_wordings')) {
            Schema::create('platform_wordings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->string('label')->nullable();
                $table->text('value_ar')->nullable();
                $table->text('value_en')->nullable();
                $table->string('category')->default('general');
                $table->string('context')->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_customizable')->default(true);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        if (!Schema::hasTable('organization_wordings')) {
            Schema::create('organization_wordings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->constrained('organizations')->onDelete('cascade');
                $table->foreignId('wording_id')->constrained('platform_wordings')->onDelete('cascade');
                $table->text('custom_value_ar')->nullable();
                $table->text('custom_value_en')->nullable();
                $table->timestamps();
                $table->unique(['organization_id', 'wording_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_wordings');
        Schema::dropIfExists('platform_wordings');
    }
};

