<?php

declare(strict_types=1);

use App\Enums\EnrollStat;
use App\Models\Account;
use App\Models\Course;
use App\Models\GeneralSetting;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use App\Notifications\MigrateToStudent;

beforeEach(function (): void {
    GeneralSetting::factory()->create([
        'school_starting_date' => '2026-06-01',
        'school_ending_date' => '2027-03-31',
        'semester' => 1,
    ]);
});

function makeEnrollmentForNotificationTest(array $studentOverrides = []): StudentEnrollment
{
    $course = Course::factory()->create();
    $student = Student::factory()->create(array_merge([
        'id' => fake()->unique()->numberBetween(200000, 299999),
        'course_id' => $course->id,
        'student_id' => 200123,
        'email' => 'jane.doe@example.com',
    ], $studentOverrides));

    return StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'course_id' => $course->id,
        'status' => EnrollStat::VerifiedByCashier->value,
    ]);
}

function renderMigrateToStudent(StudentEnrollment $enrollment): string
{
    return (string) (new MigrateToStudent($enrollment))->toMail(new stdClass)->render();
}

it('prompts the student to create an account when no User or Account exists', function (): void {
    $enrollment = makeEnrollmentForNotificationTest();

    $html = renderMigrateToStudent($enrollment);

    expect($html)->toContain('Create Your Student Portal Account')
        ->and($html)->toContain('Create Your Account')
        ->and($html)->toContain('Student ID:')
        ->and($html)->toContain('200123')
        ->and($html)->toContain('jane.doe@example.com')
        ->and($html)->toContain('student_id=200123')
        ->and($html)->toContain(rawurlencode('jane.doe@example.com'))
        ->and($html)->toContain('/signup')
        ->and($html)->not->toContain('Access Student Portal');
});

it('skips the CTA when a User is linked via record_id', function (): void {
    $enrollment = makeEnrollmentForNotificationTest();

    User::factory()->create([
        'record_id' => $enrollment->student->id,
        'email' => 'unrelated@example.com',
    ]);

    $html = renderMigrateToStudent($enrollment->fresh());

    expect($html)->toContain('Access Student Portal')
        ->and($html)->not->toContain('Create Your Student Portal Account')
        ->and($html)->not->toContain('Create Your Account');
});

it('skips the CTA when a User shares the student email', function (): void {
    $enrollment = makeEnrollmentForNotificationTest();

    User::factory()->create([
        'email' => $enrollment->student->email,
        'record_id' => null,
    ]);

    $html = renderMigrateToStudent($enrollment->fresh());

    expect($html)->toContain('Access Student Portal')
        ->and($html)->not->toContain('Create Your Account');
});

it('skips the CTA when Student.user_id is set', function (): void {
    $enrollment = makeEnrollmentForNotificationTest();
    $user = User::factory()->create(['email' => 'someone.else@example.com']);

    $enrollment->student->forceFill(['user_id' => $user->id])->save();

    $html = renderMigrateToStudent($enrollment->fresh());

    expect($html)->toContain('Access Student Portal')
        ->and($html)->not->toContain('Create Your Account');
});

it('skips the CTA when a polymorphic Account row exists for the student', function (): void {
    $enrollment = makeEnrollmentForNotificationTest();

    Account::factory()->create([
        'email' => $enrollment->student->email,
        'person_id' => $enrollment->student->id,
        'person_type' => Student::class,
    ]);

    $html = renderMigrateToStudent($enrollment->fresh());

    expect($html)->toContain('Access Student Portal')
        ->and($html)->not->toContain('Create Your Account');
});
