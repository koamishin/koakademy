<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia;

use function Pest\Laravel\actingAs;

it('displays active and inactive courses correctly on student create page', function (): void {
    $user = User::factory()->create(['role' => UserRole::Admin]);

    $activeCourse = Course::factory()->create([
        'code' => 'ACTIVE',
        'title' => 'Active Course',
        'is_active' => true,
    ]);

    $inactiveCourse = Course::factory()->create([
        'code' => 'INACTIVE',
        'title' => 'Inactive Course',
        'is_active' => false,
    ]);

    Student::factory()->create(['religion' => 'Roman Catholic']);
    Student::factory()->create(['religion' => "Baha'i Faith"]);
    Student::factory()->create(['religion' => '   ']);

    actingAs($user)
        ->get(portalUrlForAdministrators('/administrators/students/create'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('administrators/students/create', false)
            ->has('options.courses', 2)
            ->where('options.courses.0.value', $activeCourse->id)
            ->where('options.courses.0.is_active', true)
            ->where('options.courses.1.value', $inactiveCourse->id)
            ->where('options.courses.1.is_active', false)
            ->where('options.courses.1.label', 'INACTIVE - Inactive Course (Inactive)')
            ->has('options.religions', 2)
            ->where('options.religions.0.value', "Baha'i Faith")
            ->where('options.religions.0.label', "Baha'i Faith")
            ->where('options.religions.1.value', 'Roman Catholic')
        );
});

it('stores related student information from the create page', function (): void {
    $user = User::factory()->create(['role' => UserRole::Admin]);
    $course = Course::factory()->create(['is_active' => true]);

    $response = actingAs($user)
        ->post(portalUrlForAdministrators('/administrators/students'), [
            'student_type' => 'college',
            'student_id' => '212345',
            'status' => 'enrolled',
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'middle_name' => 'Santos',
            'suffix' => 'Jr.',
            'gender' => 'male',
            'birth_date' => '2004-05-10',
            'email' => 'juan.delacruz@example.test',
            'phone' => '09170000000',
            'civil_status' => 'single',
            'nationality' => 'filipino',
            'religion' => 'Roman Catholic',
            'course_id' => (string) $course->id,
            'academic_year' => '1',
            'remarks' => 'Test student',
            'personal_contact' => '09171111111',
            'facebook_contact' => 'facebook.com/juan.delacruz',
            'emergency_contact_name' => 'Maria Dela Cruz',
            'emergency_contact_phone' => '09172222222',
            'emergency_contact_address' => '123 Guardian Street',
            'fathers_name' => 'Pedro Dela Cruz',
            'mothers_name' => 'Maria Dela Cruz',
            'current_address' => '123 Current Street',
            'permanent_address' => '456 Permanent Street',
            'birthplace' => 'Manila',
            'elementary_school' => 'Sample Elementary School',
            'elementary_graduate_year' => '2016',
            'elementary_school_address' => 'Elementary Address',
            'junior_high_school_name' => 'Sample Junior High School',
            'junior_high_graduation_year' => '2020',
            'junior_high_school_address' => 'Junior High Address',
            'senior_high_name' => 'Sample Senior High School',
            'senior_high_graduate_year' => '2022',
            'senior_high_address' => 'Senior High Address',
            'ethnicity' => 'Tagalog',
            'region_of_origin' => 'NCR',
            'province_of_origin' => 'Metro Manila',
            'city_of_origin' => 'Manila',
            'is_indigenous_person' => false,
            'scholarship_type' => 'none',
            'employment_status' => 'not_applicable',
        ]);

    $student = Student::withoutGlobalScopes()
        ->where('student_id', 212345)
        ->firstOrFail();

    $response->assertRedirect(route('administrators.students.edit', $student));

    expect($student->student_contact_id)->not->toBeNull()
        ->and($student->student_parent_info)->not->toBeNull()
        ->and($student->student_education_id)->not->toBeNull()
        ->and($student->student_personal_id)->not->toBeNull()
        ->and($student->phone)->toBe('09170000000')
        ->and($student->civil_status)->toBe('single')
        ->and($student->nationality)->toBe('filipino')
        ->and($student->religion)->toBe('Roman Catholic')
        ->and($student->status->value)->toBe('enrolled');

    $contact = DB::table('student_contacts')->where('id', $student->student_contact_id)->first();
    expect($contact)->not->toBeNull()
        ->and($contact->personal_contact)->toBe('09171111111')
        ->and($contact->emergency_contact_name)->toBe('Maria Dela Cruz')
        ->and($contact->emergency_contact_phone)->toBe('09172222222');

    if (Schema::hasColumn('student_contacts', 'emergency_contact_address')) {
        expect($contact->emergency_contact_address)->toBe('123 Guardian Street');
    }

    if (Schema::hasColumn('student_contacts', 'facebook_contact')) {
        expect($contact->facebook_contact)->toBe('facebook.com/juan.delacruz');
    }

    $parent = DB::table('student_parents_info')->where('id', $student->student_parent_info)->first();
    $fatherColumn = Schema::hasColumn('student_parents_info', 'fathers_name') ? 'fathers_name' : 'father_name';
    $motherColumn = Schema::hasColumn('student_parents_info', 'mothers_name') ? 'mothers_name' : 'mother_name';

    expect($parent)->not->toBeNull()
        ->and($parent->{$fatherColumn})->toBe('Pedro Dela Cruz')
        ->and($parent->{$motherColumn})->toBe('Maria Dela Cruz');

    $education = DB::table('student_education_info')->where('id', $student->student_education_id)->first();
    $elementaryYearColumn = Schema::hasColumn('student_education_info', 'elementary_graduate_year')
        ? 'elementary_graduate_year'
        : 'elementary_year_graduated';
    $juniorHighColumn = Schema::hasColumn('student_education_info', 'junior_high_school_name')
        ? 'junior_high_school_name'
        : 'high_school';

    expect($education)->not->toBeNull()
        ->and($education->elementary_school)->toBe('Sample Elementary School')
        ->and($education->{$elementaryYearColumn})->toBe('2016')
        ->and($education->{$juniorHighColumn})->toBe('Sample Junior High School');

    $personal = DB::table('students_personal_info')->where('id', $student->student_personal_id)->first();
    $birthplaceColumn = Schema::hasColumn('students_personal_info', 'birthplace') ? 'birthplace' : 'place_of_birth';

    expect($personal)->not->toBeNull()
        ->and($personal->{$birthplaceColumn})->toBe('Manila');

    if (Schema::hasColumn('students_personal_info', 'current_adress')) {
        expect($personal->current_adress)->toBe('123 Current Street');
    }

    if (Schema::hasColumn('students_personal_info', 'permanent_address')) {
        expect($personal->permanent_address)->toBe('456 Permanent Street');
    }

    expect(DB::table('student_statuses')->where('student_id', $student->id)->where('status', 'enrolled')->exists())->toBeTrue();
});

it('updates facebook contact from the student edit payload', function (): void {
    $user = User::factory()->create(['role' => UserRole::Admin]);
    $course = Course::factory()->create(['is_active' => true]);

    $student = Student::factory()->create([
        'student_type' => 'college',
        'student_id' => 298765,
        'course_id' => $course->id,
        'academic_year' => 1,
        'first_name' => 'Old',
        'last_name' => 'Student',
        'gender' => 'male',
        'birth_date' => '2003-01-01',
        'status' => 'enrolled',
        'student_contact_id' => null,
    ]);

    actingAs($user)
        ->put(portalUrlForAdministrators('/administrators/students/'.$student->id), [
            'student_type' => 'college',
            'student_id' => '298765',
            'status' => 'enrolled',
            'first_name' => 'Old',
            'last_name' => 'Student',
            'middle_name' => '',
            'suffix' => '',
            'gender' => 'male',
            'birth_date' => '2003-01-01',
            'email' => 'old.student@example.test',
            'phone' => '09170000009',
            'course_id' => (string) $course->id,
            'academic_year' => '1',
            'facebook_contact' => 'facebook.com/updated.student',
        ])
        ->assertRedirect();

    $student->refresh();
    expect($student->student_contact_id)->not->toBeNull();

    if (! Schema::hasColumn('student_contacts', 'facebook_contact')) {
        return;
    }

    $contact = DB::table('student_contacts')->where('id', $student->student_contact_id)->first();
    expect($contact)->not->toBeNull()
        ->and($contact->facebook_contact)->toBe('facebook.com/updated.student');
});
