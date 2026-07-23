<?php

declare(strict_types=1);

use App\Models\GeneralSetting;
use App\Settings\SiteSettings;
use Illuminate\Support\Facades\DB;

function ensureDefaultCountryCodeSiteSettingExists(): void
{
    app()->forgetInstance(SiteSettings::class);

    DB::table('settings')->updateOrInsert(
        [
            'group' => SiteSettings::group(),
            'name' => 'default_country_code',
        ],
        [
            'payload' => json_encode('+63', JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    app()->forgetInstance(SiteSettings::class);
}

it('returns dynamic app manifest metadata from branding settings', function (): void {
    ensureDefaultCountryCodeSiteSettingExists();

    $settings = app(SiteSettings::class);
    $settings->app_name = 'DCCP Hub';
    $settings->app_short_name = 'DCCP';
    $settings->description = 'DCCP administrative portal progressive web application.';
    $settings->theme_color = '#123456';
    $settings->default_country_code = 'PH';
    $settings->save();

    app()->forgetInstance(SiteSettings::class);

    $response = $this->get('/app.webmanifest');

    $response->assertOk()
        ->assertHeader('Content-Type', 'application/manifest+json')
        ->assertJsonPath('name', 'DCCP Hub')
        ->assertJsonPath('short_name', 'DCCP')
        ->assertJsonPath('description', 'DCCP administrative portal progressive web application.')
        ->assertJsonPath('theme_color', '#123456')
        ->assertJsonPath('icons.0.src', '/logo.png');

    expect($response->getContent())->not->toContain('KoAkademy');
});

it('renders configured branding and seo metadata on hard refresh html', function (): void {
    $this->withoutVite();
    ensureDefaultCountryCodeSiteSettingExists();

    $siteSettings = app(SiteSettings::class);
    $siteSettings->app_name = 'DCCP Hub';
    $siteSettings->app_short_name = 'DCCP';
    $siteSettings->portal_name = 'KoAkademy';
    $siteSettings->description = 'Fallback DCCP description.';
    $siteSettings->theme_color = '#0f172a';
    $siteSettings->default_country_code = 'PH';
    $siteSettings->save();

    GeneralSetting::factory()->create([
        'site_name' => 'DCCP Hub',
        'site_description' => 'Official administrative portal for Data Center College of the Philippines.',
        'seo_title' => 'DCCP Administrator Panel',
        'seo_keywords' => 'dccp, enrollment, records',
        'seo_metadata' => [
            'robots' => 'index, follow',
            'og_image' => 'https://dccp.example.edu/share.png',
            'twitter_handle' => '@dccphub',
            'twitter_card' => 'summary_large_image',
            'canonical_url' => 'https://dccp.example.edu/admin',
        ],
    ]);

    app()->forgetInstance(SiteSettings::class);

    $response = $this->get(portalUrlForAdministrators('/login'));

    $response->assertOk()
        ->assertSee('<title inertia>DCCP Administrator Panel</title>', false)
        ->assertSee('<meta name="application-name" content="DCCP Hub">', false)
        ->assertSee('<meta name="apple-mobile-web-app-title" content="DCCP Hub">', false)
        ->assertSee('<link rel="manifest" href="http://'.portalHostForAdministrators().'/app.webmanifest">', false)
        ->assertSee('<meta name="description" content="Official administrative portal for Data Center College of the Philippines.">', false)
        ->assertSee('<meta property="og:site_name" content="DCCP Hub">', false)
        ->assertSee('<meta property="og:image" content="https://dccp.example.edu/share.png">', false)
        ->assertSee('<meta name="twitter:site" content="@dccphub">', false)
        ->assertSee('<link rel="canonical" href="https://dccp.example.edu/admin">', false)
        ->assertDontSee('<title inertia>KoAkademy</title>', false)
        ->assertDontSee('<meta name="application-name" content="KoAkademy">', false)
        ->assertDontSee('<meta name="apple-mobile-web-app-title" content="KoAkademy">', false)
        ->assertDontSee('<meta property="og:site_name" content="KoAkademy">', false);
});
