<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('training_datasets')) {
            Schema::create('training_datasets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('ai_module');
                $table->json('label_schema')->nullable();
                $table->integer('sample_count')->default(0);
                $table->integer('labeled_count')->default(0);
                $table->integer('verified_count')->default(0);
                $table->string('environment')->nullable();
                $table->string('version')->nullable();
                $table->string('status')->default('draft');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('training_datasets');
    }
};
