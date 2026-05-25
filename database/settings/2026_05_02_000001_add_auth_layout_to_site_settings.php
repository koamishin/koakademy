<?php

declare(strict_types=1);

use Illuminate\Support\Facades\DB;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        if (DB::table('settings')
            ->where('group', 'site')
            ->where('name', 'auth_layout')
            ->exists()) {
            return;
        }

        $this->migrator->add('site.auth_layout', 'split');
    }
};
