<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\Classes;
use App\Models\Course;
use App\Models\Faculty;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    if (! Schema::hasTable('activity_log')) {
        Schema::create('activity_log', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('log_name')->nullable();
            $table->text('description');
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->index(['subject_type', 'subject_id'], 'activity_log_subject_index');
            $table->string('causer_type')->nullable();
            $table->unsignedBigInteger('causer_id')->nullable();
            $table->index(['causer_type', 'causer_id'], 'activity_log_causer_index');
            $table->json('properties')->nullable();
            $table->uuid('batch_uuid')->nullable();
            $table->string('event')->nullable();
            $table->timestamps();
            $table->index('log_name');
        });
    }
});

it('stores a college class with schedules from the administrator page payload', function () {
    $user = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($user);

    $course = Course::factory()->create();
    $subject = Subject::factory()->create([
        'course_id' => $course->id,
        'code' => 'IT101',
        'title' => 'Programming Fundamentals',
    ]);
    $faculty = Faculty::factory()->create();
    $room = Room::factory()->create([
        'is_active' => true,
    ]);

    $response = $this->post(route('administrators.classes.store'), [
        'classification' => 'college',
        'course_codes' => [$course->id],
        'subject_ids' => [$subject->id],
        'subject_code' => 'IT101',
        'academic_year' => 1,
        'shs_track_id' => '',
        'shs_strand_id' => '',
        'subject_code_shs' => '',
        'grade_level' => '',
        'faculty_id' => $faculty->id,
        'semester' => '1',
        'school_year' => '2026 - 2027',
        'section' => 'A',
        'room_id' => $room->id,
        'maximum_slots' => 40,
        'schedules' => [
            [
                'day_of_week' => 'Monday',
                'start_time' => '08:00',
                'end_time' => '09:00',
                'room_id' => $room->id,
            ],
        ],
        'settings' => [
            'background_color' => '#ffffff',
            'accent_color' => '#3b82f6',
            'theme' => 'default',
            'enable_announcements' => true,
            'enable_grade_visibility' => true,
            'enable_attendance_tracking' => false,
            'allow_late_submissions' => false,
            'enable_discussion_board' => false,
            'custom' => [],
        ],
    ]);

    $response
        ->assertRedirect(route('administrators.classes.index'))
        ->assertSessionHas('flash.message', 'Class created successfully.');

    $class = Classes::query()->latest('id')->first();

    expect($class)->not->toBeNull();
    expect($class?->classification)->toBe('college');
    expect($class?->subject_id)->toBe($subject->id);
    expect($class?->section)->toBe('A');

    $schedule = Schedule::query()->where('class_id', $class?->id)->first();

    expect($schedule)->not->toBeNull();
    expect($schedule?->day_of_week)->toBe('Monday');
    expect($schedule?->start_time?->format('H:i'))->toBe('08:00');
    expect($schedule?->end_time?->format('H:i'))->toBe('09:00');
    expect($schedule?->room_id)->toBe($room->id);
});

it('renders the administrator class edit page with existing class data', function () {
    $user = User::factory()->create(['role' => UserRole::Admin]);
    $this->actingAs($user);

    $course = Course::factory()->create();
    $subject = Subject::factory()->create([
        'course_id' => $course->id,
        'code' => 'IT202',
        'title' => 'Data Structures',
    ]);
    $faculty = Faculty::factory()->create();
    $room = Room::factory()->create(['is_active' => true]);

    $class = Classes::factory()->create([
        'classification' => 'college',
        'course_codes' => [$course->id],
        'subject_ids' => [$subject->id],
        'subject_id' => $subject->id,
        'subject_code' => 'IT202',
        'academic_year' => 2,
        'faculty_id' => $faculty->id,
        'semester' => 1,
        'school_year' => '2026 - 2027',
        'section' => 'B',
        'room_id' => $room->id,
        'maximum_slots' => 35,
        'settings' => array_merge(Classes::getDefaultSettings(), [
            'accent_color' => '#ef4444',
            'enable_attendance_tracking' => true,
        ]),
    ]);

    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => 'Tuesday',
        'start_time' => '10:00',
        'end_time' => '11:30',
    ]);

    $this->get(route('administrators.classes.edit', $class))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('administrators/classes/create', false)
            ->where('mode', 'edit')
            ->where('class_id', $class->id)
            ->where('defaults.classification', 'college')
            ->where('defaults.course_codes.0', $course->id)
            ->where('defaults.subject_ids.0', $subject->id)
            ->where('defaults.subject_code', 'IT202')
            ->where('defaults.academic_year', 2)
            ->where('defaults.faculty_id', (string) $faculty->id)
            ->where('defaults.section', 'B')
            ->where('defaults.maximum_slots', 35)
            ->where('defaults.schedules.0.day_of_week', 'Tuesday')
            ->where('defaults.schedules.0.start_time', '10:00')
            ->where('defaults.schedules.0.end_time', '11:30')
            ->where('defaults.settings.accent_color', '#ef4444')
            ->where('defaults.settings.enable_attendance_tracking', true)
        );
});
