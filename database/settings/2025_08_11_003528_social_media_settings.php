<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Exceptions\SettingAlreadyExists;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        foreach (['linkedin', 'whatsapp', 'x', 'facebook', 'instagram', 'tiktok', 'medium', 'youtube', 'github'] as $platform) {
            try {
                $this->migrator->add("social-media.{$platform}", '');
            } catch (SettingAlreadyExists) {
                // Already present from schema dump or earlier run
            }
        }
    }
};
