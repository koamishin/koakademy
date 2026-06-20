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
        if (Schema::hasTable('faculty_deadlines')) {
            return;
        }

        Schema::create('faculty_deadlines', function (Blueprint $table): void {
            $table->id();
            $table->string('faculty_id');
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('due_date');
            $table->string('priority')->default('medium');
            $table->string('type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('faculty_id')->references('id')->on('faculty')->cascadeOnDelete();
            $table->index(['faculty_id', 'due_date']);
            $table->index(['is_active', 'priority']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faculty_deadlines');
    }
};
