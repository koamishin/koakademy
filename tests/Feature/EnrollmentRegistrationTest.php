<?php

declare(strict_types=1);

use App\Enums\StudentStatus;
use App\Enums\StudentType;
use App\Models\Classes;
use App\Models\Course;
use App\Models\GeneralSetting;
use App\Models\School;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    //
});

it('can view enrollment page', function () {
    $response = $this->get(route('enrollment.create'));
    $response->assertStatus(200);
});

it('allows tesda student registration', function () {
    // Create a TESDA course
    $course = Course::factory()->create([
        'department' => 'TESDA',
        'is_active' => true,
    ]);

    $data = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'student_type' => 'tesda',
        'course_id' => $course->id,
        'birth_date' => '2000-01-01',
        'gender' => 'male',
        'nationality' => 'Filipino',
        'address' => '123 Test St',
        'email' => 'john@example.com',
        'phone' => '09123456789',
        'civil_status' => 'Single',
        'income_bracket_mode' => 'annual',
        'use_same_parent_income' => true,
        'family_income_bracket' => 'below_250k',
        'contacts' => [
            'personal_contact' => '09123456789',
            'emergency_contact_name' => 'Jane Doe',
            'emergency_contact_phone' => '09987654321',
            'emergency_contact_relationship' => 'Mother',
        ],
        'parents' => [
            'father_name' => 'Father Doe',
            'mother_name' => 'Mother Doe',
            'guardian_name' => 'Jane Doe',
            'guardian_relationship' => 'Mother',
            'guardian_contact' => '09987654321',
        ],
        'education' => [
            'elementary_school' => 'Elem School',
        ],
        'consent' => true,
    ];

    $response = $this->post(route('enrollment.store'), $data);

    $response->assertRedirect(route('enrollment.create'));
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('students', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'student_type' => StudentType::TESDA,
        'status' => StudentStatus::Applicant,
        'course_id' => $course->id,
    ]);
});

it('prevents college student registration', function () {
    // Create a non-TESDA course
    $course = Course::factory()->create([
        'department' => 'IT',
        'is_active' => true,
    ]);

    $data = [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'student_type' => 'college', // Attempt college registration
        'course_id' => $course->id,
        'birth_date' => '2001-01-01',
        'gender' => 'female',
        'nationality' => 'Filipino',
        'address' => '456 Test Ave',
        'department' => 'IT',
        'academic_year' => 1,
        'income_bracket_mode' => 'annual',
        'use_same_parent_income' => true,
        'family_income_bracket' => 'below_250k',
        'contacts' => [
            'emergency_contact_name' => 'John Smith',
            'emergency_contact_phone' => '09111111111',
            'emergency_contact_relationship' => 'Father',
        ],
        'parents' => [
            'guardian_name' => 'John Smith',
            'guardian_relationship' => 'Father',
            'guardian_contact' => '09111111111',
        ],
        'consent' => true,
    ];

    $response = $this->post(route('enrollment.store'), $data);

    $response->assertRedirect();
    $response->assertSessionHas('flash.error', 'College online registration is currently unavailable.');

    $this->assertDatabaseMissing('students', [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
    ]);
});

it('validates tesda course mismatch', function () {
    // Create a non-TESDA course
    $course = Course::factory()->create([
        'department' => 'IT',
        'is_active' => true,
    ]);

    $data = [
        'first_name' => 'Bob',
        'last_name' => 'Builder',
        'student_type' => 'tesda',
        'course_id' => $course->id, // Mismatch: TESDA student, IT course
        'birth_date' => '1999-01-01',
        'gender' => 'male',
        'nationality' => 'Filipino',
        'address' => '789 Test Rd',
        'income_bracket_mode' => 'annual',
        'use_same_parent_income' => true,
        'family_income_bracket' => 'below_250k',
        'contacts' => [
            'emergency_contact_name' => 'Alice Builder',
            'emergency_contact_phone' => '09222222222',
            'emergency_contact_relationship' => 'Wife',
        ],
        'parents' => [
            'guardian_name' => 'Alice Builder',
            'guardian_relationship' => 'Wife',
            'guardian_contact' => '09222222222',
        ],
        'consent' => true,
    ];

    $response = $this->post(route('enrollment.store'), $data);

    $response->assertRedirect();
    $response->assertSessionHas('flash.error', 'TESDA applicants must select a TESDA course/program.');

    $this->assertDatabaseMissing('students', [
        'first_name' => 'Bob',
        'last_name' => 'Builder',
    ]);
});

