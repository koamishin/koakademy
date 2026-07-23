<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_bookmarks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('book_id')->constrained('library_books')->cascadeOnDelete();
            $table->unsignedInteger('page');
            $table->string('label', 100)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'book_id', 'page']);
            $table->index(['user_id', 'book_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('library_bookmarks');
    }
};
