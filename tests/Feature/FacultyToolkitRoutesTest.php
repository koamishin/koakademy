<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

it('serves faculty toolkit sidebar pages', function (string $path, string $title): void {
    config(['inertia.testing.ensure_pages_exist' => false]);

    $user = User::factory()->create([
        'role' => UserRole::Instructor,
        'faculty_id_number' => 'FAC-TEST-001',
    ]);

    actingAs($user);

    get($path)
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('faculty/toolkit/show')
            ->where('toolkit.title', $title)
            ->has('toolkit.highlights')
            ->has('user')
        );
})->with([
    'at-risk alerts' => ['/faculty/at-risk-alerts', 'At-Risk Alerts'],
    'assessments' => ['/faculty/assessments', 'Assessments'],
    'inbox' => ['/faculty/inbox', 'Inbox'],
    'office hours' => ['/faculty/office-hours', 'Office Hours'],
    'requests' => ['/faculty/requests', 'Requests & Approvals'],
    'insights' => ['/faculty/insights', 'Insights'],
]);

it('registers named routes for faculty toolkit links', function (): void {
    expect(route('faculty.at-risk-alerts', absolute: false))->toBe('/faculty/at-risk-alerts')
        ->and(route('faculty.assessments', absolute: false))->toBe('/faculty/assessments')
        ->and(route('faculty.inbox', absolute: false))->toBe('/faculty/inbox')
        ->and(route('faculty.office-hours', absolute: false))->toBe('/faculty/office-hours')
        ->and(route('faculty.requests', absolute: false))->toBe('/faculty/requests')
        ->and(route('faculty.insights', absolute: false))->toBe('/faculty/insights');
});
