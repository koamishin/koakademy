<?php

declare(strict_types=1);

it('caches views with registered package view namespaces', function (): void {
    $this->artisan('view:cache')
        ->assertSuccessful();

    $this->artisan('view:clear')
        ->assertSuccessful();
});
