<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use JsonException;

final class BrandingSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @throws JsonException
     */
    public function run(): void
    {
        $now = now();
        $rows = [];

        foreach ($this->defaultSiteSettings() as $name => $value) {
            $rows[] = [
                'group' => 'site',
                'name' => $name,
                'locked' => false,
                'payload' => json_encode($value, JSON_THROW_ON_ERROR),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('settings')->insertOrIgnore($rows);
    }

    /**
     * @return array<string, string|null>
     */
    private function defaultSiteSettings(): array
    {
        return [
            'name' => 'KoAkademy',
            'description' => 'KoAkademy Administrative System',
            'logo' => '',
            'favicon' => '',
            'og_image' => '',
            'app_name' => 'KoAkademy',
            'app_short_name' => 'KOA',
            'organization_name' => 'KoAkademy',
            'organization_short_name' => 'KOA',
            'organization_address' => '',
            'support_email' => '',
            'support_phone' => '',
            'tagline' => 'Your Campus, Your Connection',
            'copyright_text' => '',
            'theme_color' => '#0f172a',
            'currency' => 'PHP',
            'auth_layout' => 'split',
            'portal_name' => 'KoAkademy',
            'portal_description' => 'KoAkademy portal - manage your classes, students, and schedules',
            'portal_og_image' => '',
        ];
    }
}
