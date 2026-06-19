<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Exceptions\SettingAlreadyExists;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        try {
            $this->migrator->add('site.default_country_code', '+63');
        } catch (SettingAlreadyExists) {
            // Already present from schema dump or earlier run.
        }
    }
};
