<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('shs_students')) {
            return;
        }

        Schema::create('shs_students', function (Blueprint $table): void {
            $table->id();
            $table->string('student_lrn', 20)->unique();
            $table->string('fullname');
            $table->string('civil_status')->nullable();
            $table->string('religion')->nullable();
            $table->string('nationality')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_contact')->nullable();
            $table->string('student_contact')->nullable();
            $table->text('complete_address')->nullable();
            $table->string('grade_level')->nullable();
            $table->string('gender')->nullable();
            $table->string('email')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('strand_id')->nullable()->constrained('shs_strands')->nullOnDelete();
            $table->foreignId('track_id')->nullable()->constrained('shs_tracks')->nullOnDelete();
            $table->foreignId('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shs_students');
    }
};
