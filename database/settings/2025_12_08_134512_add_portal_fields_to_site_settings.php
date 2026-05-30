<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Exceptions\SettingAlreadyExists;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $defaults = [
            'portal_name' => 'DCCP Faculty Portal',
            'portal_description' => 'Divine Child Catholic Parish Faculty Portal - Manage your classes, students, and schedules',
            'portal_og_image' => '',
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
