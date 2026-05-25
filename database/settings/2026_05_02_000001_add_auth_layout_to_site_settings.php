<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Exceptions\SettingAlreadyExists;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        try {
            $this->migrator->add('site.auth_layout', 'split');
        } catch (SettingAlreadyExists) {
            // Already present from an earlier bootstrapping path.
        }
    }
};
