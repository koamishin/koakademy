<?php

declare(strict_types=1);

use App\Models\OnboardingProgress;
use App\Models\User;

use function Pest\Laravel\actingAs;

it('returns onboarding progress using camel case fields', function (string $variant): void {
    $user = User::factory()->create([
        'role' => $variant,
    ]);

    OnboardingProgress::create([
        'user_id' => $user->id,
        'variant' => $variant,
        'completed_steps' => ['welcome'],
        'checklist_state' => ['profile-complete' => true],
        'current_step_index' => 2,
        'is_dismissed' => true,
        'started_at' => now(),
        'completed_at' => now(),
        'last_seen_at' => now(),
    ]);

    $response = actingAs($user)->getJson("/onboarding/progress?variant={$variant}");

    $response->assertOk();

    expect($response->json('progress'))
        ->toHaveKeys([
            'completedSteps',
            'checklistState',
            'currentStepIndex',
            'isDismissed',
            'startedAt',
            'completedAt',
            'lastSeenAt',
        ])
        ->not->toHaveKeys([
            'completed_steps',
            'checklist_state',
            'current_step_index',
            'is_dismissed',
            'started_at',
            'completed_at',
            'last_seen_at',
        ]);

    expect($response->json('progress.completedSteps'))->toBe(['welcome'])
        ->and($response->json('progress.checklistState'))->toBe(['profile-complete' => true])
        ->and($response->json('progress.currentStepIndex'))->toBe(2)
        ->and($response->json('progress.isDismissed'))->toBeTrue();
})->with(['student', 'faculty']);

it('persists dismissed onboarding completion', function (): void {
    $user = User::factory()->create([
        'role' => 'student',
    ]);

    $response = actingAs($user)->postJson('/onboarding/progress', [
        'variant' => 'student',
        'completed_steps' => ['student-welcome'],
        'checklist_state' => ['profile-complete' => true],
        'current_step_index' => 4,
        'is_dismissed' => true,
    ]);

    $response
        ->assertOk()
        ->assertJson([
            'progress' => [
                'completedSteps' => ['student-welcome'],
                'checklistState' => ['profile-complete' => true],
                'currentStepIndex' => 4,
                'isDismissed' => true,
            ],
        ]);

    $progress = OnboardingProgress::query()
        ->where('user_id', $user->id)
        ->where('variant', 'student')
        ->firstOrFail();

    expect($progress->is_dismissed)->toBeTrue()
        ->and($progress->completed_at)->not->toBeNull();
});

it('does not reopen onboarding when a stale progress write arrives after dismissal', function (): void {
    $user = User::factory()->create([
        'role' => 'faculty',
    ]);

    OnboardingProgress::create([
        'user_id' => $user->id,
        'variant' => 'faculty',
        'completed_steps' => ['faculty-welcome'],
        'checklist_state' => ['profile-complete' => true],
        'current_step_index' => 4,
        'is_dismissed' => true,
        'completed_at' => now(),
        'started_at' => now(),
    ]);

    $response = actingAs($user)->postJson('/onboarding/progress', [
        'variant' => 'faculty',
        'completed_steps' => ['faculty-welcome'],
        'checklist_state' => ['profile-complete' => true],
        'current_step_index' => 3,
        'is_dismissed' => false,
    ]);

    $response
        ->assertOk()
        ->assertJson([
            'progress' => [
                'currentStepIndex' => 3,
                'isDismissed' => true,
            ],
        ]);

    expect(
        OnboardingProgress::query()
            ->where('user_id', $user->id)
            ->where('variant', 'faculty')
            ->value('is_dismissed')
    )->toBeTrue();
});
