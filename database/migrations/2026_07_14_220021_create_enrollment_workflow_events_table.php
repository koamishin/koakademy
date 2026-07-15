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
        Schema::create('enrollment_workflow_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_enrollment_id')->constrained('student_enrollment')->cascadeOnDelete();
            $table->foreignId('enrollment_policy_snapshot_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 40);
            $table->string('from_step_key')->nullable();
            $table->string('to_step_key')->nullable();
            $table->string('status')->nullable();
            $table->string('terminal_outcome', 32)->nullable();
            $table->string('idempotency_key', 96)->nullable()->unique();
            $table->text('reason')->nullable();
            $table->json('result')->nullable();
            $table->timestamps();

            $table->index(['student_enrollment_id', 'created_at']);
            $table->index(['event_type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_workflow_events');
    }
};
