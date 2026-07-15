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
        Schema::create('enrollment_policies', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('scope_key')->unique();
            $table->foreignId('school_id')->nullable()->constrained()->nullOnDelete();
            $table->string('student_type')->nullable();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('school_year')->nullable();
            $table->unsignedTinyInteger('semester')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(
                ['is_enabled', 'school_id', 'student_type', 'course_id', 'school_year', 'semester'],
                'enrollment_policies_resolution_index',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_policies');
    }
};
