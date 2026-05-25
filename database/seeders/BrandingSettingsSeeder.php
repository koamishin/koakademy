<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class BrandingSettingsSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('settings')->updateOrInsert(
            [
                'group' => 'site',
                'name' => 'auth_layout',
            ],
            [
                'payload' => json_encode('split', JSON_THROW_ON_ERROR),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        /** @var SiteSettings $settings */
        $settings = app(SiteSettings::class);

        // Only set if not already set
        if (! $settings->app_name) {
            $settings->app_name = 'KoAkademy';
        }

        DB::table('settings')->insertOrIgnore($rows);
    }

        if (! $settings->organization_name) {
            $settings->organization_name = 'KoAkademy';
        }

        if (! $settings->organization_short_name) {
            $settings->organization_short_name = 'KOA';
        }

        if (! $settings->tagline) {
            $settings->tagline = 'Your Campus, Your Connection';
        }

        if (! $settings->theme_color) {
            $settings->theme_color = '#0f172a';
        }

        if (! $settings->currency) {
            $settings->currency = 'PHP';
        }

        if (! $settings->auth_layout) {
            $settings->auth_layout = 'split';
        }

        $settings->save();
    }
}
