<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Mail\SequenzyApiKeyResolver;
use App\Models\GeneralSetting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;

function grantMailManagementPermissions(User $user): void
{
    foreach (['View:SystemManagementMail', 'Update:SystemManagementMail'] as $permission) {
        Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]);
    }

    $user->givePermissionTo(['View:SystemManagementMail', 'Update:SystemManagementMail']);
}

it('encrypts the Sequenzy API key and preserves it when the field is blank', function (): void {
    $user = User::factory()->create(['role' => UserRole::Admin]);
    grantMailManagementPermissions($user);
    $settings = GeneralSetting::query()->firstOrCreate([], ['site_name' => 'Test']);

    actingAs($user)
        ->put(portalUrlForAdministrators('/administrators/system-management/mail'), [
            'email_from_address' => 'noreply@koakademy.edu.ph',
            'email_from_name' => 'KoAkademy Portal',
            'driver' => 'sequenzy',
            'sequenzy_api_key' => 'seq_secret_test_key',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $settings->refresh();
    $encryptedValue = DB::table('general_settings')
        ->where('id', $settings->id)
        ->value('sequenzy_api_key');

    expect($settings->sequenzy_api_key)->toBe('seq_secret_test_key')
        ->and($encryptedValue)->toBeString()
        ->and($encryptedValue)->not->toBe('seq_secret_test_key');

    actingAs($user)
        ->put(portalUrlForAdministrators('/administrators/system-management/mail'), [
            'email_from_address' => 'noreply@koakademy.edu.ph',
            'email_from_name' => 'KoAkademy Portal',
            'driver' => 'sequenzy',
            'sequenzy_api_key' => '',
        ])
        ->assertRedirect();

    expect($settings->refresh()->sequenzy_api_key)->toBe('seq_secret_test_key');
});

it('never exposes stored mail credentials to the system management page', function (): void {
    $user = User::factory()->create(['role' => UserRole::Admin]);
    grantMailManagementPermissions($user);
    $settings = GeneralSetting::query()->firstOrCreate([], ['site_name' => 'Test']);
    $settings->update([
        'sequenzy_api_key' => 'seq_secret_test_key',
        'email_settings' => [
            'driver' => 'sequenzy',
            'password' => 'legacy-smtp-secret',
        ],
    ]);

    actingAs($user)
        ->get(portalUrlForAdministrators('/administrators/system-management/mail'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('administrators/system-management/mail', false)
            ->where('mail_config.driver', 'sequenzy')
            ->where('mail_config.password', '')
            ->where('mail_config.api_key_configured', true)
            ->where('mail_config.password_configured', true)
            ->missing('general_settings.sequenzy_api_key')
            ->missing('general_settings.email_settings.password'));
});

it('resolves a database key before environment fallbacks', function (): void {
    config([
        'services.sequenzy.key' => 'environment-key',
        'services.sequenzy.legacy_key' => 'legacy-key',
    ]);

    $settings = GeneralSetting::query()->firstOrCreate([], ['site_name' => 'Test']);
    $settings->update(['sequenzy_api_key' => 'database-key']);

    expect(app(SequenzyApiKeyResolver::class)->resolve())->toBe('database-key');
});

it('falls back to the dedicated environment key when no database key exists', function (): void {
    config([
        'services.sequenzy.key' => 'environment-key',
        'services.sequenzy.legacy_key' => 'legacy-key',
    ]);

    $settings = GeneralSetting::query()->firstOrCreate([], ['site_name' => 'Test']);
    $settings->update(['sequenzy_api_key' => null]);

    expect(app(SequenzyApiKeyResolver::class)->resolve())->toBe('environment-key');
});
