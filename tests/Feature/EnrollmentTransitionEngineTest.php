<?php

declare(strict_types=1);

use App\Data\Enrollment\EnrollmentContext;
use App\Enrollment\EnrollmentPolicyResolver;
use App\Enrollment\EnrollmentTransitionEngine;
use App\Features\DynamicEnrollmentPolicies;
use App\Filament\Resources\StudentEnrollments\Api\Transformers\StudentEnrollmentTransformer;
use App\Models\EnrollmentWorkflowEvent;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Pennant\Feature;
use Spatie\Permission\Models\Permission;

it('transitions atomically and returns the prior result on idempotent retry', function (): void {
    $permission = Permission::findOrCreate('Update:StudentEnrollment', 'web');
    $actor = User::factory()->create();
    $actor->givePermissionTo($permission);
    $enrollment = StudentEnrollment::factory()->policyWorkflow()->create(['status' => 'Pending']);
    $enrollment->forceFill(['workflow_runtime' => StudentEnrollment::WorkflowRuntimePolicyV1])->save();
    $snapshot = app(EnrollmentPolicyResolver::class)->snapshot(EnrollmentContext::fromEnrollment($enrollment));
    $enrollment->update(['enrollment_policy_snapshot_id' => $snapshot->id, 'current_step_key' => 'submitted']);
    $engine = app(EnrollmentTransitionEngine::class);

    $first = $engine->transition($enrollment, $actor, null, [], 'transition-test-1');
    $second = $engine->transition($enrollment->refresh(), $actor, null, [], 'transition-test-1');

    expect($first->successful)->toBeTrue()
        ->and($first->toStepKey)->toBe('academic_verified')
        ->and($enrollment->refresh()->status)->toBe('Verified By Dept Head')
        ->and($second->message)->toContain('already processed')
        ->and(EnrollmentWorkflowEvent::query()->where('student_enrollment_id', $enrollment->id)->where('event_type', 'transition_succeeded')->count())->toBe(1);
});

it('records failed actions outside the rolled back transition', function (): void {
    $permission = Permission::findOrCreate('Update:StudentEnrollment', 'web');
    $actor = User::factory()->create();
    $actor->givePermissionTo($permission);
    $enrollment = StudentEnrollment::factory()->policyWorkflow()->create(['status' => 'Pending']);
    $enrollment->forceFill(['workflow_runtime' => StudentEnrollment::WorkflowRuntimePolicyV1])->save();
    $snapshot = app(EnrollmentPolicyResolver::class)->snapshot(EnrollmentContext::fromEnrollment($enrollment));
    $configuration = $snapshot->configuration;
    $configuration['workflow']['steps'][1]['actions'][0]['handler'] = 'enrollment.change_status';
    $configuration['workflow']['steps'][1]['actions'][0]['configuration'] = ['status' => ''];
    $brokenSnapshot = App\Models\EnrollmentPolicySnapshot::factory()->create(['configuration' => $configuration, 'source_version_ids' => $snapshot->source_version_ids]);
    $enrollment->update(['enrollment_policy_snapshot_id' => $brokenSnapshot->id, 'current_step_key' => 'submitted']);

    expect(fn () => app(EnrollmentTransitionEngine::class)->transition($enrollment, $actor, null, [], 'transition-test-failure'))
        ->toThrow(App\Enrollment\Exceptions\EnrollmentTransitionException::class);

    expect($enrollment->refresh()->current_step_key)->toBe('submitted')
        ->and(EnrollmentWorkflowEvent::query()->where('student_enrollment_id', $enrollment->id)->latest('id')->value('event_type'))
        ->toBe('transition_failed');
});

it('preserves the legacy status and exposes workflow compatibility data', function (): void {
    $permission = Permission::findOrCreate('Update:StudentEnrollment', 'web');
    $actor = User::factory()->create();
    $actor->givePermissionTo($permission);
    $enrollment = StudentEnrollment::factory()->legacyWorkflow()->create(['status' => 'Pending']);
    $snapshot = app(EnrollmentPolicyResolver::class)->snapshot(EnrollmentContext::fromEnrollment($enrollment));
    $enrollment->update(['enrollment_policy_snapshot_id' => $snapshot->id, 'current_step_key' => 'submitted']);
    $request = Request::create('/api/enrollments/'.$enrollment->id);
    $request->setUserResolver(fn (): User => $actor);

    $payload = (new StudentEnrollmentTransformer($enrollment->refresh()))->toArray($request);

    expect($payload['status'])->toBe('Pending')
        ->and($payload['workflow']['snapshot_id'])->toBe($snapshot->id)
        ->and($payload['workflow']['current_step_key'])->toBe('submitted')
        ->and($payload['workflow']['allowed_transitions'][0]['to'])->toBe('academic_verified');
});

it('reopens terminal enrollments through a separately authorized operation', function (): void {
    $permission = Permission::findOrCreate('Reopen:StudentEnrollment', 'web');
    $actor = User::factory()->create();
    $actor->givePermissionTo($permission);
    $enrollment = StudentEnrollment::factory()->policyWorkflow()->create(['status' => 'Verified By Cashier']);
    $enrollment->forceFill(['workflow_runtime' => StudentEnrollment::WorkflowRuntimePolicyV1])->save();
    $snapshot = app(EnrollmentPolicyResolver::class)->snapshot(EnrollmentContext::fromEnrollment($enrollment));
    $enrollment->update([
        'enrollment_policy_snapshot_id' => $snapshot->id,
        'current_step_key' => 'completed',
        'terminal_outcome' => 'completed',
    ]);

    $result = app(EnrollmentTransitionEngine::class)->reopen(
        $enrollment,
        $actor,
        'academic_verified',
        'Correct the academic assessment.',
        'reopen-test-1',
    );

    expect($result->toStepKey)->toBe('academic_verified')
        ->and($enrollment->refresh()->terminal_outcome)->toBeNull()
        ->and($enrollment->current_step_key)->toBe('academic_verified')
        ->and(EnrollmentWorkflowEvent::query()->where('student_enrollment_id', $enrollment->id)->where('event_type', 'reopened')->value('event_type'))->toBe('reopened');
});

it('pins new enrollments and rejects duplicate periods when the rollout is active', function (): void {
    $actor = User::factory()->create();
    $this->actingAs($actor);
    Feature::for($actor)->activate(DynamicEnrollmentPolicies::class);
    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => App\Models\Student::factory(),
        'school_year' => '2027 - 2028',
        'semester' => 1,
    ]);

    expect($enrollment->refresh()->enrollment_policy_snapshot_id)->not->toBeNull()
        ->and($enrollment->current_step_key)->toBe('submitted')
        ->and($enrollment->deduplication_key)->toHaveLength(64);

    expect(fn () => StudentEnrollment::factory()->create([
        'student_id' => $enrollment->student_id,
        'school_id' => $enrollment->school_id,
        'course_id' => $enrollment->course_id,
        'school_year' => $enrollment->school_year,
        'semester' => $enrollment->semester,
    ]))->toThrow(ValidationException::class, 'matching enrollment');
});
