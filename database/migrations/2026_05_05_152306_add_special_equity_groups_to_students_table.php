<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            if (! Schema::hasColumn('students', 'is_pwd')) {
                $table->boolean('is_pwd')->default(false)->after('indigenous_group');
            }

            if (! Schema::hasColumn('students', 'pwd_type')) {
                $table->string('pwd_type')->nullable()->after('is_pwd');
            }

            if (! Schema::hasColumn('students', 'is_solo_parent')) {
                $table->boolean('is_solo_parent')->default(false)->after('pwd_type');
            }

            if (! Schema::hasColumn('students', 'is_senior_citizen')) {
                $table->boolean('is_senior_citizen')->default(false)->after('is_solo_parent');
            }

            if (! Schema::hasColumn('students', 'is_magna_carta')) {
                $table->boolean('is_magna_carta')->default(false)->after('is_senior_citizen');
            }

            if (! Schema::hasColumn('students', 'is_underprivileged')) {
                $table->boolean('is_underprivileged')->default(false)->after('is_magna_carta');
            }

            if (! Schema::hasColumn('students', 'is_first_generation')) {
                $table->boolean('is_first_generation')->default(false)->after('is_underprivileged');
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->dropColumn([
                'is_pwd',
                'pwd_type',
                'is_solo_parent',
                'is_senior_citizen',
                'is_magna_carta',
                'is_underprivileged',
                'is_first_generation',
            ]);
        });
    }
};
