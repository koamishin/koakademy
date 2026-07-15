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
        Schema::create('enrollment_policy_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->unsignedSmallInteger('schema_version');
            $table->string('checksum', 64)->unique();
            $table->json('configuration');
            $table->json('source_version_ids');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_policy_snapshots');
    }
};
