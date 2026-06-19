<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\GeneralSetting;
use App\Models\User;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\withoutMiddleware;

function grantSystemManagementSettingsPermissions(User $user, array $permissions): void
{
    foreach ($permissions as $permission) {
        Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]);
    }

    $user->givePermissionTo($permissions);
}

it('updates analytics configuration from the analytics system management form', function (): void {
    $settings = GeneralSetting::factory()->create();
    $user = User::factory()->create([
        'role' => UserRole::Admin,
    ]);

    grantSystemManagementSettingsPermissions($user, ['View:SystemManagementAnalytics', 'Update:SystemManagementAnalytics']);
    withoutMiddleware();

    actingAs($user)
        ->put(portalUrlForAdministrators('/administrators/system-management/analytics'), [
            'analytics_enabled' => true,
            'analytics_provider' => 'google',
            'analytics_script' => '',
            'analytics_settings' => [
                'google_measurement_id' => 'G-KOATEST01',
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $settings->refresh();

    expect($settings->analytics_enabled)->toBeTrue()
        ->and($settings->analytics_provider)->toBe('google')
        ->and($settings->analytics_script)->toBeNull()
        ->and($settings->analytics_settings)->toMatchArray([
            'google_measurement_id' => 'G-KOATEST01',
        ])
        ->and($settings->google_analytics_id)->toBe('G-KOATEST01');
});

it('updates seo metadata without modifying analytics configuration', function (): void {
    $settings = GeneralSetting::factory()->create([
        'analytics_enabled' => true,
        'analytics_provider' => 'google',
        'analytics_script' => null,
        'analytics_settings' => [
            'google_measurement_id' => 'G-UNCHANGED01',
        ],
        'google_analytics_id' => 'G-UNCHANGED01',
    ]);
    $user = User::factory()->create([
        'role' => UserRole::Admin,
    ]);

    grantSystemManagementSettingsPermissions($user, ['View:SystemManagementSeo', 'Update:SystemManagementSeo']);
    withoutMiddleware();

    actingAs($user)
        ->put(portalUrlForAdministrators('/administrators/system-management/seo'), [
            'site_name' => 'DCCP Hub',
            'site_description' => 'Official administrative portal for Data Center College of the Philippines.',
            'seo_title' => 'DCCP Administrator Panel',
            'seo_keywords' => 'dccp, enrollment, student records',
            'seo_metadata' => [
                'robots' => 'noindex, follow',
                'og_image' => 'https://dccp.example.edu/share.png',
                'twitter_handle' => 'dccphub',
                'twitter_card' => 'summary_large_image',
                'canonical_url' => 'https://dccp.example.edu/admin',
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $settings->refresh();

    expect($settings->site_name)->toBe('DCCP Hub')
        ->and($settings->site_description)->toBe('Official administrative portal for Data Center College of the Philippines.')
        ->and($settings->seo_title)->toBe('DCCP Administrator Panel')
        ->and($settings->seo_keywords)->toBe('dccp, enrollment, student records')
        ->and($settings->seo_metadata)->toMatchArray([
            'robots' => 'noindex, follow',
            'og_image' => 'https://dccp.example.edu/share.png',
            'twitter_handle' => '@dccphub',
            'twitter_card' => 'summary_large_image',
            'canonical_url' => 'https://dccp.example.edu/admin',
        ])
        ->and($settings->analytics_enabled)->toBeTrue()
        ->and($settings->analytics_provider)->toBe('google')
        ->and($settings->analytics_settings)->toMatchArray([
            'google_measurement_id' => 'G-UNCHANGED01',
        ])
        ->and($settings->google_analytics_id)->toBe('G-UNCHANGED01');
});
