<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Exceptions\SettingAlreadyExists;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $defaults = [
            'app_name' => 'KoAkademy',
            'app_short_name' => 'KOA',
            'organization_name' => 'KoAcademy',
            'organization_short_name' => 'DCCP',
            'organization_address' => '',
            'support_email' => '',
            'support_phone' => '',
            'tagline' => '',
            'copyright_text' => '',
            'theme_color' => '#0f172a',
            'currency' => 'PHP',
        ];

        foreach ($defaults as $key => $value) {
            try {
                $this->migrator->add("site.{$key}", $value);
            } catch (SettingAlreadyExists) {
                // Already present from schema dump or earlier run
            }
        }
    }
};
