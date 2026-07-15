<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('enrollment_policy_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('enrollment_policy_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->string('state', 20)->default('draft');
            $table->unsignedSmallInteger('schema_version')->default(1);
            $table->json('configuration');
            $table->string('checksum', 64)->nullable();
            $table->text('change_notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['enrollment_policy_id', 'version']);
            $table->index(['enrollment_policy_id', 'state', 'published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_policy_versions');
    }
};
