<?php

declare(strict_types=1);

use App\Enums\StudentType;
use App\Enums\UserRole;
use App\Models\Faculty;
use App\Models\IdSequence;
use App\Models\Student;
use App\Models\User;
use App\Services\IdentifierGenerator;

it('previews and consumes the configured student sequence', function (): void {
    IdSequence::query()->create([
        'key' => 'student',
        'label' => 'Student IDs',
        'start_number' => 200000,
        'next_number' => 200123,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $generator = app(IdentifierGenerator::class);

    expect($generator->previewStudentId())->toBe(200123)
        ->and(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(200123)
        ->and($generator->generateStudentId())->toBe(200123)
        ->and(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(200124);
});

it('previews and consumes the shared staff sequence for faculty identifiers', function (): void {
    IdSequence::query()->create([
        'key' => 'staff',
        'label' => 'Staff IDs',
        'start_number' => 800000,
        'next_number' => 800000,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $generator = app(IdentifierGenerator::class);

    expect($generator->previewStaffId())->toBe('800000')
        ->and(IdSequence::query()->where('key', 'staff')->value('next_number'))->toBe(800000)
        ->and($generator->generateStaffId())->toBe('800000')
        ->and($generator->generateStaffId())->toBe('800001')
        ->and(IdSequence::query()->where('key', 'staff')->value('next_number'))->toBe(800002);
});

it('uses the configured student sequence in the administrator generated id endpoint', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    IdSequence::query()->create([
        'key' => 'student',
        'label' => 'Student IDs',
        'start_number' => 200000,
        'next_number' => 200555,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $this->actingAs($admin)
        ->getJson(route('administrators.students.generate-id', ['type' => StudentType::College->value]))
        ->assertSuccessful()
        ->assertJson(['id' => 200555]);

    expect(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(200555);
});

it('does not generate a configurable student ID for SHS because SHS uses LRN', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    IdSequence::query()->create([
        'key' => 'student',
        'label' => 'Student IDs',
        'start_number' => 200000,
        'next_number' => 200555,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $this->actingAs($admin)
        ->getJson(route('administrators.students.generate-id', ['type' => StudentType::SeniorHighSchool->value]))
        ->assertSuccessful()
        ->assertJson(['id' => null]);

    expect(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(200555);
});

it('previews the shared staff sequence on the faculty create page', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    IdSequence::query()->create([
        'key' => 'staff',
        'label' => 'Staff IDs',
        'start_number' => 800000,
        'next_number' => 800777,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $this->actingAs($admin)
        ->get(route('administrators.faculties.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('administrators/faculties/create', false)
            ->where('defaults.faculty_id_number', '800777'));
});

it('consumes the shared staff sequence when creating faculty with the previewed identifier', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    IdSequence::query()->create([
        'key' => 'staff',
        'label' => 'Staff IDs',
        'start_number' => 800000,
        'next_number' => 800900,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $this->actingAs($admin)
        ->post(route('administrators.faculties.store'), [
            'faculty_id_number' => '800900',
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada.lovelace@example.test',
            'status' => 'active',
        ])
        ->assertRedirect();

    expect(Faculty::query()->where('email', 'ada.lovelace@example.test')->value('faculty_id_number'))->toBe('800900')
        ->and(IdSequence::query()->where('key', 'staff')->value('next_number'))->toBe(800901);
});

it('renders identifier sequence settings in system management', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Developer]);
    IdSequence::query()->create([
        'key' => 'student',
        'label' => 'Student IDs',
        'start_number' => 200000,
        'next_number' => 200010,
        'increment_by' => 1,
        'padding' => 6,
    ]);
    IdSequence::query()->create([
        'key' => 'staff',
        'label' => 'Staff IDs',
        'start_number' => 800000,
        'next_number' => 800010,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $this->actingAs($admin)
        ->get(route('administrators.system-management.identifiers.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('administrators/system-management/identifiers', false)
            ->where('id_sequences.student.next_number', 200010)
            ->where('id_sequences.staff.next_number', 800010));
});

it('updates identifier sequence settings from system management', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Developer]);

    $this->actingAs($admin)
        ->put(route('administrators.system-management.identifiers.update'), [
            'student' => [
                'start_number' => 210000,
                'next_number' => 210000,
                'increment_by' => 1,
                'padding' => 6,
            ],
            'staff' => [
                'start_number' => 800000,
                'next_number' => 800500,
                'increment_by' => 1,
                'padding' => 6,
            ],
        ])
        ->assertRedirect();

    expect(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(210000)
        ->and(IdSequence::query()->where('key', 'staff')->value('next_number'))->toBe(800500);
});

it('bumps the configured student sequence above existing student records', function (): void {
    Student::factory()->create(['student_id' => 200999]);
    IdSequence::query()->create([
        'key' => 'student',
        'label' => 'Student IDs',
        'start_number' => 200000,
        'next_number' => 200100,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $generator = app(IdentifierGenerator::class);

    expect($generator->previewStudentId())->toBe(201000)
        ->and(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(201000)
        ->and($generator->generateStudentId())->toBe(201000)
        ->and(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(201001);
});

it('ignores SHS LRN values when adapting the generated student ID sequence', function (): void {
    Student::factory()->create([
        'student_id' => 220792,
        'student_type' => StudentType::College->value,
    ]);
    Student::factory()->create([
        'student_id' => 102004140011,
        'lrn' => '102004140011',
        'student_type' => StudentType::SeniorHighSchool->value,
    ]);
    IdSequence::query()->create([
        'key' => 'student',
        'label' => 'Student IDs',
        'start_number' => 200000,
        'next_number' => 200100,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $generator = app(IdentifierGenerator::class);

    expect($generator->previewStudentId())->toBe(220793)
        ->and(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(220793);
});

it('repairs a generated student sequence that was polluted by an SHS LRN value', function (): void {
    Student::factory()->create([
        'student_id' => 668670,
        'student_type' => StudentType::College->value,
    ]);
    Student::factory()->create([
        'student_id' => 102004140011,
        'lrn' => '102004140011',
        'student_type' => StudentType::SeniorHighSchool->value,
    ]);
    IdSequence::query()->create([
        'key' => 'student',
        'label' => 'Student IDs',
        'start_number' => 200000,
        'next_number' => 102004140012,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $generator = app(IdentifierGenerator::class);

    expect($generator->previewStudentId())->toBe(668671)
        ->and(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(668671);
});

it('uses the latest-created non-SHS student ID instead of an older high numeric outlier', function (): void {
    Student::factory()->create([
        'student_id' => 668670,
        'student_type' => StudentType::College->value,
        'created_at' => now()->subYear(),
    ]);
    Student::factory()->create([
        'student_id' => 208424,
        'student_type' => StudentType::College->value,
        'created_at' => now(),
    ]);
    IdSequence::query()->create([
        'key' => 'student',
        'label' => 'Student IDs',
        'start_number' => 200000,
        'next_number' => 668671,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $generator = app(IdentifierGenerator::class);

    expect($generator->previewStudentId())->toBe(208425)
        ->and(IdSequence::query()->where('key', 'student')->value('next_number'))->toBe(208425);
});

it('bumps the shared staff sequence above existing numeric faculty records', function (): void {
    Faculty::factory()->create(['faculty_id_number' => '800999']);
    Faculty::factory()->create(['faculty_id_number' => 'FAC-999999']);
    IdSequence::query()->create([
        'key' => 'staff',
        'label' => 'Staff IDs',
        'start_number' => 800000,
        'next_number' => 800100,
        'increment_by' => 1,
        'padding' => 6,
    ]);

    $generator = app(IdentifierGenerator::class);

    expect($generator->previewStaffId())->toBe('801000')
        ->and(IdSequence::query()->where('key', 'staff')->value('next_number'))->toBe(801000)
        ->and($generator->generateStaffId())->toBe('801000')
        ->and(IdSequence::query()->where('key', 'staff')->value('next_number'))->toBe(801001);
});
