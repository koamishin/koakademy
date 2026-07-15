<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_enrollment', function (Blueprint $table): void {
            $table->string('workflow_runtime', 20)
                ->default('legacy')
                ->after('deduplication_key')
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('student_enrollment', function (Blueprint $table): void {
            $table->dropIndex(['workflow_runtime']);
            $table->dropColumn('workflow_runtime');
        });
    }
};
