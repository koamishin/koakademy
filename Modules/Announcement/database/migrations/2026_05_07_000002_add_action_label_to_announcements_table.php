<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('announcements')) {
            return;
        }

        if (Schema::hasColumn('announcements', 'action_label')) {
            return;
        }

        Schema::table('announcements', function (Blueprint $table): void {
            $table->string('action_label', 80)->nullable()->after('link');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('announcements')) {
            return;
        }

        if (! Schema::hasColumn('announcements', 'action_label')) {
            return;
        }

        Schema::table('announcements', function (Blueprint $table): void {
            $table->dropColumn('action_label');
        });
    }
};
