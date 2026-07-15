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
        Schema::table('enrollment_policies', function (Blueprint $table): void {
            $table->unsignedBigInteger('active_version_id')->nullable()->index();
            $table->foreign('active_version_id')
                ->references('id')
                ->on('enrollment_policy_versions')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollment_policies', function (Blueprint $table): void {
            $table->dropForeign(['active_version_id']);
            $table->dropColumn('active_version_id');
        });
    }
};
