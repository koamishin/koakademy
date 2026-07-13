<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('resources')) {
            return;
        }

        Schema::table('resources', function (Blueprint $table): void {
            if (! Schema::hasColumn('resources', 'file_name')) {
                $table->string('file_name')->nullable();
            }

            if (! Schema::hasColumn('resources', 'disk')) {
                $table->string('disk')->nullable();
            }

            if (! Schema::hasColumn('resources', 'metadata')) {
                $table->json('metadata')->nullable();
            }

            if (Schema::hasColumn('resources', 'name')) {
                $table->string('name')->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        // This normalizes divergent production schemas and is intentionally
        // not reversed because existing resource rows may rely on either shape.
    }
};
