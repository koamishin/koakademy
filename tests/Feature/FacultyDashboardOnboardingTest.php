<?php

declare(strict_types=1);

use App\Models\OnboardingProgress;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('marks faculty users with no onboarding progress as new on dashboard props', function (): void {
    config(['inertia.testing.ensure_pages_exist' => false]);

    $user = User::factory()->create([
        'role' => 'faculty',
    ]);

    actingAs($user);

    $this->withoutMiddleware();

    get('/faculty/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('faculty/dashboard')
            ->where('user.id', $user->id)
            ->where('is_new_user', true)
        );
});

it('marks faculty users with existing onboarding progress as not new on dashboard props', function (): void {
    config(['inertia.testing.ensure_pages_exist' => false]);

    $user = User::factory()->create([
        'role' => 'faculty',
    ]);

    OnboardingProgress::create([
        'user_id' => $user->id,
        'variant' => 'faculty',
        'started_at' => now(),
    ]);

    actingAs($user);

    $this->withoutMiddleware();

    get('/faculty/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('faculty/dashboard')
            ->where('is_new_user', false)
        );
});
