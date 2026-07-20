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
            $table->timestamp('privacy_consent_at')->nullable()->after('contacts');
            $table->boolean('marketing_consent')->default(false)->after('privacy_consent_at');
            $table->timestamp('marketing_consent_at')->nullable()->after('marketing_consent');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table): void {
            $table->dropColumn([
                'privacy_consent_at',
                'marketing_consent',
                'marketing_consent_at',
            ]);
        });
    }
};
