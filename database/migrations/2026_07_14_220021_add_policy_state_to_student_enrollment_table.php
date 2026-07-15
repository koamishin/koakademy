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
        Schema::table('student_enrollment', function (Blueprint $table): void {
            $table->foreignId('enrollment_policy_snapshot_id')
                ->nullable()
                ->after('school_id')
                ->constrained()
                ->nullOnDelete();
            $table->string('current_step_key')->nullable()->after('status')->index();
            $table->string('terminal_outcome', 32)->nullable()->after('current_step_key')->index();
            $table->string('deduplication_key', 64)->nullable()->after('terminal_outcome')->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_enrollment', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('enrollment_policy_snapshot_id');
            $table->dropColumn(['current_step_key', 'terminal_outcome', 'deduplication_key']);
        });
    }
};
