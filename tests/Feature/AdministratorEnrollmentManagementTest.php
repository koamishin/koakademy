<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Department;
use App\Models\GeneralSetting;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentTransaction;
use App\Models\StudentTuition;
use App\Models\Subject;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

beforeEach(function (): void {
    if (! Schema::hasTable('additional_fees')) {
        Schema::create('additional_fees', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('enrollment_id');
            $table->string('fee_name');
            $table->decimal('amount', 10, 2);
            $table->boolean('is_separate_transaction')->default(false);
            $table->string('transaction_number')->nullable();
            $table->timestamps();
        });
    }
});

it('allows administrative users to view the enrollments management page', function (): void {
    $user = User::factory()->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($user)
        ->get(portalUrlForAdministrators('/administrators/enrollments'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('administrators/enrollments/index', false)
            ->has('applicantsCount')
            ->has('enrollments')
            ->has('analytics')
            ->has('filters')
            ->has('filament.student_enrollments.index_url')
            ->has('filament.student_enrollments.create_url')
        );
});

it('returns 404 when enrollments path receives a non-numeric identifier', function (): void {
    $user = User::factory()->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($user)
        ->get(portalUrlForAdministrators('/administrators/enrollments/avatar.png'))
        ->assertNotFound();
});

it('shares an absolute avatar URL for authenticated admin data', function (): void {
    $user = User::factory()->create([
        'role' => UserRole::Admin,
        'avatar_url' => 'avatar.png',
    ]);

    $this->actingAs($user)
        ->get(portalUrlForAdministrators('/administrators/enrollments'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('auth.user.avatar', Storage::url('avatar.png'))
        );
});

it('provides accurate enrollment analytics', function (): void {
    // 1. Setup Current Academic Period: SY 2024-2025, Semester 1
    GeneralSetting::factory()->create([
        'school_starting_date' => '2024-08-01',
        'school_ending_date' => '2025-05-30',
        'semester' => 1,
        'more_configs' => [
            'enrollment_pipeline' => [
                'steps' => [
                    [
                        'key' => 'pending',
                        'status' => 'Pending',
                        'label' => 'Pending',
                        'color' => 'amber',
                        'allowed_roles' => ['student'],
                        'action_type' => 'standard',
                    ],
                    [
                        'key' => 'department_review',
                        'status' => 'Verified By Department',
                        'label' => 'Verified By Department',
                        'color' => 'blue',
                        'allowed_roles' => ['admin'],
                        'action_type' => 'department_verification',
                    ],
                    [
                        'key' => 'cashier_verification',
                        'status' => 'Verified By Cashier',
                        'label' => 'Verified By Cashier',
                        'color' => 'green',
                        'allowed_roles' => ['cashier'],
                        'action_type' => 'cashier_verification',
                    ],
                ],
                'entry_step_key' => 'pending',
                'completion_step_key' => 'cashier_verification',
            ],
        ],
    ]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    // 2. Setup Courses
    $ccsDepartment = Department::factory()->create(['code' => 'CCS', 'name' => 'College of Computer Studies']);
    $cbaDepartment = Department::factory()->create(['code' => 'CBA', 'name' => 'College of Business Administration']);

    $bscs = Course::factory()->create(['code' => 'BSCS', 'department_id' => $ccsDepartment->id]);
    $bsba = Course::factory()->create(['code' => 'BSBA', 'department_id' => $cbaDepartment->id]);

    // 3. Setup Enrollments

    // Group A: Enrolled in Current Period (2024 - 2025, Sem 1) - Total 3
    // 2 BSCS students, 1 BSBA student
    // Year Levels: 1st Year (2), 2nd Year (1)
    StudentEnrollment::factory()->create([
        'school_year' => '2024 - 2025',
        'semester' => 1,
        'status' => 'Verified By Cashier',
        'course_id' => $bscs->id,
        'academic_year' => 1,
    ]);

    StudentEnrollment::factory()->create([
        'school_year' => '2024 - 2025',
        'semester' => 1,
        'status' => 'Verified By Cashier',
        'course_id' => $bscs->id,
        'academic_year' => 1,
    ]);

    StudentEnrollment::factory()->create([
        'school_year' => '2024 - 2025',
        'semester' => 1,
        'status' => 'Verified By Cashier',
        'course_id' => $bsba->id,
        'academic_year' => 2,
    ]);

    // Group B: Enrolled in Previous Period (2023 - 2024, Sem 2) - Total 1
    StudentEnrollment::factory()->create([
        'school_year' => '2023 - 2024',
        'semester' => 2,
        'status' => 'Verified By Cashier',
        'course_id' => $bscs->id,
        'academic_year' => 1,
    ]);

    // Group C: Pending in Current Period (Should not count)
    StudentEnrollment::factory()->create([
        'school_year' => '2024 - 2025',
        'semester' => 1,
        'status' => 'Pending',
        'course_id' => $bscs->id,
        'academic_year' => 1,
    ]);

    // 4. Execute Request
    $this->actingAs($user)
        ->get(portalUrlForAdministrators('/administrators/enrollments'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('administrators/enrollments/index', false)
            ->has('analytics', fn (AssertableInertia $analytics) => $analytics
                ->where('current_semester_count', 3)
                ->where('current_school_year_count', 3)
                ->where('previous_semester_count', 1)
                ->has('by_department', 2)
                ->where('by_year_level', function ($yearLevels) {
                    $year1 = collect($yearLevels)->firstWhere('year_level', 1);
                    $year2 = collect($yearLevels)->firstWhere('year_level', 2);

                    return $year1['count'] === 2 && $year2['count'] === 1;
                })
                ->etc()
            )
        );
});

it('calculates the assessment preview balance from paid transactions', function (): void {
    config(['activitylog.enabled' => false]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    $course = Course::factory()->create();
    $studentId = fake()->numberBetween(900000, 999999);
    $student = Student::factory()->createQuietly([
        'id' => $studentId,
        'course_id' => $course->id,
    ]);

    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'course_id' => $course->id,
        'school_year' => '2025 - 2026',
        'semester' => 2,
    ]);

    StudentTuition::query()->create([
        'student_id' => $student->id,
        'enrollment_id' => $enrollment->id,
        'school_year' => '2025 - 2026',
        'semester' => 2,
        'total_lectures' => 9375,
        'total_laboratory' => 4000,
        'total_miscelaneous_fees' => 3700,
        'total_tuition' => 13375,
        'overall_tuition' => 19075,
        'downpayment' => 3000,
        'total_balance' => 13075,
        'discount' => 0,
        'academic_year' => 2,
    ]);

    $transaction = Transaction::create([
        'description' => 'Downpayment for student Tuition',
        'payment_method' => 'cash',
        'status' => 'completed',
        'transaction_date' => now(),
        'settlements' => [
            'tuition_fee' => 3000,
        ],
        'user_id' => $user->id,
    ]);

    $transaction->forceFill([
        'created_at' => '2025-12-01 10:00:00',
    ])->save();

    StudentTransaction::create([
        'student_id' => $student->id,
        'transaction_id' => $transaction->id,
        'amount' => 3000,
        'status' => 'completed',
    ]);

    $this->actingAs($user)
        ->getJson(portalUrlForAdministrators("/administrators/enrollments/{$enrollment->id}/assessment-preview-data"))
        ->assertOk()
        ->assertJsonPath('tuition.total_balance', 16075);

    expect($enrollment->studentTuition()->first()?->total_balance)->toBe(16075.0);
});

it('allows administrators to edit enrollment details', function (): void {
    config(['activitylog.enabled' => false]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    $course = Course::factory()->create([
        'lec_per_unit' => 100,
        'lab_per_unit' => 200,
        'miscelaneous' => 3500,
    ]);

    $studentId = fake()->numberBetween(900000, 999999);
    $student = Student::factory()->createQuietly([
        'id' => $studentId,
        'course_id' => $course->id,
        'academic_year' => 1,
    ]);

    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'course_id' => $course->id,
        'school_year' => '2025 - 2026',
        'semester' => 1,
        'academic_year' => 1,
    ]);

    $subject = Subject::factory()->create([
        'course_id' => $course->id,
        'lecture' => 3,
        'laboratory' => 1,
        'code' => 'ENG101',
    ]);

    $enrollment->subjectsEnrolled()->create([
        'subject_id' => $subject->id,
        'student_id' => $student->id,
        'academic_year' => $enrollment->academic_year,
        'school_year' => $enrollment->school_year,
        'semester' => $enrollment->semester,
        'is_modular' => false,
        'lecture_fee' => 400,
        'laboratory_fee' => 200,
        'enrolled_lecture_units' => $subject->lecture,
        'enrolled_laboratory_units' => $subject->laboratory,
    ]);

    StudentTuition::query()->create([
        'enrollment_id' => $enrollment->id,
        'student_id' => $student->id,
        'total_tuition' => 0,
        'total_balance' => 0,
        'total_lectures' => 0,
        'total_laboratory' => 0,
        'total_miscelaneous_fees' => 3500,
        'discount' => 0,
        'downpayment' => 0,
        'overall_tuition' => 3500,
        'semester' => $enrollment->semester,
        'school_year' => $enrollment->school_year,
        'academic_year' => $enrollment->academic_year,
    ]);

    $this->actingAs($user)
        ->get(portalUrlForAdministrators("/administrators/enrollments/{$enrollment->id}/edit"))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('administrators/enrollments/edit', false)
            ->where('enrollment.id', $enrollment->id)
            ->where('enrollment.student.id', $student->id)
            ->has('enrollment.subjects', 1)
        );

    $this->actingAs($user)
        ->put(portalUrlForAdministrators("/administrators/enrollments/{$enrollment->id}"), [
            'student_id' => $student->id,
            'semester' => 1,
            'academic_year' => 1,
            'subjects' => [
                [
                    'subject_id' => $subject->id,
                    'class_id' => null,
                    'is_modular' => false,
                    'lecture_fee' => 400,
                    'laboratory_fee' => 200,
                    'enrolled_lecture_units' => $subject->lecture,
                    'enrolled_laboratory_units' => $subject->laboratory,
                ],
            ],
            'discount' => 10,
            'downpayment' => 0,
            'additional_fees' => [
                [
                    'fee_name' => 'Library',
                    'amount' => 1000,
                ],
            ],
        ])
        ->assertRedirect();

    $tuition = $enrollment->studentTuition()->first();

    expect($tuition?->overall_tuition)->toBe(5060.0)
        ->and($tuition?->total_lectures)->toBe(360.0)
        ->and($tuition?->total_laboratory)->toBe(200.0)
        ->and($tuition?->total_balance)->toBe(5060.0);
});

it('removes class enrollment when subject is removed from enrollment', function (): void {
    config(['activitylog.enabled' => false]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    $course = Course::factory()->create([
        'lec_per_unit' => 100,
        'lab_per_unit' => 200,
        'miscelaneous' => 3500,
    ]);

    $studentId = fake()->numberBetween(900000, 999999);
    $student = Student::factory()->createQuietly([
        'id' => $studentId,
        'course_id' => $course->id,
        'academic_year' => 1,
    ]);

    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'course_id' => $course->id,
        'school_year' => '2025 - 2026',
        'semester' => 1,
        'academic_year' => 1,
    ]);

    // Create two subjects
    $subject1 = Subject::factory()->create([
        'course_id' => $course->id,
        'lecture' => 3,
        'laboratory' => 0,
        'code' => 'ENG101',
    ]);

    $subject2 = Subject::factory()->create([
        'course_id' => $course->id,
        'lecture' => 3,
        'laboratory' => 1,
        'code' => 'CS101',
    ]);

    // Create classes for both subjects
    $class1 = App\Models\Classes::factory()->create([
        'subject_code' => $subject1->code,
        'subject_id' => $subject1->id,
        'course_codes' => [$course->id],
        'semester' => 1,
        'school_year' => '2025 - 2026',
    ]);

    $class2 = App\Models\Classes::factory()->create([
        'subject_code' => $subject2->code,
        'subject_id' => $subject2->id,
        'course_codes' => [$course->id],
        'semester' => 1,
        'school_year' => '2025 - 2026',
    ]);

    // Create subject enrollments
    $subjectEnrollment1 = $enrollment->subjectsEnrolled()->create([
        'subject_id' => $subject1->id,
        'class_id' => $class1->id,
        'student_id' => $student->id,
        'academic_year' => $enrollment->academic_year,
        'school_year' => $enrollment->school_year,
        'semester' => $enrollment->semester,
        'is_modular' => false,
        'lecture_fee' => 300,
        'laboratory_fee' => 0,
        'enrolled_lecture_units' => 3,
        'enrolled_laboratory_units' => 0,
    ]);

    $subjectEnrollment2 = $enrollment->subjectsEnrolled()->create([
        'subject_id' => $subject2->id,
        'class_id' => $class2->id,
        'student_id' => $student->id,
        'academic_year' => $enrollment->academic_year,
        'school_year' => $enrollment->school_year,
        'semester' => $enrollment->semester,
        'is_modular' => false,
        'lecture_fee' => 400,
        'laboratory_fee' => 200,
        'enrolled_lecture_units' => 3,
        'enrolled_laboratory_units' => 1,
    ]);

    // Create class enrollments for both subjects
    $classEnrollment1 = App\Models\ClassEnrollment::query()->create([
        'class_id' => $class1->id,
        'student_id' => $student->id,
        'status' => true,
    ]);

    $classEnrollment2 = App\Models\ClassEnrollment::query()->create([
        'class_id' => $class2->id,
        'student_id' => $student->id,
        'status' => true,
    ]);

    StudentTuition::query()->create([
        'enrollment_id' => $enrollment->id,
        'student_id' => $student->id,
        'total_tuition' => 0,
        'total_balance' => 0,
        'total_lectures' => 700,
        'total_laboratory' => 200,
        'total_miscelaneous_fees' => 3500,
        'discount' => 0,
        'downpayment' => 0,
        'overall_tuition' => 4400,
        'semester' => $enrollment->semester,
        'school_year' => $enrollment->school_year,
        'academic_year' => $enrollment->academic_year,
    ]);

    // Verify initial state
    expect($enrollment->subjectsEnrolled()->count())->toBe(2);
    expect(App\Models\ClassEnrollment::query()->where('student_id', $student->id)->count())->toBe(2);

    // Update enrollment, removing subject2 (keeping only subject1)
    $this->actingAs($user)
        ->put(portalUrlForAdministrators("/administrators/enrollments/{$enrollment->id}"), [
            'student_id' => $student->id,
            'semester' => 1,
            'academic_year' => 1,
            'subjects' => [
                [
                    'subject_id' => $subject1->id,
                    'class_id' => $class1->id,
                    'is_modular' => false,
                    'lecture_fee' => 300,
                    'laboratory_fee' => 0,
                    'enrolled_lecture_units' => 3,
                    'enrolled_laboratory_units' => 0,
                ],
                // Note: subject2 is intentionally removed
            ],
            'discount' => 0,
            'downpayment' => 0,
            'additional_fees' => [],
        ])
        ->assertRedirect();

    // Verify subject2 was removed and only subject1 remains
    $enrollment->refresh();
    expect($enrollment->subjectsEnrolled()->count())->toBe(1);
    expect($enrollment->subjectsEnrolled()->first()->subject_id)->toBe($subject1->id);

    // Verify class enrollment for subject2 was also deleted
    expect(App\Models\ClassEnrollment::query()->where('student_id', $student->id)->where('class_id', $class1->id)->exists())->toBeTrue();
    expect(App\Models\ClassEnrollment::query()->where('student_id', $student->id)->where('class_id', $class2->id)->exists())->toBeFalse();
});

