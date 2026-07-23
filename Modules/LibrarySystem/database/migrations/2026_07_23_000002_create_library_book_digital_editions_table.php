<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_book_digital_editions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('book_id')->unique()->constrained('library_books')->cascadeOnDelete();
            $table->string('disk');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 100)->default('application/pdf');
            $table->unsignedBigInteger('size_bytes');
            $table->string('sha256', 64);
            $table->string('status', 20)->default('draft');
            $table->boolean('downloads_allowed')->default(false);
            $table->string('rights_basis', 40)->nullable();
            $table->string('rights_holder')->nullable();
            $table->string('license_url', 2048)->nullable();
            $table->text('rights_notes')->nullable();
            $table->timestamp('rights_expires_at')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('uploaded_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('rights_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rights_confirmed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'rights_expires_at'], 'library_digital_editions_access_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('library_book_digital_editions');
    }
};
