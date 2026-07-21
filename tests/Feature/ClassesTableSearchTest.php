<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Filament\Resources\Classes\Pages\ListClasses;
use App\Models\Classes;
use App\Models\GeneralSetting;
use App\Models\Subject;
use App\Models\User;
use Filament\Facades\Filament;
use Livewire\Livewire;
use Spatie\Permission\Models\Permission;

function createCurrentPeriodClass(array $attributes): Classes
{
    return Classes::factory()->create(array_merge([
        'semester' => 2,
        'school_year' => '2024 - 2025',
    ], $attributes));
}

beforeEach(function (): void {
    GeneralSetting::factory()->create([
        'semester' => 2,
        'school_starting_date' => '2024-08-01',
        'school_ending_date' => '2025-05-31',
    ]);

    // Authenticate as admin user
    $user = User::factory()->create(['role' => UserRole::Admin]);
    Permission::findOrCreate('ViewAny:Classes', 'web');
    $user->givePermissionTo('ViewAny:Classes');
    $this->actingAs($user);
    Filament::setCurrentPanel('admin');
});

it('can search classes by single subject code', function (): void {
    // Create a class with a single subject
    $subject = Subject::factory()->create([
        'code' => 'PATHFIT 2',
        'title' => 'Physical Activity Towards Health and Fitness 2',
    ]);

    $class = createCurrentPeriodClass([
        'subject_id' => $subject->id,
        'subject_code' => 'PATHFIT 2',
        'subject_ids' => null,
        'section' => 'A',
        'classification' => 'college',
    ]);

    // Search for PATHFIT 2
    Livewire::test(ListClasses::class)
        ->searchTable('PATHFIT 2')
        ->assertCanSeeTableRecords([$class]);
});

it('can search classes by multiple subject codes', function (): void {
    // Create multiple subjects
    $subject1 = Subject::factory()->create([
        'code' => 'PATHFIT 2',
        'title' => 'Physical Activity Towards Health and Fitness 2',
    ]);

    $subject2 = Subject::factory()->create([
        'code' => 'MATH 101',
        'title' => 'College Algebra',
    ]);

    // Create a class with multiple subjects
    $class = createCurrentPeriodClass([
        'subject_id' => null,
        'subject_code' => 'PATHFIT 2',
        'subject_ids' => [$subject1->id, $subject2->id],
        'section' => 'B',
        'classification' => 'college',
    ]);

    // Search for PATHFIT 2 should find this class
    Livewire::test(ListClasses::class)
        ->searchTable('PATHFIT 2')
        ->assertCanSeeTableRecords([$class]);

    // Search for MATH 101 should also find this class
    Livewire::test(ListClasses::class)
        ->searchTable('MATH 101')
        ->assertCanSeeTableRecords([$class]);
});

it('can search classes by subject title', function (): void {
    $subject = Subject::factory()->create([
        'code' => 'PATHFIT 2',
        'title' => 'Physical Activity Towards Health and Fitness 2',
    ]);

    $class = createCurrentPeriodClass([
        'subject_id' => $subject->id,
        'subject_code' => 'PATHFIT 2',
        'section' => 'C',
        'classification' => 'college',
    ]);

    // Search by subject title
    Livewire::test(ListClasses::class)
        ->searchTable('Physical Activity')
        ->assertCanSeeTableRecords([$class]);
});

it('does not show wrong classes when searching', function (): void {
    // Create two different subjects
    $pathfit2 = Subject::factory()->create([
        'code' => 'PATHFIT 2',
        'title' => 'Physical Activity Towards Health and Fitness 2',
    ]);

    $pathfit4 = Subject::factory()->create([
        'code' => 'PATHFIT 4',
        'title' => 'Physical Activity Towards Health and Fitness 4',
    ]);

    // Create classes for each subject
    $classPathfit2 = createCurrentPeriodClass([
        'subject_id' => $pathfit2->id,
        'subject_code' => 'PATHFIT 2',
        'section' => 'A',
        'classification' => 'college',
    ]);

    $classPathfit4 = createCurrentPeriodClass([
        'subject_id' => $pathfit4->id,
        'subject_code' => 'PATHFIT 4',
        'section' => 'B',
        'classification' => 'college',
    ]);

    // Search for PATHFIT 2 should only show PATHFIT 2 class
    Livewire::test(ListClasses::class)
        ->searchTable('PATHFIT 2')
        ->assertCanSeeTableRecords([$classPathfit2])
        ->assertCanNotSeeTableRecords([$classPathfit4]);

    // Search for PATHFIT 4 should only show PATHFIT 4 class
    Livewire::test(ListClasses::class)
        ->searchTable('PATHFIT 4')
        ->assertCanSeeTableRecords([$classPathfit4])
        ->assertCanNotSeeTableRecords([$classPathfit2]);
});

it('can search classes by section', function (): void {
    $subject = Subject::factory()->create();

    $classA = createCurrentPeriodClass([
        'subject_id' => $subject->id,
        'section' => 'Section A',
        'classification' => 'college',
    ]);

    $classB = createCurrentPeriodClass([
        'subject_id' => $subject->id,
        'section' => 'Section B',
        'classification' => 'college',
    ]);

    // Search by section
    Livewire::test(ListClasses::class)
        ->searchTable('Section A')
        ->assertCanSeeTableRecords([$classA])
        ->assertCanNotSeeTableRecords([$classB]);
});
