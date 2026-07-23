<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('library_books', function (Blueprint $table) {
            $table->string('call_number')->nullable()->after('isbn');
            $table->string('accession_number')->nullable()->after('call_number');
        });
    }

    public function down(): void
    {
        Schema::table('library_books', function (Blueprint $table) {
            $table->dropColumn(['call_number', 'accession_number']);
        });
    }
};
