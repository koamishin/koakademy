<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\ClassEnrollment;
use App\Models\Classes;
use App\Models\ClassScheduleChange;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use App\Notifications\ClassScheduleChangedNotification;
use App\Services\ClassScheduleChangeNotificationService;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;

it('notifies enrolled students when a class schedule changes', function () {
    Notification::fake();

    $service = app(ClassScheduleChangeNotificationService::class);
    $oldRoom = Room::factory()->create(['name' => 'Room 101']);
    $newRoom = Room::factory()->create(['name' => 'Room 202']);
    $class = Classes::factory()->create([
        'room_id' => $oldRoom->id,
        'subject_code' => 'IT 101',
        'section' => 'A',
    ]);

    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $oldRoom->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    $studentUser = User::factory()->create([
        'role' => UserRole::Student,
        'email' => 'student@example.test',
    ]);
    $student = Student::factory()->create([
        'email' => 'student@example.test',
        'user_id' => $studentUser->id,
    ]);
    ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->id,
        'status' => true,
    ]);

    $oldSnapshot = $service->snapshot($class);

    $class->schedules()->delete();
    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $newRoom->id,
        'day_of_week' => 'Wednesday',
        'start_time' => '10:00',
        'end_time' => '11:30',
    ]);

    expect($service->notifyIfChanged($class, $oldSnapshot))->toBe(2);

    $scheduleChange = ClassScheduleChange::query()->where('class_id', $class->id)->first();
    expect($scheduleChange)->not->toBeNull()
        ->and($scheduleChange->studentNotifications()->where('student_id', $student->id)->whereNotNull('notified_at')->exists())->toBeTrue();

    Notification::assertSentTo($studentUser, ClassScheduleChangedNotification::class);
    Notification::assertSentOnDemand(
        ClassScheduleChangedNotification::class,
        fn (ClassScheduleChangedNotification $notification, array $channels, AnonymousNotifiable $notifiable): bool => $channels === ['mail']
            && ($notifiable->routes['mail'] ?? null) === 'student@example.test'
    );
});

it('does not notify when normalized schedules are unchanged', function () {
    Notification::fake();

    $service = app(ClassScheduleChangeNotificationService::class);
    $room = Room::factory()->create(['name' => 'Room 101']);
    $class = Classes::factory()->create(['room_id' => $room->id]);

    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    $student = Student::factory()->create(['email' => 'student@example.test']);
    ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->id,
        'status' => true,
    ]);

    $oldSnapshot = $service->snapshot($class);

    $class->schedules()->delete();
    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    expect($service->notifyIfChanged($class, $oldSnapshot))->toBe(0);

    expect(ClassScheduleChange::query()->where('class_id', $class->id)->exists())->toBeFalse();

    Notification::assertNothingSent();
});

it('does not notify inactive class enrollments', function () {
    Notification::fake();

    $service = app(ClassScheduleChangeNotificationService::class);
    $oldRoom = Room::factory()->create(['name' => 'Room 101']);
    $newRoom = Room::factory()->create(['name' => 'Room 202']);
    $class = Classes::factory()->create(['room_id' => $oldRoom->id]);

    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $oldRoom->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    $studentUser = User::factory()->create([
        'role' => UserRole::Student,
        'email' => 'student@example.test',
    ]);
    $student = Student::factory()->create([
        'email' => 'student@example.test',
        'user_id' => $studentUser->id,
    ]);
    ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->id,
        'status' => false,
    ]);

    $oldSnapshot = $service->snapshot($class);

    $class->schedules()->delete();
    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $newRoom->id,
        'day_of_week' => 'Tuesday',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);

    expect($service->notifyIfChanged($class, $oldSnapshot))->toBe(0);

    Notification::assertNothingSent();
});

it('records pending notifications when automatic schedule alerts are disabled', function () {
    Notification::fake();

    $service = app(ClassScheduleChangeNotificationService::class);
    $oldRoom = Room::factory()->create(['name' => 'Room 101']);
    $newRoom = Room::factory()->create(['name' => 'Room 202']);
    $class = Classes::factory()->create([
        'room_id' => $oldRoom->id,
        'semester' => 1,
        'school_year' => '2024 - 2025',
        'settings' => array_merge(Classes::getDefaultSettings(), [
            'notify_students_on_schedule_changes' => false,
        ]),
    ]);

    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $oldRoom->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    $student = Student::factory()->create(['email' => 'student@example.test']);
    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'semester' => 1,
        'school_year' => '2024 - 2025',
    ]);
    ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->id,
        'status' => true,
    ]);

    $oldSnapshot = $service->snapshot($class);

    $class->schedules()->delete();
    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $newRoom->id,
        'day_of_week' => 'Friday',
        'start_time' => '13:00',
        'end_time' => '14:30',
    ]);

    expect($service->notifyIfChanged($class, $oldSnapshot))->toBe(0);
    Notification::assertNothingSent();

    $pending = $service->pendingNotificationsForEnrollment($enrollment);

    expect($pending)->toHaveCount(1)
        ->and($service->previewPendingNotifications($pending)[0]['new_schedule'])->toContain('Friday, 1:00 PM-2:30 PM at Room 202');
});

it('manually notifies pending schedule changes for an enrollment', function () {
    Notification::fake();

    $service = app(ClassScheduleChangeNotificationService::class);
    $oldRoom = Room::factory()->create(['name' => 'Room 101']);
    $newRoom = Room::factory()->create(['name' => 'Room 202']);
    $class = Classes::factory()->create([
        'room_id' => $oldRoom->id,
        'semester' => 1,
        'school_year' => '2024 - 2025',
        'settings' => array_merge(Classes::getDefaultSettings(), [
            'notify_students_on_schedule_changes' => false,
        ]),
    ]);

    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $oldRoom->id,
        'day_of_week' => 'Monday',
        'start_time' => '08:00',
        'end_time' => '09:00',
    ]);

    $studentUser = User::factory()->create([
        'role' => UserRole::Student,
        'email' => 'student@example.test',
    ]);
    $student = Student::factory()->create([
        'email' => 'student@example.test',
        'user_id' => $studentUser->id,
    ]);
    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'semester' => 1,
        'school_year' => '2024 - 2025',
    ]);
    ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->id,
        'status' => true,
    ]);

    $oldSnapshot = $service->snapshot($class);

    $class->schedules()->delete();
    Schedule::factory()->create([
        'class_id' => $class->id,
        'room_id' => $newRoom->id,
        'day_of_week' => 'Tuesday',
        'start_time' => '10:00',
        'end_time' => '11:00',
    ]);

    $service->notifyIfChanged($class, $oldSnapshot);
    $result = $service->notifyPendingForEnrollment($enrollment);

    expect($result)->toBe(['count' => 1, 'recipients' => 2])
        ->and($service->pendingNotificationsForEnrollment($enrollment))->toHaveCount(0);

    Notification::assertSentTo($studentUser, ClassScheduleChangedNotification::class);
    Notification::assertSentOnDemand(ClassScheduleChangedNotification::class);
});
