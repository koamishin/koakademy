<?php

declare(strict_types=1);

use App\Filament\Pages\Timetable;
use App\Models\Classes;
use App\Models\Course;
use App\Models\Faculty;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\Subject;
use App\Services\GeneralSettingsService;
use Carbon\Carbon;

it('generates hourly positioning slots for the supported day', function (): void {
    $timeSlots = (new Timetable())->getTimeSlotsForPositioning();

    expect($timeSlots)->toHaveCount(15)
        ->and($timeSlots)->toContain('07:00', '21:00');
});

it('provides different empty slot messages based on view type', function (): void {
    $page = new Timetable();

    $page->selectedView = 'room';
    expect($page->getEmptySlotMessage())->toBe('Room Available');

    $page->selectedView = 'course';
    expect($page->getEmptySlotMessage())->toBe('No Class');

    $page->selectedView = 'faculty';
    expect($page->getEmptySlotMessage())->toBe('No Schedule');
});

it('generates timetable titles from the current selection contract', function (): void {
    $course = Course::factory()->create([
        'code' => 'BSIT',
        'title' => 'Bachelor of Science in Information Technology',
    ]);
    $room = Room::factory()->create(['name' => '401']);
    $page = new Timetable();

    $page->selectedView = 'course';
    $page->selectedId = (string) $course->id;
    expect($page->getTimetableTitle())
        ->toBe('Schedule Timetable - BSIT (Bachelor of Science in Information Technology)');

    $page->selectedView = 'room';
    $page->selectedId = (string) $room->id;
    expect($page->getTimetableTitle())->toBe('Schedule Timetable - Room 401');

    $page->selectedView = 'year_level';
    $page->selectedId = null;
    $page->selectedYearLevel = '3';
    expect($page->getTimetableTitle())->toBe('Schedule Timetable - 3rd Year');
});

it('filters loaded schedules by exact day and start time', function (): void {
    $schedule = Schedule::factory()->make([
        'day_of_week' => 'Monday',
        'start_time' => Carbon::createFromFormat('H:i', '08:00'),
        'end_time' => Carbon::createFromFormat('H:i', '09:30'),
    ]);
    $page = new Timetable();
    $page->schedules = collect([$schedule]);

    expect($page->getScheduleForDayAndTime('Monday', '08:00'))->toHaveCount(1)
        ->and($page->getScheduleForDayAndTime('Tuesday', '08:00'))->toBeEmpty()
        ->and($page->getScheduleForDayAndTime('Monday', '08:30'))->toBeEmpty();
});

it('generates schedule card data from current model relationships', function (): void {
    $course = Course::factory()->create(['is_active' => true]);
    $subject = Subject::factory()->create([
        'course_id' => $course->id,
        'code' => 'IT101',
        'title' => 'Introduction to Computing',
    ]);
    $room = Room::factory()->create(['name' => '401']);
    $faculty = Faculty::factory()->create([
        'first_name' => 'John',
        'last_name' => 'Doe',
        'middle_name' => null,
    ]);
    $class = Classes::factory()->create([
        'subject_id' => $subject->id,
        'subject_code' => $subject->code,
        'faculty_id' => $faculty->id,
        'room_id' => $room->id,
        'course_codes' => [$course->id],
        'section' => 'A',
        'maximum_slots' => 40,
    ]);
    $schedule = Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => 'Friday',
        'start_time' => Carbon::createFromFormat('H:i', '14:00'),
        'end_time' => Carbon::createFromFormat('H:i', '15:30'),
    ]);

    $cardData = (new Timetable())->getScheduleCardData($schedule);

    expect($cardData)->toMatchArray([
        'subject' => 'Introduction to Computing',
        'faculty' => 'Doe, John',
        'room' => '401',
        'section' => 'A',
        'max_slots' => 40,
        'class_id' => $class->id,
    ]);
});

it('loads schedules for a selected room', function (): void {
    $room = Room::factory()->create();
    $settings = app(GeneralSettingsService::class);
    $class = Classes::factory()->create([
        'room_id' => $room->id,
        'school_year' => $settings->getCurrentSchoolYearString(),
        'semester' => $settings->getCurrentSemester(),
    ]);
    $schedule = Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $room->id,
    ]);
    Schedule::factory()->create();
    $page = new Timetable();
    $page->selectedView = 'room';
    $page->selectedId = (string) $room->id;

    $page->loadSchedules();

    expect($page->schedules)->toHaveCount(1)
        ->and($page->schedules->first()->is($schedule))->toBeTrue();
});

it('provides timetable view data for rendering', function (): void {
    $page = new Timetable();
    $page->schedules = collect();

    $viewData = $page->getViewData();

    expect($viewData['timeSlots'])->toHaveCount(15)
        ->and($viewData['days'])->toBe([
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
        ])
        ->and($viewData['schedules'])->toBeEmpty();
});
