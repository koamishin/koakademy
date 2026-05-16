<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\ClassEnrollment;
use App\Models\Classes;
use App\Models\Faculty;
use App\Models\Schedule as ClassSchedule;
use App\Models\User;
use App\Services\GeneralSettingsService;
use Database\Seeders\ClassEnrollmentSeeder;
use Database\Seeders\ClassSeeder;
use Database\Seeders\CourseSeeder;
use Database\Seeders\FacultySeeder;
use Database\Seeders\RolesSeeder;
use Database\Seeders\RoomSeeder;
use Database\Seeders\ScheduleSeeder;
use Database\Seeders\SchoolDepartmentSeeder;
use Database\Seeders\StudentRelatedTablesSeeder;
use Database\Seeders\StudentSeeder;
use Database\Seeders\SubjectSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\followingRedirects;
use function Pest\Laravel\post;

function useDemoEnvironment(): void
{
    app()->detectEnvironment(static fn (): string => 'demo');
}

function createDemoUser(string $email, UserRole $role): User
{
    Role::firstOrCreate(['name' => $role->value, 'guard_name' => 'web']);

    $user = User::factory()->create([
        'name' => (string) $role->getLabel(),
        'email' => $email,
        'role' => $role,
        'email_verified_at' => now(),
    ]);

    $user->assignRole($role->value);

    return $user;
}

it('schedules a daily destructive demo database refresh only for demo environment', function (): void {
    /** @var Schedule $schedule */
    $schedule = app(Schedule::class);

    $refreshEvent = null;

    foreach ($schedule->events() as $event) {
        if (str_contains($event->command, 'migrate:fresh')) {
            $refreshEvent = $event;
            break;
        }
    }

    expect($refreshEvent)->not->toBeNull('migrate:fresh should be scheduled for demo refresh')
        ->and($refreshEvent->command)->toContain('--seed')
        ->and($refreshEvent->command)->toContain('--force')
        ->and($refreshEvent->expression)->toBe('0 0 * * *')
        ->and($refreshEvent->environments)->toBe(['demo']);
});

it('shares demo mode details only when the application environment is demo', function (): void {
    useDemoEnvironment();

    $request = Request::create('/login');
    $shared = app(HandleInertiaRequests::class)->share($request);

    expect($shared['demoMode']['enabled'])->toBeTrue()
        ->and($shared['demoMode']['accounts'])->toHaveCount(3)
        ->and($shared['demoMode']['accounts'][0]['role'])->toBe('student');
});

it('logs in a fixed student demo account in demo environment', function (): void {
    useDemoEnvironment();

    $student = createDemoUser('john.student@student.koakademy.edu', UserRole::Student);

    $token = 'demo-login-csrf-token';

    $this->withSession(['_token' => $token]);

    post(portalUrlForAdministrators('/demo-login/student'), ['_token' => $token])
        ->assertRedirect('/student/dashboard');

    $this->assertAuthenticatedAs($student);
});

it('rejects demo login outside demo environment', function (): void {
    createDemoUser('admin@koakademy.edu', UserRole::Admin);

    post(portalUrlForAdministrators('/demo-login/admin'))
        ->assertNotFound();

    $this->assertGuest();
});

it('does not register the service worker in demo environment', function (): void {
    useDemoEnvironment();

    followingRedirects()
        ->get('https://portal.dccp.test/login')
        ->assertOk()
        ->assertSee('serviceWorker.getRegistrations', false)
        ->assertDontSee('src="https://portal.dccp.test/sw.js"', false);
});

it('keeps the demo faculty account aligned with faculty seed data', function (): void {
    $this->seed([
        SchoolDepartmentSeeder::class,
        RolesSeeder::class,
        UserSeeder::class,
        FacultySeeder::class,
    ]);

    $email = (string) config('demo.accounts.faculty.email');

    $user = User::query()->where('email', $email)->first();

    expect($user)->not->toBeNull()
        ->and($user?->faculty_id_number)->not->toBeNull()
        ->and($user?->faculty_id_number)->not->toBe('');

    $faculty = Faculty::query()
        ->where('email', $email)
        ->where('faculty_id_number', (string) $user?->faculty_id_number)
        ->first();

    expect($faculty)->not->toBeNull();
});

it('seeds three demo classes with ten enrolled students each for the demo faculty', function (): void {
    $this->seed([
        SchoolDepartmentSeeder::class,
        RolesSeeder::class,
        UserSeeder::class,
        CourseSeeder::class,
        RoomSeeder::class,
        FacultySeeder::class,
        SubjectSeeder::class,
        StudentRelatedTablesSeeder::class,
        StudentSeeder::class,
        ClassSeeder::class,
        ScheduleSeeder::class,
        ClassEnrollmentSeeder::class,
    ]);

    $demoFaculty = Faculty::query()->where('email', 'j.adams@koakademy.edu')->first();

    expect($demoFaculty)->not->toBeNull();

    $demoClasses = Classes::query()
        ->where('faculty_id', $demoFaculty?->id)
        ->whereIn('section', ['DEMO-A', 'DEMO-B', 'DEMO-C'])
        ->with('Subject')
        ->orderBy('section')
        ->get();

    $settings = app(GeneralSettingsService::class);
    $currentSchoolYear = $settings->getCurrentSchoolYearString();
    $currentSemester = $settings->getCurrentSemester();

    expect($demoClasses)->toHaveCount(3)
        ->and($demoClasses->pluck('Subject.course_id')->unique()->count())->toBeGreaterThanOrEqual(2)
        ->and($demoClasses->every(fn (Classes $class): bool => $class->school_year === $currentSchoolYear))->toBeTrue()
        ->and($demoClasses->every(fn (Classes $class): bool => (int) $class->semester === $currentSemester))->toBeTrue();

    foreach ($demoClasses as $demoClass) {
        $enrollmentCount = ClassEnrollment::query()
            ->where('class_id', $demoClass->id)
            ->count();

        $scheduleCount = ClassSchedule::query()
            ->where('class_id', $demoClass->id)
            ->count();

        expect($enrollmentCount)->toBe(10);
        expect($scheduleCount)->toBeGreaterThan(0);
    }
});
