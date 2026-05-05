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
        Schema::table('students', function (Blueprint $table): void {
            if (! Schema::hasColumn('students', 'suffix')) {
                $table->string('suffix')->nullable()->after('last_name');
            }

            if (! Schema::hasColumn('students', 'civil_status')) {
                $table->string('civil_status')->nullable()->after('gender');
            }

            if (! Schema::hasColumn('students', 'nationality')) {
                $table->string('nationality')->nullable()->after('civil_status');
            }

            if (! Schema::hasColumn('students', 'religion')) {
                $table->string('religion')->nullable()->after('nationality');
            }

            if (! Schema::hasColumn('students', 'emergency_contact')) {
                $table->string('emergency_contact')->nullable()->after('address');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->dropColumn(['suffix', 'civil_status', 'nationality', 'religion', 'emergency_contact']);
        });
    }
};
