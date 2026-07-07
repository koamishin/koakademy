<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_schedule_changes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('old_schedule');
            $table->json('new_schedule');
            $table->timestamps();

            $table->index(['class_id', 'created_at']);
        });

        Schema::create('class_schedule_change_student_notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('class_schedule_change_id')
                ->constrained('class_schedule_changes')
                ->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email')->nullable();
            $table->timestamp('notified_at')->nullable();
            $table->foreignId('notified_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['class_schedule_change_id', 'student_id'], 'class_schedule_change_student_unique');
            $table->index(['student_id', 'notified_at'], 'class_schedule_change_student_pending_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_schedule_change_student_notifications');
        Schema::dropIfExists('class_schedule_changes');
    }
};
