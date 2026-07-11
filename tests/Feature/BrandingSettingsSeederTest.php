<?php

declare(strict_types=1);

use Database\Seeders\BrandingSettingsSeeder;
use Illuminate\Support\Facades\DB;

it('can seed branding settings when required setting keys are missing', function (): void {
    DB::table('settings')
        ->where('group', 'site')
        ->whereIn('name', ['auth_layout', 'default_country_code'])
        ->delete();

    $this->seed(BrandingSettingsSeeder::class);

    $authLayoutSetting = DB::table('settings')
        ->where('group', 'site')
        ->where('name', 'auth_layout')
        ->first();

    $defaultCountryCodeSetting = DB::table('settings')
        ->where('group', 'site')
        ->where('name', 'default_country_code')
        ->first();

    expect($authLayoutSetting)->not->toBeNull()
        ->and($defaultCountryCodeSetting)->not->toBeNull()
        ->and(json_decode($defaultCountryCodeSetting->payload, true, 512, JSON_THROW_ON_ERROR))->toBe('+63');
});

it('preserves a configured default country code when reseeded', function (): void {
    DB::table('settings')->updateOrInsert(
        [
            'group' => 'site',
            'name' => 'default_country_code',
        ],
        [
            'payload' => json_encode('+1', JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    $this->seed(BrandingSettingsSeeder::class);

    $defaultCountryCodeSetting = DB::table('settings')
        ->where('group', 'site')
        ->where('name', 'default_country_code')
        ->first();

    expect(json_decode($defaultCountryCodeSetting->payload, true, 512, JSON_THROW_ON_ERROR))->toBe('+1');
});
