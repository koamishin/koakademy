<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Features\Toggles\StudentSchedule as StudentScheduleFeature;
use App\Models\ClassEnrollment;
use App\Models\Classes;
use App\Models\Course;
use App\Models\Faculty;
use App\Models\Room;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Pennant\Feature;

test('student can view schedule page', function () {
    // Create student user
    $user = User::factory()->create(['role' => UserRole::Student]);

    // Create student record
    $course = Course::factory()->create();
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'email' => $user->email,
        'course_id' => $course->id,
    ]);

    // Create a class
    $subject = Subject::factory()->create(['course_id' => $course->id]);
    $room = Room::factory()->create();
    $faculty = Faculty::factory()->create();

    $class = Classes::create([
        'subject_code' => $subject->code,
        'section' => 'A',
        'room_id' => $room->id,
        'faculty_id' => $faculty->id,
        'maximum_slots' => 40,
        'semester' => '1',
        'school_year' => '2023-2024',
        'subject_id' => $subject->id,
    ]);

    // Create Schedule
    App\Models\Schedule::create([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    // Create General Settings
    App\Models\GeneralSetting::create([
        'school_starting_date' => '2023-08-01',
        'school_ending_date' => '2024-05-31',
        'semester' => 1,
    ]);

    Feature::activateForEveryone(StudentScheduleFeature::class);

    // Enroll student in term
    $enrollment = App\Models\StudentEnrollment::create([
        'student_id' => $student->id,
        'course_id' => $course->id,
        'semester' => 1,
        'academic_year' => 1,
        'school_year' => '2023-2024',
        'status' => 'Enrolled',
    ]);

    // Enroll student in class
    ClassEnrollment::create([
        'class_id' => $class->id,
        'student_id' => $student->id,
    ]);

    config(['inertia.testing.ensure_pages_exist' => false]);

    $this->actingAs($user)
        ->get(route('student.schedule'))
        ->assertStatus(200)
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/schedule')
            ->has('faculty_data.classes', 1)
            ->where('faculty_data.classes.0.id', $class->id)
            ->has('rooms')
        );
});

test('non-student cannot view schedule page', function () {
    $user = User::factory()->create(['role' => UserRole::Instructor]);

    $this->actingAs($user)
        ->get(route('student.schedule'))
        ->assertForbidden();
});

test('schedule output deduplicates active class enrollments and excludes inactive enrollments', function () {
    $user = User::factory()->create(['role' => UserRole::Student]);
    $student = Student::factory()->create(['user_id' => $user->id, 'email' => $user->email]);

    App\Models\GeneralSetting::factory()->createOne([
        'school_starting_date' => '2026-06-22',
        'school_ending_date' => '2027-04-30',
        'semester' => 1,
    ]);

    $activeClass = Classes::factory()->createOne(['school_year' => '2026 - 2027', 'semester' => 1]);
    $inactiveClass = Classes::factory()->createOne(['school_year' => '2026 - 2027', 'semester' => 1]);

    ClassEnrollment::factory()->count(2)->create([
        'student_id' => $student->id,
        'class_id' => $activeClass->id,
        'status' => true,
    ]);
    ClassEnrollment::factory()->createOne([
        'student_id' => $student->id,
        'class_id' => $inactiveClass->id,
        'status' => false,
    ]);

    Feature::activateForEveryone(StudentScheduleFeature::class);
    config(['inertia.testing.ensure_pages_exist' => false]);

    $this->actingAs($user)
        ->get(route('student.schedule'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('faculty_data.classes', 1)
            ->where('faculty_data.classes.0.id', $activeClass->id)
            ->has('schedule_conflicts', 0)
        );

    expect(ClassEnrollment::query()->where('student_id', $student->id)->count())->toBe(3);
});

test('schedule reports partial overlaps between different classes regardless of room', function () {
    $user = User::factory()->create(['role' => UserRole::Student]);
    $student = Student::factory()->create(['user_id' => $user->id, 'email' => $user->email]);
    $firstRoom = Room::factory()->createOne();
    $secondRoom = Room::factory()->createOne();

    App\Models\GeneralSetting::factory()->createOne([
        'school_starting_date' => '2026-06-22',
        'school_ending_date' => '2027-04-30',
        'semester' => 1,
    ]);

    $firstClass = Classes::factory()->createOne(['school_year' => '2026 - 2027', 'semester' => 1, 'room_id' => $firstRoom->id]);
    $secondClass = Classes::factory()->createOne(['school_year' => '2026 - 2027', 'semester' => 1, 'room_id' => $secondRoom->id]);

    App\Models\Schedule::factory()->createOne([
        'class_id' => $firstClass->id,
        'room_id' => $firstRoom->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '10:00',
    ]);
    App\Models\Schedule::factory()->createOne([
        'class_id' => $secondClass->id,
        'room_id' => $secondRoom->id,
        'day_of_week' => 'Monday',
        'start_time' => '09:00',
        'end_time' => '11:00',
    ]);

    foreach ([$firstClass, $secondClass] as $class) {
        ClassEnrollment::factory()->createOne(['student_id' => $student->id, 'class_id' => $class->id, 'status' => true]);
    }

    Feature::activateForEveryone(StudentScheduleFeature::class);
    config(['inertia.testing.ensure_pages_exist' => false]);

    $this->actingAs($user)
        ->get(route('student.schedule'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('schedule_conflicts', 1)
            ->where('schedule_conflicts.0.day', 'Monday')
            ->where('schedule_conflicts.0.overlap_start', '09:00')
            ->where('schedule_conflicts.0.overlap_end', '10:00')
            ->has('schedule_conflicts.0.classes', 2)
        );
});

test('schedule does not report touching times or overlaps within the same class as student conflicts', function () {
    $user = User::factory()->create(['role' => UserRole::Student]);
    $student = Student::factory()->create(['user_id' => $user->id, 'email' => $user->email]);
    $room = Room::factory()->createOne();

    App\Models\GeneralSetting::factory()->createOne([
        'school_starting_date' => '2026-06-22',
        'school_ending_date' => '2027-04-30',
        'semester' => 1,
    ]);

    $firstClass = Classes::factory()->createOne(['school_year' => '2026 - 2027', 'semester' => 1, 'room_id' => $room->id]);
    $secondClass = Classes::factory()->createOne(['school_year' => '2026 - 2027', 'semester' => 1, 'room_id' => $room->id]);

    foreach ([
        [$firstClass, '08:00', '10:00'],
        [$firstClass, '09:00', '11:00'],
        [$secondClass, '11:00', '12:00'],
    ] as [$class, $start, $end]) {
        App\Models\Schedule::factory()->createOne([
            'class_id' => $class->id,
            'room_id' => $room->id,
            'day_of_week' => 'Tuesday',
            'start_time' => $start,
            'end_time' => $end,
        ]);
    }

    foreach ([$firstClass, $secondClass] as $class) {
        ClassEnrollment::factory()->createOne(['student_id' => $student->id, 'class_id' => $class->id, 'status' => true]);
    }

    Feature::activateForEveryone(StudentScheduleFeature::class);
    config(['inertia.testing.ensure_pages_exist' => false]);

    $this->actingAs($user)
        ->get(route('student.schedule'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('schedule_conflicts', 0));
});