it('auto creates student enrollment for new applicants when pipeline automation is enabled', function () {
    $course = Course::factory()->create([
        'department' => 'TESDA',
        'is_active' => true,
    ]);

    GeneralSetting::query()->updateOrCreate(
        ['site_name' => 'KoAkademy'],
        [
            'semester' => 1,
            'more_configs' => [
                'enrollment_pipeline' => [
                    'submitted_label' => 'Submitted',
                    'steps' => [
                        ['key' => 'pending', 'status' => 'Pending', 'label' => 'Pending', 'color' => 'yellow', 'allowed_roles' => [], 'action_type' => 'standard'],
                    ],
                    'entry_step_key' => 'pending',
                    'completion_step_key' => 'pending',
                    'automation' => [
                        'auto_create_student_enrollment' => true,
                        'auto_assign_subjects' => false,
                        'default_new_applicant_to_first_year' => true,
                    ],
                ],
            ],
        ],
    );

    $response = $this->post(route('enrollment.store'), [
        'first_name' => 'Auto',
        'last_name' => 'Applicant',
        'student_type' => 'tesda',
        'course_id' => $course->id,
        'birth_date' => '2000-01-01',
        'gender' => 'male',
        'nationality' => 'Filipino',
        'address' => '123 Test St',
        'income_bracket_mode' => 'annual',
        'use_same_parent_income' => true,
        'family_income_bracket' => 'below_250k',
        'contacts' => [
            'emergency_contact_name' => 'Jane Doe',
            'emergency_contact_phone' => '09987654321',
        ],
        'parents' => [
            'guardian_name' => 'Jane Doe',
            'guardian_relationship' => 'Mother',
            'guardian_contact' => '09987654321',
        ],
        'consent' => true,
    ]);

    $response->assertRedirect(route('enrollment.create'));

    $student = Student::query()->where('first_name', 'Auto')->where('last_name', 'Applicant')->first();
    expect($student)->not->toBeNull();

    $this->assertDatabaseHas('student_enrollment', [
        'student_id' => $student?->id,
        'course_id' => $course->id,
    ]);
});

it('auto assigns first year subjects and open classes when enabled', function () {
    $course = Course::factory()->create([
        'department' => 'TESDA',
        'is_active' => true,
    ]);

    $subject = Subject::factory()->create([
        'course_id' => $course->id,
        'academic_year' => 1,
        'semester' => 1,
    ]);

    $settings = GeneralSetting::query()->updateOrCreate(
        ['site_name' => 'KoAkademy'],
        [
            'semester' => 1,
            'school_starting_date' => now()->startOfYear()->toDateString(),
            'school_ending_date' => now()->endOfYear()->toDateString(),
            'more_configs' => [
                'enrollment_pipeline' => [
                    'submitted_label' => 'Submitted',
                    'steps' => [
                        ['key' => 'pending', 'status' => 'Pending', 'label' => 'Pending', 'color' => 'yellow', 'allowed_roles' => [], 'action_type' => 'standard'],
                    ],
                    'entry_step_key' => 'pending',
                    'completion_step_key' => 'pending',
                    'automation' => [
                        'auto_create_student_enrollment' => true,
                        'auto_assign_subjects' => true,
                        'default_new_applicant_to_first_year' => true,
                    ],
                ],
            ],
        ],
    );

    $schoolYear = $settings->getSchoolYearString();

    $class = Classes::factory()->create([
        'subject_id' => $subject->id,
        'subject_ids' => [$subject->id],
        'subject_code' => $subject->code,
        'academic_year' => 1,
        'semester' => 1,
        'school_year' => $schoolYear,
        'course_codes' => [$course->id],
        'maximum_slots' => 40,
    ]);

    $response = $this->post(route('enrollment.store'), [
        'first_name' => 'Assign',
        'last_name' => 'Subjects',
        'student_type' => 'tesda',
        'course_id' => $course->id,
        'birth_date' => '2000-01-01',
        'gender' => 'male',
        'nationality' => 'Filipino',
        'address' => '123 Test St',
        'academic_year' => 3,
        'income_bracket_mode' => 'annual',
        'use_same_parent_income' => true,
        'family_income_bracket' => 'below_250k',
        'contacts' => [
            'emergency_contact_name' => 'Jane Doe',
            'emergency_contact_phone' => '09987654321',
        ],
        'parents' => [
            'guardian_name' => 'Jane Doe',
            'guardian_relationship' => 'Mother',
            'guardian_contact' => '09987654321',
        ],
        'consent' => true,
    ]);

    $response->assertRedirect(route('enrollment.create'));

    $student = Student::query()->where('first_name', 'Assign')->where('last_name', 'Subjects')->first();
    expect($student)->not->toBeNull();

    $enrollment = StudentEnrollment::query()->where('student_id', $student?->id)->first();
    expect($enrollment)->not->toBeNull();
    expect($enrollment?->academic_year)->toBe(1);

    $this->assertDatabaseHas('subject_enrollments', [
        'enrollment_id' => $enrollment?->id,
        'subject_id' => $subject->id,
        'student_id' => $student?->id,
        'class_id' => $class->id,
    ]);

    $this->assertDatabaseHas('class_enrollments', [
        'student_id' => $student?->id,
        'class_id' => $class->id,
    ]);
});

