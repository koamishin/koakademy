<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    Cache::flush();
    config([
        'inertia.testing.ensure_pages_exist' => false,
        'services.github.repo' => 'private-school/koakademy',
        'services.github.token' => 'private-test-token',
    ]);
});

it('shows deployment prereleases on the public changelog without private links', function (): void {
    Http::fake([
        'api.github.com/repos/private-school/koakademy/releases*' => Http::response([
            [
                'name' => 'Mobile classroom update',
                'tag_name' => 'v1.10.0-dev.10.1',
                'prerelease' => true,
                'published_at' => '2026-07-20T08:15:00Z',
                'created_at' => '2026-07-20T08:15:00Z',
                'html_url' => 'https://github.com/private-school/koakademy/releases/tag/v1.10.0-dev.10.1',
                'body' => "## What's Changed\n- feat: improve the mobile classroom (abcdef1)",
            ],
        ], 200),
    ]);

    $this->get(route('changelog'))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('changelog')
            ->where('changelog_source', 'github_releases')
            ->where('show_technical_links', false)
            ->where('github_repo', null)
            ->where('versionInfo.commit', null)
            ->where('versionInfo.build_url', null)
            ->where('changelog.0.title', 'Mobile classroom update')
            ->where('changelog.0.prerelease', true)
            ->where('changelog.0.source', 'github_release')
            ->where('changelog.0.changes.0.type', 'feature')
        );

    Http::assertSent(fn ($request): bool => $request->hasHeader('Authorization', 'Bearer private-test-token'));
});

it('identifies build metadata when private release notes are unavailable', function (): void {
    Http::fake([
        'api.github.com/repos/private-school/koakademy/releases*' => Http::response([], 500),
    ]);

    $this->get(route('changelog'))
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('changelog')
            ->where('changelog_source', 'build_metadata')
            ->where('show_technical_links', false)
            ->where('changelog.0.title', 'Current deployed build')
            ->where('changelog.0.source', 'build_metadata')
            ->where('changelog.0.github_url', null)
        );
});