it('excludes selected subjects from tuition calculations', function (): void {
    config(['activitylog.enabled' => false]);

    GeneralSetting::factory()->create([
        'school_starting_date' => '2026-06-01',
        'school_ending_date' => '2027-03-31',
        'semester' => 1,
    ]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    $course = Course::factory()->create([
        'lec_per_unit' => 100,
        'lab_per_unit' => 200,
        'miscelaneous' => 3500,
    ]);

    $student = Student::factory()->create([
        'id' => fake()->numberBetween(900000, 999999),
        'course_id' => $course->id,
        'academic_year' => 1,
    ]);

    $billableSubject = Subject::factory()->create([
        'course_id' => $course->id,
        'code' => 'GE-1',
        'lecture' => 3,
        'laboratory' => 0,
    ]);

    $excludedSubject = Subject::factory()->create([
        'course_id' => $course->id,
        'code' => 'CS-1',
        'lecture' => 3,
        'laboratory' => 1,
    ]);

    $this->actingAs($user)
        ->post(portalUrlForAdministrators('/administrators/enrollments'), [
            'student_id' => (string) $student->id,
            'semester' => 1,
            'academic_year' => 1,
            'subjects' => [
                [
                    'subject_id' => $billableSubject->id,
                    'class_id' => null,
                    'is_modular' => false,
                    'exclude_from_tuition' => false,
                    'lecture_fee' => 300,
                    'laboratory_fee' => 0,
                    'enrolled_lecture_units' => 3,
                    'enrolled_laboratory_units' => 0,
                ],
                [
                    'subject_id' => $excludedSubject->id,
                    'class_id' => null,
                    'is_modular' => false,
                    'exclude_from_tuition' => true,
                    'lecture_fee' => 400,
                    'laboratory_fee' => 200,
                    'enrolled_lecture_units' => 3,
                    'enrolled_laboratory_units' => 1,
                ],
            ],
            'discount' => 0,
            'downpayment' => 0,
            'additional_fees' => [
                [
                    'fee_name' => 'Library',
                    'amount' => 500,
                ],
            ],
        ])
        ->assertRedirect();

    $enrollment = StudentEnrollment::query()
        ->where('student_id', $student->id)
        ->firstOrFail();

    expect($enrollment->subjectsEnrolled()->where('subject_id', $excludedSubject->id)->first()?->exclude_from_tuition)->toBeTrue()
        ->and($enrollment->studentTuition()->first()?->total_lectures)->toBe(300.0)
        ->and($enrollment->studentTuition()->first()?->total_laboratory)->toBe(0.0)
        ->and($enrollment->studentTuition()->first()?->overall_tuition)->toBe(4300.0);
});

it('creates class enrollments when storing an enrollment with assigned classes', function (): void {
    config(['activitylog.enabled' => false]);

    GeneralSetting::factory()->create([
        'school_starting_date' => '2026-06-01',
        'school_ending_date' => '2027-03-31',
        'semester' => 1,
    ]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    $course = Course::factory()->create([
        'lec_per_unit' => 100,
        'lab_per_unit' => 200,
        'miscelaneous' => 3500,
    ]);

    $student = Student::factory()->create([
        'id' => fake()->numberBetween(900000, 999999),
        'course_id' => $course->id,
        'academic_year' => 1,
    ]);

    $subject = Subject::factory()->create([
        'course_id' => $course->id,
        'code' => 'GE-1',
        'lecture' => 3,
        'laboratory' => 0,
    ]);

    $class = App\Models\Classes::factory()->create([
        'subject_code' => $subject->code,
        'subject_id' => $subject->id,
        'course_codes' => [$course->id],
        'semester' => 1,
        'school_year' => '2026 - 2027',
    ]);

    $this->actingAs($user)
        ->post(portalUrlForAdministrators('/administrators/enrollments'), [
            'student_id' => (string) $student->id,
            'semester' => 1,
            'academic_year' => 1,
            'subjects' => [
                [
                    'subject_id' => $subject->id,
                    'class_id' => $class->id,
                    'is_modular' => false,
                    'lecture_fee' => 300,
                    'laboratory_fee' => 0,
                    'enrolled_lecture_units' => 3,
                    'enrolled_laboratory_units' => 0,
                ],
            ],
            'discount' => 0,
            'downpayment' => 0,
            'additional_fees' => [],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('student_enrollment', [
        'student_id' => $student->id,
        'semester' => 1,
    ]);

    expect(App\Models\ClassEnrollment::query()->where('student_id', $student->id)->where('class_id', $class->id)->exists())->toBeTrue();
});

it('only returns sections whose subject code matches exactly when fetching sections for a subject', function (): void {
    config(['activitylog.enabled' => false]);

    GeneralSetting::factory()->create([
        'school_starting_date' => '2026-06-01',
        'school_ending_date' => '2027-03-31',
        'semester' => 1,
    ]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    $bsba = Course::factory()->create(['code' => 'BSBA']);
    $otherCourse = Course::factory()->create(['code' => 'BSIT']);

    $mgmt1 = Subject::factory()->create([
        'course_id' => $bsba->id,
        'code' => 'MGMT 1',
        'lecture' => 3,
        'laboratory' => 0,
    ]);

    $bmgmt1 = Subject::factory()->create([
        'course_id' => $otherCourse->id,
        'code' => 'BMGMT 1',
        'lecture' => 3,
        'laboratory' => 0,
    ]);

    $correctClass = App\Models\Classes::factory()->create([
        'subject_code' => 'MGMT 1',
        'subject_id' => $mgmt1->id,
        'subject_ids' => [$mgmt1->id],
        'course_codes' => [$bsba->id],
        'semester' => 1,
        'school_year' => '2026 - 2027',
        'section' => 'A',
    ]);

    $falsePositivePrefixClass = App\Models\Classes::factory()->create([
        'subject_code' => 'BMGMT 1',
        'subject_id' => $bmgmt1->id,
        'subject_ids' => [$bmgmt1->id],
        'course_codes' => [$bsba->id, $otherCourse->id],
        'semester' => 1,
        'school_year' => '2026 - 2027',
        'section' => 'B',
    ]);

    $falsePositiveCsvClass = App\Models\Classes::factory()->create([
        'subject_code' => 'BMGMT 1, BMGMT 1',
        'subject_id' => $bmgmt1->id,
        'subject_ids' => [$bmgmt1->id],
        'course_codes' => [$bsba->id, $otherCourse->id],
        'semester' => 1,
        'school_year' => '2026 - 2027',
        'section' => 'C',
    ]);

    $response = $this->actingAs($user)->getJson(portalUrlForAdministrators(
        '/administrators/enrollments/api/sections?subject_id='.$mgmt1->id.'&course_id='.$bsba->id
    ));

    $response->assertOk();

    $ids = collect($response->json())->pluck('id')->all();

    expect($ids)->toContain($correctClass->id)
        ->and($ids)->not->toContain($falsePositivePrefixClass->id)
        ->and($ids)->not->toContain($falsePositiveCsvClass->id);
});

it('returns sections whose course_codes store the course id as a string', function (): void {
    config(['activitylog.enabled' => false]);

    GeneralSetting::factory()->create([
        'school_starting_date' => '2026-06-01',
        'school_ending_date' => '2027-03-31',
        'semester' => 1,
    ]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    $bsba = Course::factory()->create(['code' => 'BSBA']);

    $mgmt1 = Subject::factory()->create([
        'course_id' => $bsba->id,
        'code' => 'MGMT 1',
        'lecture' => 3,
        'laboratory' => 0,
    ]);

    $stringCodedClass = App\Models\Classes::factory()->create([
        'subject_code' => 'MGMT 1',
        'subject_id' => $mgmt1->id,
        'subject_ids' => [$mgmt1->id],
        'course_codes' => [(string) $bsba->id],
        'semester' => 1,
        'school_year' => '2026 - 2027',
        'section' => 'A',
    ]);

    $intCodedClass = App\Models\Classes::factory()->create([
        'subject_code' => 'MGMT 1',
        'subject_id' => $mgmt1->id,
        'subject_ids' => [$mgmt1->id],
        'course_codes' => [$bsba->id],
        'semester' => 1,
        'school_year' => '2026 - 2027',
        'section' => 'B',
    ]);

    $response = $this->actingAs($user)->getJson(portalUrlForAdministrators(
        '/administrators/enrollments/api/sections?subject_id='.$mgmt1->id.'&course_id='.$bsba->id
    ));

    $response->assertOk();

    $ids = collect($response->json())->pluck('id')->all();

    expect($ids)->toContain($stringCodedClass->id)
        ->and($ids)->toContain($intCodedClass->id);
});

it('returns sections whose subject_ids store the subject id as a string in json', function (): void {
    config(['activitylog.enabled' => false]);

    GeneralSetting::factory()->create([
        'school_starting_date' => '2026-06-01',
        'school_ending_date' => '2027-03-31',
        'semester' => 1,
    ]);

    $user = User::factory()->create(['role' => UserRole::Admin]);

    $bsba = Course::factory()->create(['code' => 'BSBA']);

    $cordi = Subject::factory()->create([
        'course_id' => $bsba->id,
        'code' => 'CORDI 101',
        'lecture' => 3,
        'laboratory' => 0,
    ]);

    $sectionA = App\Models\Classes::factory()->create([
        'subject_code' => 'CORDI 101, Cordi 101, cordi 101',
        'subject_id' => $cordi->id,
        'subject_ids' => [(string) $cordi->id],
        'course_codes' => [$bsba->id],
        'semester' => 1,
        'school_year' => '2026 - 2027',
        'section' => 'A',
    ]);

    $sectionB = App\Models\Classes::factory()->create([
        'subject_code' => 'cordi 101',
        'subject_id' => $cordi->id,
        'subject_ids' => [(string) $cordi->id],
        'course_codes' => [$bsba->id],
        'semester' => 1,
        'school_year' => '2026 - 2027',
        'section' => 'B',
    ]);

    $response = $this->actingAs($user)->getJson(portalUrlForAdministrators(
        '/administrators/enrollments/api/sections?subject_id='.$cordi->id.'&course_id='.$bsba->id
    ));

    $response->assertOk();

    $ids = collect($response->json())->pluck('id')->all();

    expect($ids)->toContain($sectionA->id)
        ->and($ids)->toContain($sectionB->id);
});

it('returns the school student_id in the search and details student endpoints', function (): void {
    $user = User::factory()->create(['role' => UserRole::Admin]);

    $course = Course::factory()->create(['code' => 'BSBA']);
    $student = Student::factory()->create([
        'student_id' => 208323,
        'course_id' => $course->id,
    ]);

    $searchResponse = $this->actingAs($user)->getJson(portalUrlForAdministrators(
        '/administrators/enrollments/api/students?search='.$student->last_name
    ));

    $searchResponse->assertOk();

    $match = collect($searchResponse->json())->firstWhere('id', $student->id);

    expect($match)->not->toBeNull()
        ->and((string) $match['student_id'])->toBe('208323');

    $detailsResponse = $this->actingAs($user)->getJson(portalUrlForAdministrators(
        '/administrators/enrollments/api/student-details?student_id='.$student->id
    ));

    $detailsResponse->assertOk();

    $details = $detailsResponse->json();
    expect($details['id'])->toBe($student->id)
        ->and((string) $details['student_id'])->toBe('208323');
});

it('finds a student in the search endpoint when typing their school student_id', function (): void {
    $user = User::factory()->create(['role' => UserRole::Admin]);

    $student = Student::factory()->create([
        'student_id' => 208323,
    ]);

    $response = $this->actingAs($user)->getJson(portalUrlForAdministrators(
        '/administrators/enrollments/api/students?search=208323'
    ));

    $response->assertOk();

    $ids = collect($response->json())->pluck('id')->all();

    expect($ids)->toContain($student->id);
});
