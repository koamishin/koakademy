<?php

declare(strict_types=1);

it('sets Gotenberg as the primary production PDF driver profile', function (): void {
    $config = config('laravel-pdf');
    $strategy = $config['strategy'] ?? [];
    $profiles = $strategy['profiles'] ?? [];
    $production = $profiles['production'] ?? [];

    expect($config['driver'] ?? null)->toBe('gotenberg')
        ->and($production['primary'] ?? null)->toBe('gotenberg');
});

it('does not claim an unavailable production PDF fallback', function (): void {
    $config = config('laravel-pdf');
    $strategy = $config['strategy'] ?? [];
    $profiles = $strategy['profiles'] ?? [];
    $production = $profiles['production'] ?? [];
    $fallback = $production['fallback'] ?? [];

    expect($config)->toBeArray()
        ->and($strategy)->toBeArray()
        ->and($production['primary'] ?? null)->toBeString()
        ->and($fallback)->toBe([])
        ->and($strategy['rollback_driver'] ?? null)->toBe('gotenberg')
        ->and(json_encode($strategy, JSON_THROW_ON_ERROR))->not->toContain('dompdf');
});
