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

        $hasVisibilityScope = Schema::hasColumn('announcements', 'visibility_scope');
        $hasAudienceRoles = Schema::hasColumn('announcements', 'audience_roles');
        $hasDisplayLocations = Schema::hasColumn('announcements', 'display_locations');

        Schema::table('announcements', function (Blueprint $table) use ($hasVisibilityScope, $hasAudienceRoles, $hasDisplayLocations): void {
            if (! $hasVisibilityScope) {
                $table->string('visibility_scope')->default('global')->after('is_global');
            }

            if (! $hasAudienceRoles) {
                $table->json('audience_roles')->nullable()->after('visibility_scope');
            }

            if (! $hasDisplayLocations) {
                $table->json('display_locations')->nullable()->after('audience_roles');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('announcements')) {
            return;
        }

        $hasVisibilityScope = Schema::hasColumn('announcements', 'visibility_scope');
        $hasAudienceRoles = Schema::hasColumn('announcements', 'audience_roles');
        $hasDisplayLocations = Schema::hasColumn('announcements', 'display_locations');

        Schema::table('announcements', function (Blueprint $table) use ($hasVisibilityScope, $hasAudienceRoles, $hasDisplayLocations): void {
            if ($hasDisplayLocations) {
                $table->dropColumn('display_locations');
            }

            if ($hasAudienceRoles) {
                $table->dropColumn('audience_roles');
            }

            if ($hasVisibilityScope) {
                $table->dropColumn('visibility_scope');
            }
        });
    }
};
