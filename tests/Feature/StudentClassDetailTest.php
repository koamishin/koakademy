<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Features\Toggles\StudentClasses as StudentClassesFeature;
use App\Models\ClassEnrollment;
use App\Models\Classes;
use App\Models\ClassPost;
use App\Models\ClassPostSubmission;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Pennant\Feature;

function createStudentClassDetailContext(string $email = 'class-detail-student@example.test'): array
{
    $user = User::factory()->create([
        'role' => UserRole::Student,
        'email' => $email,
    ]);
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'email' => $email,
    ]);
    $class = Classes::factory()->create([
        'classification' => 'college',
    ]);
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->id,
        'status' => true,
    ]);

    Feature::activateForEveryone(StudentClassesFeature::class);
    config(['inertia.testing.ensure_pages_exist' => false]);

    return [$user, $student, $class, $enrollment];
}

it('shares complete assignment details with an assigned student', function (): void {
    [$user, $student, $class, $enrollment] = createStudentClassDetailContext();

    $post = ClassPost::create([
        'class_id' => $class->id,
        'title' => 'Mobile Classroom Assignment',
        'content' => 'Review the lesson before answering.',
        'instruction' => 'Upload one PDF response.',
        'type' => 'assignment',
        'status' => 'in_progress',
        'priority' => 'high',
        'start_date' => '2026-07-18',
        'due_date' => '2026-07-22',
        'progress_percent' => 25,
        'total_points' => 50,
        'audience_mode' => 'specific_students',
        'assigned_student_ids' => [$enrollment->id],
        'rubric' => [[
            'title' => 'Completeness',
            'description' => 'All questions are answered.',
            'points' => 50,
            'levels' => [['title' => 'Complete', 'description' => 'Meets the requirements']],
        ]],
        'attachments' => [[
            'name' => 'lesson.pdf',
            'url' => 'https://example.test/lesson.pdf',
            'kind' => 'file',
        ]],
    ]);

    ClassPostSubmission::create([
        'class_post_id' => $post->id,
        'student_id' => $student->id,
        'content' => 'My completed response.',
        'points' => 45,
        'status' => 'graded',
        'submitted_at' => '2026-07-19 08:00:00',
        'graded_at' => '2026-07-19 09:00:00',
    ]);

    $this->actingAs($user)
        ->get(route('student.classes.show', $class))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('student/classes/show')
            ->has('posts', 1)
            ->where('posts.0.title', 'Mobile Classroom Assignment')
            ->where('posts.0.total_points', 50)
            ->where('posts.0.progress_percent', 25)
            ->where('posts.0.assignment.instruction', 'Upload one PDF response.')
            ->where('posts.0.assignment.audience_mode', 'specific_students')
            ->where('posts.0.assignment.assigned_student_ids', [])
            ->where('posts.0.assignment.rubric.0.title', 'Completeness')
            ->where('posts.0.attachments.0.name', 'lesson.pdf')
            ->where('posts.0.my_submission.status', 'graded')
            ->where('posts.0.my_submission.points', 45)
        );
});

it('hides drafts and assignments targeted to another enrollment', function (): void {
    [$user, $student, $class] = createStudentClassDetailContext('visible-student@example.test');
    [, , , $otherEnrollment] = createStudentClassDetailContext('other-student@example.test');

    ClassPost::create([
        'class_id' => $class->id,
        'title' => 'Private Assignment',
        'instruction' => 'Private work',
        'type' => 'assignment',
        'status' => 'backlog',
        'total_points' => 10,
        'audience_mode' => 'specific_students',
        'assigned_student_ids' => [$otherEnrollment->id],
    ]);
    ClassPost::create([
        'class_id' => $class->id,
        'title' => 'Draft Announcement',
        'type' => 'announcement',
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->get(route('student.classes.show', $class))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->where('posts', []));
});

it('rejects submissions to assignments targeted to another student', function (): void {
    [$user, $student, $class] = createStudentClassDetailContext('blocked-student@example.test');
    [, , , $otherEnrollment] = createStudentClassDetailContext('target-student@example.test');

    $post = ClassPost::create([
        'class_id' => $class->id,
        'title' => 'Targeted Assignment',
        'instruction' => 'Submit your work.',
        'type' => 'assignment',
        'status' => 'backlog',
        'total_points' => 25,
        'audience_mode' => 'specific_students',
        'assigned_student_ids' => [$otherEnrollment->id],
    ]);

    $this->actingAs($user)
        ->post(route('student.classes.posts.submit', [$class, $post]), ['content' => 'Attempted response'])
        ->assertNotFound();

    expect(ClassPostSubmission::query()->where('student_id', $student->id)->exists())->toBeFalse();
});
