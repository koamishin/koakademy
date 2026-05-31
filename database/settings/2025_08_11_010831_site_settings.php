<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Exceptions\SettingAlreadyExists;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $defaults = [
            'name' => 'Filament & Inertia Starter Kit',
            'description' => 'The skeleton application for the Laravel framework with RILT stack and Filament v4 as Admin Panel.',
            'logo' => '',
            'favicon' => '',
            'og_image' => '',
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
