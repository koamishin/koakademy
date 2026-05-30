<?php

declare(strict_types=1);

namespace Tests\Feature\Faculty;

use App\Features\Toggles\FacultyGrades;
use App\Models\ClassEnrollment;
use App\Models\Classes;
use App\Models\Faculty;
use App\Models\GeneralSetting;
use App\Models\Student;
use App\Models\User;
use App\Services\GeneralSettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Pennant\Feature;
use Tests\TestCase;

final class GradesRouteTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Faculty $faculty;

    protected Classes $class;

    protected function setUp(): void
    {
        parent::setUp();

        GeneralSetting::query()->create([
            'school_starting_date' => '2024-08-01',
            'school_ending_date' => '2025-05-31',
            'semester' => 1,
        ]);

        $this->user = User::factory()->create([
            'role' => \App\Enums\UserRole::Instructor,
            'faculty_id_number' => 'FAC-12345',
        ]);
        $this->faculty = Faculty::factory()->create(['email' => $this->user->email]);

        $settingsService = app(GeneralSettingsService::class);

        $this->class = Classes::factory()->create([
            'faculty_id' => $this->faculty->id,
            'school_year' => $settingsService->getCurrentSchoolYearString(),
            'semester' => $settingsService->getCurrentSemester(),
            'section' => 'A',
        ]);

        Feature::for($this->user)->activate(FacultyGrades::class);
    }

    public function test_faculty_can_view_grades_index_page(): void
    {
        config(['inertia.testing.ensure_pages_exist' => false]);

        $otherFacultyUser = User::factory()->create([
            'role' => \App\Enums\UserRole::Instructor,
            'faculty_id_number' => 'FAC-99999',
            'email' => 'other-faculty@example.com',
        ]);
        $otherFaculty = Faculty::factory()->create(['email' => $otherFacultyUser->email]);

        $settingsService = app(GeneralSettingsService::class);

        Classes::factory()->create([
            'faculty_id' => $otherFaculty->id,
            'school_year' => $settingsService->getCurrentSchoolYearString(),
            'semester' => $settingsService->getCurrentSemester(),
            'section' => 'B',
        ]);

        $response = $this->actingAs($this->user)
            ->get('/faculty/grades');

        $response->assertOk()
            ->assertInertia(fn (Assert $page): Assert => $page
                ->component('faculty/grades/index')
                ->has('faculty_data.classes', 1)
                ->where('faculty_data.classes.0.id', $this->class->id)
                ->where('faculty_data.classes.0.manage_grades_url', '/faculty/classes/'.$this->class->id.'?tab=grades')
            );
    }

    public function test_can_save_grades()
    {
        $student = Student::factory()->create();
        $enrollment = ClassEnrollment::factory()->create([
            'class_id' => $this->class->id,
            'student_id' => $student->id,
        ]);

        $response = $this->actingAs($this->user)
            ->put(route('faculty.classes.grades.update', $this->class), [
                'grades' => [
                    [
                        'enrollment_id' => $enrollment->id,
                        'prelim' => 85,
                        'midterm' => 88,
                        'final' => 90,
                        'average' => 87.67,
                    ],
                ],
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('class_enrollments', [
            'id' => $enrollment->id,
            'prelim_grade' => 85,
            'midterm_grade' => 88,
            'finals_grade' => 90,
            'total_average' => 87.67,
        ]);
    }

    public function test_can_submit_term_grades()
    {
        // This functionality might vary depending on implementation (e.g., locking grades),
        // but checking the route exists and processes request is a good start.
        $response = $this->actingAs($this->user)
            ->post(route('faculty.classes.grades.submit', $this->class), [
                'term' => 'prelim',
            ]);

        $response->assertRedirect();
    }
}
