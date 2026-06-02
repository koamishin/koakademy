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
        Schema::table('subject_enrollments', function (Blueprint $blueprint): void {
            $blueprint->boolean('exclude_from_tuition')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subject_enrollments', function (Blueprint $blueprint): void {
            $blueprint->dropColumn('exclude_from_tuition');
        });
    }
};
