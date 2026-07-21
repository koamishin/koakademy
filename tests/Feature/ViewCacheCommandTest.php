<?php

declare(strict_types=1);

it('caches views with registered package view namespaces', function (): void {
    $compiledPath = storage_path('framework/testing/view-cache-command-'.bin2hex(random_bytes(8)));
    app('files')->ensureDirectoryExists($compiledPath);
    config()->set('view.compiled', $compiledPath);

    try {
        $this->artisan('view:cache')
            ->assertSuccessful();

        $this->artisan('view:clear')
            ->assertSuccessful();
    } finally {
        app('files')->deleteDirectory($compiledPath);
    }
});
