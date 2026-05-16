<?php

declare(strict_types=1);

use App\Features\Contracts\FeatureToggle;
use App\Features\Toggles\FacultyDashboard;
use App\Features\Toggles\StudentDashboard;
use App\Services\FeatureToggleRegistry;

it('maps keys to feature toggle classes', function (): void {
    $class = FeatureToggleRegistry::classForKey('faculty-dashboard');
    expect($class)->toBe(FacultyDashboard::class);
});

it('returns null for unknown keys', function (): void {
    $class = FeatureToggleRegistry::classForKey('nonexistent-feature');
    expect($class)->toBeNull();
});

it('maps classes back to keys', function (): void {
    $key = FeatureToggleRegistry::keyForClass(FacultyDashboard::class);
    expect($key)->toBe('faculty-dashboard');
});

it('returns all registered keys', function (): void {
    $keys = FeatureToggleRegistry::allKeys();
    expect($keys)->toContain('faculty-dashboard', 'student-dashboard');
});

it('returns all registered classes', function (): void {
    $classes = FeatureToggleRegistry::allClasses();
    expect($classes)->toContain(FacultyDashboard::class, StudentDashboard::class);
});

it('instantiates feature toggles by key', function (): void {
    $toggle = FeatureToggleRegistry::make('faculty-dashboard');
    expect($toggle)->toBeInstanceOf(FeatureToggle::class);
    expect($toggle)->toBeInstanceOf(FacultyDashboard::class);
});

it('returns null for unknown key instantiation', function (): void {
    $toggle = FeatureToggleRegistry::make('nonexistent');
    expect($toggle)->toBeNull();
});

it('returns all instantiated toggles', function (): void {
    $toggles = FeatureToggleRegistry::all();
    expect($toggles)->toBeArray();
    expect($toggles)->not->toBeEmpty();
    expect($toggles[0])->toBeInstanceOf(FeatureToggle::class);
});