it('saves continuing enrollment using first school when no active school exists', function () {
    GeneralSetting::query()->create([
        'site_name' => 'KoAkademy',
        'school_starting_date' => now()->startOfYear()->toDateString(),
        'school_ending_date' => now()->endOfYear()->toDateString(),
        'semester' => 1,
    ]);

    DB::table('schools')->delete();

    School::factory()->inactive()->create();
    School::factory()->inactive()->create();

    $course = Course::factory()->create([
        'is_active' => true,
    ]);

    $student = Student::factory()->create([
        'course_id' => $course->id,
        'email' => 'returning.student@example.com',
        'student_id' => 200123,
        'academic_year' => 1,
    ]);

    $student->update([
        'school_id' => null,
        'institution_id' => null,
    ]);

    $subject = Subject::factory()->create([
        'course_id' => $course->id,
        'academic_year' => 2,
        'semester' => 1,
    ]);

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $superAdmin = User::factory()->create([
        'role' => 'super_admin',
    ]);

    $response = $this->post(route('enrollment.continuing.store'), [
        'email' => 'returning.student@example.com',
        'student_id' => '200123',
        'academic_year' => 2,
        'subjects' => [
            [
                'subject_id' => $subject->id,
                'is_modular' => false,
                'lecture_fee' => 1200,
                'laboratory_fee' => 300,
                'enrolled_lecture_units' => 3,
                'enrolled_laboratory_units' => 1,
            ],
        ],
        'consent' => true,
    ]);

    $response->assertRedirect(route('enrollment.create'));
    $response->assertSessionHas('flash.success');

    $enrollment = StudentEnrollment::query()
        ->withoutSchoolScope()
        ->where('student_id', $student->id)
        ->latest('id')
        ->first();

    expect($enrollment)->not->toBeNull();
    expect($enrollment?->school_id)->not->toBeNull();
    $this->assertDatabaseHas('schools', [
        'id' => $enrollment?->school_id,
    ]);

    $this->assertDatabaseHas('subject_enrollments', [
        'enrollment_id' => $enrollment?->id,
        'student_id' => $student->id,
        'subject_id' => $subject->id,
        'school_id' => $enrollment?->school_id,
    ]);

    // Verify admin notifications were created
    $this->assertDatabaseHas('notifications', [
        'notifiable_type' => User::class,
        'notifiable_id' => $admin->id,
        'type' => 'Filament\Notifications\DatabaseNotification',
    ]);

    $this->assertDatabaseHas('notifications', [
        'notifiable_type' => User::class,
        'notifiable_id' => $superAdmin->id,
        'type' => 'Filament\Notifications\DatabaseNotification',
    ]);
});
