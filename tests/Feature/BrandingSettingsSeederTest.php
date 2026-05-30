<?php

declare(strict_types=1);

use Database\Seeders\BrandingSettingsSeeder;
use Illuminate\Support\Facades\DB;

it('can seed branding settings when auth_layout setting key is missing', function (): void {
    DB::table('settings')
        ->where('group', 'site')
        ->where('name', 'auth_layout')
        ->delete();

    $this->seed(BrandingSettingsSeeder::class);

    $authLayoutSetting = DB::table('settings')
        ->where('group', 'site')
        ->where('name', 'auth_layout')
        ->first();

    expect($authLayoutSetting)->not->toBeNull();
});
