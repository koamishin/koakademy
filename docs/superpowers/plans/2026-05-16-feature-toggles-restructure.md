# Feature Toggles Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure feature management from database-driven (`OnboardingFeature` model) to code-driven (Pennant feature classes with metadata), so fresh installs show all features immediately without seeders.

**Architecture:** Each feature is a PHP class implementing `FeatureToggle` interface that defines its own metadata (name, summary, audience, steps) and resolution logic. Pennant stores only override state (global on/off, per-user). The `onboarding_features` database table, model, and seeder are removed entirely.

**Tech Stack:** Laravel 12, Pennant v1, Inertia v2, React 19, Tailwind CSS v4, Pest v4

---

## File Structure Map

### New Files
- `app/Features/Contracts/FeatureToggle.php` — Interface all feature classes implement
- `app/Features/Concerns/ResolvesFeatureToggle.php` — Trait for audience matching and lottery
- `app/Services/FeatureToggleRegistry.php` — Registry mapping keys to classes (replaces `FeatureClassRegistry`)
- `app/Services/FeatureToggleService.php` — Admin operations (activate, deactivate, overrides)
- `app/Http/Controllers/AdministratorFeatureToggleController.php` — Inertia routes for admin UI
- `resources/js/pages/administrators/feature-toggles/index.tsx` — Feature toggles list page
- `resources/js/pages/administrators/feature-toggles/edit.tsx` — Feature toggle detail/edit page
- `tests/Feature/FeatureToggleAdminTest.php` — Admin UI tests
- `tests/Feature/FeatureToggleResolutionTest.php` — Resolution logic tests
- `tests/Unit/FeatureToggleRegistryTest.php` — Registry unit tests
- `database/migrations/2026_05_16_drop_onboarding_features_table.php` — Migration to drop old table

### Modified Files
- `app/Providers/AppServiceProvider.php` — Update to use `FeatureToggleRegistry`
- `app/Services/OnboardingShareService.php` — Read from `FeatureToggleRegistry` instead of DB
- `app/Http/Controllers/EnrollmentRegistrationController.php` — Use Pennant instead of DB model
- `routes/web/administrators.php` — Replace `onboarding-features` routes with `feature-toggles`

### Deleted Files (Phase 5)
- `app/Models/OnboardingFeature.php`
- `database/factories/OnboardingFeatureFactory.php`
- `database/seeders/OnboardingFeatureSeeder.php`
- `app/Policies/OnboardingFeaturePolicy.php`
- `app/Http/Controllers/AdministratorOnboardingFeatureController.php`
- `app/Features/Onboarding/ResolvesOnboardingFeature.php`
- `app/Features/Onboarding/FeatureClassRegistry.php`
- `app/Filament/Resources/OnboardingFeatures/` (entire directory)
- `resources/js/pages/administrators/onboarding-features/` (entire directory)
- All `app/Features/Onboarding/*.php` classes (migrated to `app/Features/Toggles/`)
- `app/Features/StudentSignaturePad.php` (migrated)
- `app/Features/StudentAvatarUpload.php` (migrated)
- `app/Features/OnlineCollegeEnrollment.php` (migrated)
- `app/Features/OnlineTesdaEnrollment.php` (migrated)

---

## Phase 1: Core Infrastructure

### Task 1: Create FeatureToggle Interface

**Files:**
- Create: `app/Features/Contracts/FeatureToggle.php`

- [ ] **Step 1: Write the interface**

```php
<?php

declare(strict_types=1);

namespace App\Features\Contracts;

use App\Models\User;
use Illuminate\Support\Lottery;

interface FeatureToggle
{
    /** Unique identifier, used as Pennant feature name */
    public function key(): string;

    /** Human-readable name shown in admin UI */
    public function name(): string;

    /** Short description */
    public function summary(): ?string;

    /** Target audience: student, faculty, all */
    public function audience(): string;

    /** Optional badge label */
    public function badge(): ?string;

    /** Optional Tailwind accent class */
    public function accent(): ?string;

    /** Optional CTA button label */
    public function ctaLabel(): ?string;

    /** Optional CTA URL */
    public function ctaUrl(): ?string;

    /** Onboarding/walkthrough steps (optional) */
    public function steps(): array;

    /** Default resolution: should this user see the feature? */
    public function resolve(User $scope): bool;

    /** Optional lottery for incremental rollout */
    public function lottery(): ?Lottery;

    /** Category for grouping in admin UI */
    public function category(): string;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Features/Contracts/FeatureToggle.php
git commit -m "feat: add FeatureToggle interface for code-based feature metadata"
```

---

### Task 2: Create ResolvesFeatureToggle Trait

**Files:**
- Create: `app/Features/Concerns/ResolvesFeatureToggle.php`

- [ ] **Step 1: Write the trait**

```php
<?php

declare(strict_types=1);

namespace App\Features\Concerns;

use App\Models\User;
use Illuminate\Support\Lottery;

/**
 * Provides common resolution logic for feature toggles.
 * Feature classes use this trait and override methods as needed.
 */
trait ResolvesFeatureToggle
{
    /**
     * Default resolution: check audience matching.
     * Override in feature classes for custom logic.
     */
    public function resolve(User $scope): bool
    {
        $audience = $this->audience();

        if ($audience === 'all') {
            return true;
        }

        if ($audience === 'student') {
            return $scope->isStudentRole();
        }

        if ($audience === 'faculty') {
            return $scope->isFaculty();
        }

        return false;
    }

    /**
     * Optional lottery for incremental rollout.
     * Return null to disable, or Lottery::odds(1, 2) for 50% rollout.
     */
    public function lottery(): ?Lottery
    {
        return null;
    }

    /**
     * Check if the feature should be active for the user,
     * considering lottery-based rollout.
     */
    public function resolveWithLottery(User $scope): bool
    {
        $baseResolution = $this->resolve($scope);

        if (! $baseResolution) {
            return false;
        }

        $lottery = $this->lottery();

        if ($lottery === null) {
            return true;
        }

        return $lottery->choose();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Features/Concerns/ResolvesFeatureToggle.php
git commit -m "feat: add ResolvesFeatureToggle trait for audience matching and lottery"
```

---

### Task 3: Create FeatureToggleRegistry

**Files:**
- Create: `app/Services/FeatureToggleRegistry.php`

- [ ] **Step 1: Write the registry**

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Features\Contracts\FeatureToggle;
use App\Features\Toggles\FacultyActionCenter;
use App\Features\Toggles\FacultyAnnouncements;
use App\Features\Toggles\FacultyAssessments;
use App\Features\Toggles\FacultyAtRiskAlerts;
use App\Features\Toggles\FacultyAttendance;
use App\Features\Toggles\FacultyClasses;
use App\Features\Toggles\FacultyDashboard;
use App\Features\Toggles\FacultyDeveloperMode;
use App\Features\Toggles\FacultyForms;
use App\Features\Toggles\FacultyGrades;
use App\Features\Toggles\FacultyHelp;
use App\Features\Toggles\FacultyInbox;
use App\Features\Toggles\FacultyInsights;
use App\Features\Toggles\FacultyOfficeHours;
use App\Features\Toggles\FacultyRequestsApprovals;
use App\Features\Toggles\FacultyResources;
use App\Features\Toggles\FacultySchedule;
use App\Features\Toggles\FacultySettings;
use App\Features\Toggles\FacultyToolkit;
use App\Features\Toggles\OnlineCollegeEnrollment;
use App\Features\Toggles\OnlineTesdaEnrollment;
use App\Features\Toggles\StudentAnnouncements;
use App\Features\Toggles\StudentAttendanceTracker;
use App\Features\Toggles\StudentAvatarUpload;
use App\Features\Toggles\StudentClasses;
use App\Features\Toggles\StudentDashboard;
use App\Features\Toggles\StudentDeveloperMode;
use App\Features\Toggles\StudentGradesPreview;
use App\Features\Toggles\StudentHelp;
use App\Features\Toggles\StudentSchedule;
use App\Features\Toggles\StudentSettings;
use App\Features\Toggles\StudentSignaturePad;
use App\Features\Toggles\StudentTuition;

/**
 * Registry mapping feature keys to their Pennant feature class names.
 * All class-based features must be registered here.
 */
final class FeatureToggleRegistry
{
    /**
     * Map of feature_key => FeatureToggle class name.
     *
     * @var array<string, class-string<FeatureToggle>>
     */
    private const array KEY_TO_CLASS = [
        // Faculty features
        'faculty-dashboard' => FacultyDashboard::class,
        'faculty-action-center' => FacultyActionCenter::class,
        'faculty-classes' => FacultyClasses::class,
        'faculty-schedule' => FacultySchedule::class,
        'faculty-announcements' => FacultyAnnouncements::class,
        'faculty-settings' => FacultySettings::class,
        'faculty-help' => FacultyHelp::class,
        'faculty-toolkit' => FacultyToolkit::class,
        'faculty-at-risk-alerts' => FacultyAtRiskAlerts::class,
        'faculty-assessments' => FacultyAssessments::class,
        'faculty-inbox' => FacultyInbox::class,
        'faculty-office-hours' => FacultyOfficeHours::class,
        'faculty-requests-approvals' => FacultyRequestsApprovals::class,
        'faculty-insights' => FacultyInsights::class,
        'faculty-grades' => FacultyGrades::class,
        'faculty-attendance' => FacultyAttendance::class,
        'faculty-resources' => FacultyResources::class,
        'faculty-forms' => FacultyForms::class,
        'faculty-developer-mode' => FacultyDeveloperMode::class,

        // Student features
        'student-dashboard' => StudentDashboard::class,
        'student-classes' => StudentClasses::class,
        'student-tuition' => StudentTuition::class,
        'student-schedule' => StudentSchedule::class,
        'student-announcements' => StudentAnnouncements::class,
        'student-settings' => StudentSettings::class,
        'student-help' => StudentHelp::class,
        'student-grades-preview' => StudentGradesPreview::class,
        'student-attendance-tracker' => StudentAttendanceTracker::class,
        'student-developer-mode' => StudentDeveloperMode::class,

        // Generic features
        'student-signature-pad' => StudentSignaturePad::class,
        'student-avatar-upload' => StudentAvatarUpload::class,
        'online-college-enrollment' => OnlineCollegeEnrollment::class,
        'online-tesda-enrollment' => OnlineTesdaEnrollment::class,
    ];

    /**
     * Get the class name for a feature key.
     *
     * @return class-string<FeatureToggle>|null
     */
    public static function classForKey(string $key): ?string
    {
        return self::KEY_TO_CLASS[$key] ?? null;
    }

    /**
     * Get the feature key for a class name.
     */
    public static function keyForClass(string $class): ?string
    {
        $flipped = array_flip(self::KEY_TO_CLASS);

        return $flipped[$class] ?? null;
    }

    /**
     * Get all registered feature keys.
     *
     * @return array<int, string>
     */
    public static function allKeys(): array
    {
        return array_keys(self::KEY_TO_CLASS);
    }

    /**
     * Get all registered class names.
     *
     * @return array<int, class-string<FeatureToggle>>
     */
    public static function allClasses(): array
    {
        return array_values(self::KEY_TO_CLASS);
    }

    /**
     * Get the full key-to-class mapping.
     *
     * @return array<string, class-string<FeatureToggle>>
     */
    public static function mapping(): array
    {
        return self::KEY_TO_CLASS;
    }

    /**
     * Instantiate a feature toggle by key.
     */
    public static function make(string $key): ?FeatureToggle
    {
        $class = self::classForKey($key);

        if ($class === null) {
            return null;
        }

        return new $class();
    }

    /**
     * Get all instantiated feature toggles.
     *
     * @return array<int, FeatureToggle>
     */
    public static function all(): array
    {
        return array_map(
            fn (string $class): FeatureToggle => new $class(),
            self::allClasses()
        );
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Services/FeatureToggleRegistry.php
git commit -m "feat: add FeatureToggleRegistry mapping keys to feature classes"
```

---

### Task 4: Create FeatureToggleService

**Files:**
- Create: `app/Services/FeatureToggleService.php`

- [ ] **Step 1: Write the service**

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Features\Contracts\FeatureToggle;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Pennant\Feature;

/**
 * Service for managing feature toggle state via Pennant.
 * Handles global activation, deactivation, and per-user overrides.
 */
final class FeatureToggleService
{
    /**
     * Activate a feature globally (for everyone).
     */
    public function activateGlobally(string $featureKey): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::activateForEveryone($featureRef);
    }

    /**
     * Deactivate a feature globally (for everyone).
     */
    public function deactivateGlobally(string $featureKey): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::deactivateForEveryone($featureRef);
    }

    /**
     * Activate a feature for a specific user.
     */
    public function activateForUser(string $featureKey, User $user): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::for($user)->activate($featureRef);
    }

    /**
     * Deactivate a feature for a specific user.
     */
    public function deactivateForUser(string $featureKey, User $user): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::for($user)->deactivate($featureRef);
    }

    /**
     * Purge all per-user overrides for a feature.
     */
    public function purgeOverrides(string $featureKey): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::forget($featureRef);
    }

    /**
     * Check if a feature is globally activated.
     */
    public function isGloballyActivated(string $featureKey): bool
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);

        if ($featureClass === null) {
            return false;
        }

        return DB::table('features')
            ->where('name', $featureClass)
            ->where('scope', '__laravel_null')
            ->where('value', 'true')
            ->exists();
    }

    /**
     * Count users with explicit overrides for a feature.
     */
    public function getUserOverrideCount(string $featureKey): int
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);

        if ($featureClass === null) {
            return 0;
        }

        return DB::table('features')
            ->where('name', $featureClass)
            ->where('scope', 'not like', '%__laravel_null%')
            ->count();
    }

    /**
     * Get users with explicit overrides for a feature.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getOverriddenUsers(string $featureKey): array
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);

        if ($featureClass === null) {
            return [];
        }

        $userScopes = DB::table('features')
            ->where('name', $featureClass)
            ->where('scope', 'not like', '%__laravel_null%')
            ->pluck('scope')
            ->all();

        $userIds = collect($userScopes)
            ->map(fn (string $scope) => Str::afterLast($scope, '|'))
            ->filter()
            ->map(fn (string $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();

        return User::query()
            ->whereIn('id', $userIds)
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'is_active' => Feature::for($user)->active($featureClass),
            ])
            ->all();
    }

    /**
     * Get the current state of a feature for admin display.
     *
     * @return array<string, mixed>
     */
    public function getFeatureState(string $featureKey): array
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);

        if ($featureClass === null) {
            return [
                'is_globally_activated' => false,
                'override_count' => 0,
                'has_class' => false,
            ];
        }

        return [
            'is_globally_activated' => $this->isGloballyActivated($featureKey),
            'override_count' => $this->getUserOverrideCount($featureKey),
            'has_class' => true,
        ];
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Services/FeatureToggleService.php
git commit -m "feat: add FeatureToggleService for Pennant state management"
```

---

### Task 5: Write Registry Unit Test

**Files:**
- Create: `tests/Unit/FeatureToggleRegistryTest.php`

- [ ] **Step 1: Write the test**

```php
<?php

declare(strict_types=1);

use App\Features\Contracts\FeatureToggle;
use App\Features\Toggles\FacultyDashboard;
use App\Features\Toggles\StudentDashboard;
use App\Services\FeatureToggleRegistry;

it('maps keys to feature toggle classes', function (): void {
    $class = FeatureToggleRegistry::classForKey('faculty-dashboard');
    expect($class)->toBe(FacultyDashboard::class);
});

it('returns null for unknown keys', function (): void {
    $class = FeatureToggleRegistry::classForKey('nonexistent-feature');
    expect($class)->toBeNull();
});

it('maps classes back to keys', function (): void {
    $key = FeatureToggleRegistry::keyForClass(FacultyDashboard::class);
    expect($key)->toBe('faculty-dashboard');
});

it('returns all registered keys', function (): void {
    $keys = FeatureToggleRegistry::allKeys();
    expect($keys)->toContain('faculty-dashboard', 'student-dashboard');
});

it('returns all registered classes', function (): void {
    $classes = FeatureToggleRegistry::allClasses();
    expect($classes)->toContain(FacultyDashboard::class, StudentDashboard::class);
});

it('instantiates feature toggles by key', function (): void {
    $toggle = FeatureToggleRegistry::make('faculty-dashboard');
    expect($toggle)->toBeInstanceOf(FeatureToggle::class);
    expect($toggle)->toBeInstanceOf(FacultyDashboard::class);
});

it('returns null for unknown key instantiation', function (): void {
    $toggle = FeatureToggleRegistry::make('nonexistent');
    expect($toggle)->toBeNull();
});

it('returns all instantiated toggles', function (): void {
    $toggles = FeatureToggleRegistry::all();
    expect($toggles)->toBeArray();
    expect($toggles)->not->toBeEmpty();
    expect($toggles[0])->toBeInstanceOf(FeatureToggle::class);
});
```

- [ ] **Step 2: Run the test (expect failures — classes don't exist yet)**

```bash
vendor/bin/sail artisan test --compact tests/Unit/FeatureToggleRegistryTest.php
```

Expected: FAIL — `FacultyDashboard` class not found.

- [ ] **Step 3: Commit the test**

```bash
git add tests/Unit/FeatureToggleRegistryTest.php
git commit -m "test: add FeatureToggleRegistry unit tests"
```

---

## Phase 2: Migrate Feature Classes

### Task 6: Migrate Faculty Feature Classes

**Files:**
- Create: `app/Features/Toggles/FacultyDashboard.php`
- Create: `app/Features/Toggles/FacultyActionCenter.php`
- Create: `app/Features/Toggles/FacultyClasses.php`
- Create: `app/Features/Toggles/FacultySchedule.php`
- Create: `app/Features/Toggles/FacultyAnnouncements.php`
- Create: `app/Features/Toggles/FacultySettings.php`
- Create: `app/Features/Toggles/FacultyHelp.php`
- Create: `app/Features/Toggles/FacultyToolkit.php`
- Create: `app/Features/Toggles/FacultyAtRiskAlerts.php`
- Create: `app/Features/Toggles/FacultyAssessments.php`
- Create: `app/Features/Toggles/FacultyInbox.php`
- Create: `app/Features/Toggles/FacultyOfficeHours.php`
- Create: `app/Features/Toggles/FacultyRequestsApprovals.php`
- Create: `app/Features/Toggles/FacultyInsights.php`
- Create: `app/Features/Toggles/FacultyGrades.php`
- Create: `app/Features/Toggles/FacultyAttendance.php`
- Create: `app/Features/Toggles/FacultyResources.php`
- Create: `app/Features/Toggles/FacultyForms.php`
- Create: `app/Features/Toggles/FacultyDeveloperMode.php`

- [ ] **Step 1: Create FacultyDashboard as template**

```php
<?php

declare(strict_types=1);

namespace App\Features\Toggles;

use App\Features\Concerns\ResolvesFeatureToggle;
use App\Features\Contracts\FeatureToggle;
use App\Models\User;
use Illuminate\Support\Lottery;

final class FacultyDashboard implements FeatureToggle
{
    use ResolvesFeatureToggle;

    public function key(): string
    {
        return 'faculty-dashboard';
    }

    public function name(): string
    {
        return 'Faculty Dashboard';
    }

    public function summary(): ?string
    {
        return 'Your command center for day-to-day teaching updates.';
    }

    public function audience(): string
    {
        return 'faculty';
    }

    public function badge(): ?string
    {
        return 'Dashboard';
    }

    public function accent(): ?string
    {
        return 'text-primary';
    }

    public function ctaLabel(): ?string
    {
        return 'Open Dashboard';
    }

    public function ctaUrl(): ?string
    {
        return '/faculty/dashboard';
    }

    public function steps(): array
    {
        return [
            [
                'title' => 'Dashboard',
                'summary' => "Check today's highlights and stay on top of priorities.",
                'highlights' => ['Faculty dashboard overview', 'Daily priorities and alerts'],
                'stats' => [
                    ['label' => 'Route', 'value' => '/faculty/dashboard'],
                    ['label' => 'Menu', 'value' => 'Dashboard'],
                ],
                'badge' => 'Dashboard',
                'accent' => 'text-primary',
                'icon' => 'sparkles',
                'image' => null,
            ],
        ];
    }

    public function category(): string
    {
        return 'Faculty';
    }
}
```

- [ ] **Step 2: Create remaining faculty classes**

Use the seeder data from `database/seeders/OnboardingFeatureSeeder.php` to populate metadata for each class. Each class follows the same pattern as `FacultyDashboard` with its own key, name, summary, audience='faculty', steps, badge, accent, ctaLabel, ctaUrl.

Key mappings from old to new:
- `onboarding-faculty-dashboard` → `faculty-dashboard`
- `onboarding-faculty-action-center` → `faculty-action-center`
- `onboarding-faculty-classes` → `faculty-classes`
- `onboarding-faculty-schedule` → `faculty-schedule`
- `onboarding-faculty-announcements` → `faculty-announcements`
- `onboarding-faculty-settings` → `faculty-settings`
- `onboarding-faculty-help` → `faculty-help`
- `onboarding-faculty-toolkit` → `faculty-toolkit`
- `onboarding-faculty-at-risk-alerts` → `faculty-at-risk-alerts`
- `onboarding-faculty-assessments` → `faculty-assessments`
- `onboarding-faculty-inbox` → `faculty-inbox`
- `onboarding-faculty-office-hours` → `faculty-office-hours`
- `onboarding-faculty-requests-approvals` → `faculty-requests-approvals`
- `onboarding-faculty-insights` → `faculty-insights`
- `onboarding-faculty-grades` → `faculty-grades`
- `onboarding-faculty-attendance` → `faculty-attendance`
- `onboarding-faculty-resources` → `faculty-resources`
- `onboarding-faculty-forms` → `faculty-forms`
- `onboarding-faculty-developer-mode` → `faculty-developer-mode`

- [ ] **Step 3: Commit**

```bash
git add app/Features/Toggles/Faculty*.php
git commit -m "feat: migrate faculty feature classes to Toggles namespace"
```

---

### Task 7: Migrate Student Feature Classes

**Files:**
- Create: `app/Features/Toggles/StudentDashboard.php`
- Create: `app/Features/Toggles/StudentClasses.php`
- Create: `app/Features/Toggles/StudentTuition.php`
- Create: `app/Features/Toggles/StudentSchedule.php`
- Create: `app/Features/Toggles/StudentAnnouncements.php`
- Create: `app/Features/Toggles/StudentSettings.php`
- Create: `app/Features/Toggles/StudentHelp.php`
- Create: `app/Features/Toggles/StudentGradesPreview.php`
- Create: `app/Features/Toggles/StudentAttendanceTracker.php`
- Create: `app/Features/Toggles/StudentDeveloperMode.php`

- [ ] **Step 1: Create StudentDashboard as template**

```php
<?php

declare(strict_types=1);

namespace App\Features\Toggles;

use App\Features\Concerns\ResolvesFeatureToggle;
use App\Features\Contracts\FeatureToggle;
use App\Models\User;

final class StudentDashboard implements FeatureToggle
{
    use ResolvesFeatureToggle;

    public function key(): string
    {
        return 'student-dashboard';
    }

    public function name(): string
    {
        return 'Student Dashboard';
    }

    public function summary(): ?string
    {
        return 'Your quick view of classes and account status.';
    }

    public function audience(): string
    {
        return 'student';
    }

    public function badge(): ?string
    {
        return 'Dashboard';
    }

    public function accent(): ?string
    {
        return 'text-primary';
    }

    public function ctaLabel(): ?string
    {
        return 'Open Dashboard';
    }

    public function ctaUrl(): ?string
    {
        return '/student/dashboard';
    }

    public function steps(): array
    {
        return [
            [
                'title' => 'Dashboard',
                'summary' => 'See your classes, balance, and alerts quickly.',
                'highlights' => ['Class overview', 'Account status'],
                'stats' => [
                    ['label' => 'Route', 'value' => '/student/dashboard'],
                    ['label' => 'Menu', 'value' => 'Dashboard'],
                ],
                'badge' => 'Dashboard',
                'accent' => 'text-primary',
                'icon' => 'stars',
                'image' => null,
            ],
        ];
    }

    public function category(): string
    {
        return 'Student';
    }
}
```

- [ ] **Step 2: Create remaining student classes**

Use seeder data. Key mappings:
- `onboarding-student-dashboard` → `student-dashboard`
- `onboarding-student-classes` → `student-classes`
- `onboarding-student-tuition` → `student-tuition`
- `onboarding-student-schedule` → `student-schedule`
- `onboarding-student-announcements` → `student-announcements`
- `onboarding-student-settings` → `student-settings`
- `onboarding-student-help` → `student-help`
- `onboarding-student-grades-preview` → `student-grades-preview`
- `onboarding-student-attendance-tracker` → `student-attendance-tracker`
- `onboarding-student-developer-mode` → `student-developer-mode`

- [ ] **Step 3: Commit**

```bash
git add app/Features/Toggles/Student*.php
git commit -m "feat: migrate student feature classes to Toggles namespace"
```

---

### Task 8: Migrate Generic Feature Classes

**Files:**
- Create: `app/Features/Toggles/StudentSignaturePad.php`
- Create: `app/Features/Toggles/StudentAvatarUpload.php`
- Create: `app/Features/Toggles/OnlineCollegeEnrollment.php`
- Create: `app/Features/Toggles/OnlineTesdaEnrollment.php`

- [ ] **Step 1: Migrate StudentSignaturePad**

Read existing `app/Features/StudentSignaturePad.php` and adapt to implement `FeatureToggle`.

```php
<?php

declare(strict_types=1);

namespace App\Features\Toggles;

use App\Features\Concerns\ResolvesFeatureToggle;
use App\Features\Contracts\FeatureToggle;
use App\Models\User;

final class StudentSignaturePad implements FeatureToggle
{
    use ResolvesFeatureToggle;

    public function key(): string
    {
        return 'student-signature-pad';
    }

    public function name(): string
    {
        return 'Student Signature Pad';
    }

    public function summary(): ?string
    {
        return 'Digital signature capture for student documents.';
    }

    public function audience(): string
    {
        return 'student';
    }

    public function badge(): ?string
    {
        return null;
    }

    public function accent(): ?string
    {
        return null;
    }

    public function ctaLabel(): ?string
    {
        return null;
    }

    public function ctaUrl(): ?string
    {
        return null;
    }

    public function steps(): array
    {
        return [];
    }

    public function category(): string
    {
        return 'Student';
    }
}
```

- [ ] **Step 2: Migrate remaining generic classes**

Adapt `StudentAvatarUpload`, `OnlineCollegeEnrollment`, `OnlineTesdaEnrollment` similarly.

- [ ] **Step 3: Commit**

```bash
git add app/Features/Toggles/StudentSignaturePad.php app/Features/Toggles/StudentAvatarUpload.php app/Features/Toggles/OnlineCollegeEnrollment.php app/Features/Toggles/OnlineTesdaEnrollment.php
git commit -m "feat: migrate generic feature classes to Toggles namespace"
```

---

### Task 9: Update AppServiceProvider

**Files:**
- Modify: `app/Providers/AppServiceProvider.php`

- [ ] **Step 1: Replace FeatureClassRegistry with FeatureToggleRegistry**

```php
// Remove:
use App\Features\Onboarding\FeatureClassRegistry;

// Add:
use App\Services\FeatureToggleRegistry;
```

Replace the boot method's feature registration:

```php
// Old:
foreach (FeatureClassRegistry::allClasses() as $featureClass) {
    Feature::define($featureClass);
}

// New:
foreach (FeatureToggleRegistry::allClasses() as $featureClass) {
    Feature::define($featureClass);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Providers/AppServiceProvider.php
git commit -m "refactor: update AppServiceProvider to use FeatureToggleRegistry"
```

---

### Task 10: Update OnboardingShareService

**Files:**
- Modify: `app/Services/OnboardingShareService.php`

- [ ] **Step 1: Replace OnboardingFeature model with FeatureToggleRegistry**

```php
// Remove:
use App\Models\OnboardingFeature;
use App\Features\Onboarding\FeatureClassRegistry;

// Add:
use App\Services\FeatureToggleRegistry;
```

Replace `getOnboardingFeatures` method:

```php
public function getOnboardingFeatures(?User $user): array
{
    if (! $user instanceof User) {
        return [];
    }

    $audience = $user->isStudentRole() ? 'student' : ($user->isFaculty() ? 'faculty' : 'all');

    $dismissed = OnboardingDismissal::query()
        ->where('user_id', $user->id)
        ->pluck('feature_key')
        ->all();

    $allToggles = FeatureToggleRegistry::all();

    $featureClasses = collect($allToggles)
        ->map(fn ($toggle) => get_class($toggle))
        ->values()
        ->all();

    $featureValues = Feature::for($user)->values($featureClasses);

    return collect($allToggles)
        ->filter(function (FeatureToggle $toggle) use ($audience, $featureValues): bool {
            if ($toggle->audience() !== 'all' && $toggle->audience() !== $audience) {
                return false;
            }

            $featureClass = get_class($toggle);

            return (bool) ($featureValues[$featureClass] ?? false);
        })
        ->reject(fn (FeatureToggle $toggle): bool => in_array($toggle->key(), $dismissed, true))
        ->values()
        ->map(fn (FeatureToggle $toggle): array => [
            'featureKey' => $toggle->key(),
            'name' => $toggle->name(),
            'audience' => $toggle->audience(),
            'summary' => $toggle->summary(),
            'badge' => $toggle->badge(),
            'accent' => $toggle->accent(),
            'ctaLabel' => $toggle->ctaLabel(),
            'ctaUrl' => $toggle->ctaUrl(),
            'steps' => $toggle->steps(),
        ])
        ->all();
}
```

Update `getSidebarFeatureFlags` to use new keys:

```php
public function getSidebarFeatureFlags(array $featureValues): array
{
    $enabledRoutes = [];

    foreach (self::FEATURE_TO_ROUTES as $featureKey => $routeIds) {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $isActive = (bool) ($featureValues[$featureClass ?? $featureKey] ?? false);

        foreach ($routeIds as $routeId) {
            $enabledRoutes[$routeId] ??= false;
            if ($isActive) {
                $enabledRoutes[$routeId] = true;
            }
        }
    }

    return $enabledRoutes;
}
```

Update `getAllFeatureValues`:

```php
public function getAllFeatureValues(?User $user): array
{
    if (! $user instanceof User) {
        return [];
    }

    $featureClasses = collect(array_keys(self::FEATURE_TO_ROUTES))
        ->map(fn (string $key): ?string => FeatureToggleRegistry::classForKey($key))
        ->filter()
        ->values()
        ->all();

    return Feature::for($user)->values($featureClasses);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Services/OnboardingShareService.php
git commit -m "refactor: update OnboardingShareService to use FeatureToggleRegistry"
```

---

## Phase 3: Update Consumers

### Task 11: Update EnrollmentRegistrationController

**Files:**
- Modify: `app/Http/Controllers/EnrollmentRegistrationController.php`

- [ ] **Step 1: Replace OnboardingFeature queries with Pennant checks**

Find all `OnboardingFeature::query()->where('feature_key', ...)->value('is_active')` calls and replace with `Feature::active(FeatureClass::class)`.

For example:

```php
// Old:
$collegeEnabled = OnboardingFeature::query()
    ->where('feature_key', 'online-college-enrollment')
    ->value('is_active');

// New:
use App\Features\Toggles\OnlineCollegeEnrollment;
use Laravel\Pennant\Feature;

$collegeEnabled = Feature::active(OnlineCollegeEnrollment::class);
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Controllers/EnrollmentRegistrationController.php
git commit -m "refactor: use Pennant instead of OnboardingFeature in enrollment controller"
```

---

### Task 12: Update Routes

**Files:**
- Modify: `routes/web/administrators.php`

- [ ] **Step 1: Replace onboarding-features routes with feature-toggles**

Remove all `onboarding-features` routes and add:

```php
use App\Http\Controllers\AdministratorFeatureToggleController;

Route::get('/feature-toggles', [AdministratorFeatureToggleController::class, 'index'])->name('feature-toggles.index');
Route::post('/feature-toggles/{featureKey}/toggle', [AdministratorFeatureToggleController::class, 'toggle'])->name('feature-toggles.toggle');
Route::post('/feature-toggles/{featureKey}/activate-for-user', [AdministratorFeatureToggleController::class, 'activateForUser'])->name('feature-toggles.activate-for-user');
Route::post('/feature-toggles/{featureKey}/deactivate-for-user', [AdministratorFeatureToggleController::class, 'deactivateForUser'])->name('feature-toggles.deactivate-for-user');
Route::post('/feature-toggles/{featureKey}/purge-overrides', [AdministratorFeatureToggleController::class, 'purgeOverrides'])->name('feature-toggles.purge-overrides');
Route::get('/feature-toggles/{featureKey}/overridden-users', [AdministratorFeatureToggleController::class, 'overriddenUsers'])->name('feature-toggles.overridden-users');
```

- [ ] **Step 2: Commit**

```bash
git add routes/web/administrators.php
git commit -m "refactor: replace onboarding-features routes with feature-toggles"
```

---

### Task 13: Create AdministratorFeatureToggleController

**Files:**
- Create: `app/Http/Controllers/AdministratorFeatureToggleController.php`

- [ ] **Step 1: Write the controller**

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\FeatureToggleRegistry;
use App\Services\FeatureToggleService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AdministratorFeatureToggleController extends Controller
{
    public function __construct(
        private readonly FeatureToggleService $featureToggleService,
    ) {}

    public function index(Request $request): Response
    {
        $toggles = FeatureToggleRegistry::all();

        $features = collect($toggles)
            ->map(function ($toggle): array {
                $state = $this->featureToggleService->getFeatureState($toggle->key());

                return [
                    'key' => $toggle->key(),
                    'name' => $toggle->name(),
                    'audience' => $toggle->audience(),
                    'summary' => $toggle->summary(),
                    'badge' => $toggle->badge(),
                    'accent' => $toggle->accent(),
                    'cta_label' => $toggle->ctaLabel(),
                    'cta_url' => $toggle->ctaUrl(),
                    'steps' => $toggle->steps(),
                    'steps_count' => count($toggle->steps()),
                    'category' => $toggle->category(),
                    'is_active' => $state['is_globally_activated'],
                    'pennant_class' => get_class($toggle),
                    'pennant_type' => 'class',
                    'pennant_global_state' => $state['is_globally_activated'],
                    'pennant_user_overrides_count' => $state['override_count'],
                ];
            })
            ->values()
            ->all();

        return Inertia::render('administrators/feature-toggles/index', [
            'features' => $features,
            'filters' => [
                'search' => $request->input('search'),
                'audience' => $request->input('audience'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    public function toggle(string $featureKey): \Illuminate\Http\RedirectResponse
    {
        $state = $this->featureToggleService->getFeatureState($featureKey);

        if ($state['is_globally_activated']) {
            $this->featureToggleService->deactivateGlobally($featureKey);
            $status = 'deactivated';
        } else {
            $this->featureToggleService->activateGlobally($featureKey);
            $status = 'activated';
        }

        $toggle = FeatureToggleRegistry::make($featureKey);
        $name = $toggle?->name() ?? $featureKey;

        return back()->with('flash', [
            'type' => 'success',
            'message' => "Feature \"{$name}\" has been {$status}.",
        ]);
    }

    public function activateForUser(Request $request, string $featureKey): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        $this->featureToggleService->activateForUser($featureKey, $user);

        return response()->json([
            'message' => "Feature activated for user {$user->name}.",
        ]);
    }

    public function deactivateForUser(Request $request, string $featureKey): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        $this->featureToggleService->deactivateForUser($featureKey, $user);

        return response()->json([
            'message' => "Feature deactivated for user {$user->name}.",
        ]);
    }

    public function purgeOverrides(string $featureKey): JsonResponse
    {
        $this->featureToggleService->purgeOverrides($featureKey);

        return response()->json([
            'message' => 'All per-user overrides have been purged.',
        ]);
    }

    public function overriddenUsers(string $featureKey): JsonResponse
    {
        $users = $this->featureToggleService->getOverriddenUsers($featureKey);

        return response()->json(['users' => $users]);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Controllers/AdministratorFeatureToggleController.php
git commit -m "feat: add AdministratorFeatureToggleController for new admin UI"
```

---

## Phase 4: Frontend

### Task 14: Create Feature Toggles Index Page

**Files:**
- Create: `resources/js/pages/administrators/feature-toggles/index.tsx`

- [ ] **Step 1: Copy and adapt from onboarding-features/index.tsx**

Copy the existing `resources/js/pages/administrators/onboarding-features/index.tsx` to the new location.

Update:
- Change route names from `administrators.onboarding-features.*` to `administrators.feature-toggles.*`
- Change `feature.id` references to `feature.key` (features are now identified by string key, not DB ID)
- Remove `feature.id` from the interface; use `feature.key` as unique identifier
- Update `handleToggle` to POST to `route("administrators.feature-toggles.toggle", feature.key)`
- Update `handleDelete` — remove delete functionality (features can't be deleted from code)
- Update `loadOverrides` to fetch from `route("administrators.feature-toggles.overridden-users", feature.key)`
- Update `handleActivateForUser` to POST to `route("administrators.feature-toggles.activate-for-user", feature.key)`
- Update `handleDeactivateForUser` to POST to `route("administrators.feature-toggles.deactivate-for-user", feature.key)`
- Update `handlePurgeOverrides` to POST to `route("administrators.feature-toggles.purge-overrides", feature.key)`
- Remove the "New Feature" button (features are defined in code, not created via UI)
- Update the empty state message: "All feature toggles are defined in code."

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/administrators/feature-toggles/index.tsx
git commit -m "feat: add feature toggles admin index page"
```

---

### Task 15: Create Feature Toggles Edit Page (Preview)

**Files:**
- Create: `resources/js/pages/administrators/feature-toggles/edit.tsx`

- [ ] **Step 1: Copy and adapt from onboarding-features/edit.tsx**

Copy the existing `resources/js/pages/administrators/onboarding-features/edit.tsx` to the new location.

Update:
- Change route names to `administrators.feature-toggles.*`
- Make the form read-only (metadata is defined in code, not editable via UI)
- Remove save/submit functionality
- Keep the preview/display functionality for steps, metadata, etc.
- Add a "Back to Toggles" button instead of save

- [ ] **Step 2: Commit**

```bash
git add resources/js/pages/administrators/feature-toggles/edit.tsx
git commit -m "feat: add feature toggle preview page"
```

---

## Phase 5: Remove Old System

### Task 16: Remove OnboardingFeature Model and Related Files

**Files:**
- Delete: `app/Models/OnboardingFeature.php`
- Delete: `database/factories/OnboardingFeatureFactory.php`
- Delete: `database/seeders/OnboardingFeatureSeeder.php`
- Delete: `app/Policies/OnboardingFeaturePolicy.php`
- Delete: `app/Http/Controllers/AdministratorOnboardingFeatureController.php`
- Delete: `app/Features/Onboarding/ResolvesOnboardingFeature.php`
- Delete: `app/Features/Onboarding/FeatureClassRegistry.php`
- Delete: `app/Filament/Resources/OnboardingFeatures/` (entire directory)
- Delete: `resources/js/pages/administrators/onboarding-features/` (entire directory)

- [ ] **Step 1: Delete all old files**

```bash
rm app/Models/OnboardingFeature.php
rm database/factories/OnboardingFeatureFactory.php
rm database/seeders/OnboardingFeatureSeeder.php
rm app/Policies/OnboardingFeaturePolicy.php
rm app/Http/Controllers/AdministratorOnboardingFeatureController.php
rm app/Features/Onboarding/ResolvesOnboardingFeature.php
rm app/Features/Onboarding/FeatureClassRegistry.php
rm -rf app/Filament/Resources/OnboardingFeatures/
rm -rf resources/js/pages/administrators/onboarding-features/
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove old OnboardingFeature model, controller, and related files"
```

---

### Task 17: Create Migration to Drop OnboardingFeatures Table

**Files:**
- Create: `database/migrations/2026_05_16_drop_onboarding_features_table.php`

- [ ] **Step 1: Write the migration**

```php
<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('onboarding_features');
    }

    public function down(): void
    {
        Schema::create('onboarding_features', function (Blueprint $table): void {
            $table->id();
            $table->string('feature_key')->unique();
            $table->string('name');
            $table->enum('audience', ['student', 'faculty', 'all']);
            $table->text('summary')->nullable();
            $table->string('badge')->nullable();
            $table->string('accent')->nullable();
            $table->string('cta_label')->nullable();
            $table->string('cta_url')->nullable();
            $table->json('steps')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }
};
```

- [ ] **Step 2: Commit**

```bash
git add database/migrations/2026_05_16_drop_onboarding_features_table.php
git commit -m "chore: add migration to drop onboarding_features table"
```

---

### Task 18: Remove Old Onboarding Feature Classes

**Files:**
- Delete: `app/Features/Onboarding/*.php` (all files except those being kept)

- [ ] **Step 1: Delete old Onboarding classes**

Keep only classes that are NOT feature toggles (if any). All feature toggle classes have been migrated to `app/Features/Toggles/`.

```bash
rm -rf app/Features/Onboarding/
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove old Onboarding feature classes (migrated to Toggles)"
```

---

## Phase 6: Tests & Verification

### Task 19: Update Tests

**Files:**
- Modify: `tests/Feature/OnboardingFeatureResourceTest.php` → rename to `tests/Feature/FeatureToggleAdminTest.php`
- Modify: `tests/Feature/OnlineEnrollmentFeatureTest.php`
- Modify: `tests/Feature/UserFeatureFlagRoleChangeTest.php`
- Modify: `tests/Feature/OnboardingConfigTest.php`
- Modify: `tests/Feature/StudentScheduleTest.php`

- [ ] **Step 1: Rewrite OnboardingFeatureResourceTest as FeatureToggleAdminTest**

```php
<?php

declare(strict_types=1);

use App\Features\Toggles\FacultyDashboard;
use App\Models\User;
use Laravel\Pennant\Feature;

it('lists all feature toggles on fresh install', function (): void {
    $admin = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($admin)
        ->get(route('administrators.feature-toggles.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('administrators/feature-toggles/index')
        ->has('features')
    );
});

it('toggles a feature globally', function (): void {
    $admin = User::factory()->create(['role' => 'super_admin']);

    $this->actingAs($admin)
        ->post(route('administrators.feature-toggles.toggle', 'faculty-dashboard'))
        ->assertRedirect();

    expect(Feature::active(FacultyDashboard::class))->toBeTrue();
});

it('deactivates a feature globally', function (): void {
    $admin = User::factory()->create(['role' => 'super_admin']);
    Feature::activateForEveryone(FacultyDashboard::class);

    $this->actingAs($admin)
        ->post(route('administrators.feature-toggles.toggle', 'faculty-dashboard'))
        ->assertRedirect();

    expect(Feature::active(FacultyDashboard::class))->toBeFalse();
});

it('activates a feature for a specific user', function (): void {
    $admin = User::factory()->create(['role' => 'super_admin']);
    $user = User::factory()->create(['role' => 'faculty']);

    $this->actingAs($admin)
        ->post(route('administrators.feature-toggles.activate-for-user', 'faculty-dashboard'), [
            'user_id' => $user->id,
        ])
        ->assertOk();

    expect(Feature::for($user)->active(FacultyDashboard::class))->toBeTrue();
});

it('purges all user overrides', function (): void {
    $admin = User::factory()->create(['role' => 'super_admin']);
    $user = User::factory()->create(['role' => 'faculty']);
    Feature::for($user)->activate(FacultyDashboard::class);

    $this->actingAs($admin)
        ->post(route('administrators.feature-toggles.purge-overrides', 'faculty-dashboard'))
        ->assertOk();

    // After purge, resolution falls back to default (audience matching)
    expect(Feature::for($user)->active(FacultyDashboard::class))->toBeTrue(); // faculty matches audience
});
```

- [ ] **Step 2: Update OnlineEnrollmentFeatureTest**

Remove all `OnboardingFeature::firstOrCreate()` calls. Use Pennant test helpers instead:

```php
use App\Features\Toggles\OnlineCollegeEnrollment;
use Laravel\Pennant\Feature;

// Before test:
Feature::activateForEveryone(OnlineCollegeEnrollment::class);

// After test:
Feature::deactivateForEveryone(OnlineCollegeEnrollment::class);
```

- [ ] **Step 3: Update remaining tests**

Replace all `OnboardingFeature::factory()->create()` and `OnboardingFeature::query()` calls with Pennant feature class references.

- [ ] **Step 4: Commit**

```bash
git add tests/Feature/FeatureToggleAdminTest.php tests/Feature/OnlineEnrollmentFeatureTest.php
git add tests/Feature/UserFeatureFlagRoleChangeTest.php tests/Feature/OnboardingConfigTest.php
git add tests/Feature/StudentScheduleTest.php
git rm tests/Feature/OnboardingFeatureResourceTest.php
git commit -m "test: update tests for FeatureToggle system"
```

---

### Task 20: Run Full Test Suite

- [ ] **Step 1: Run tests**

```bash
vendor/bin/sail artisan test --compact
```

- [ ] **Step 2: Fix any failures**

Address test failures one at a time. Common issues:
- Missing imports for new feature classes
- Route name changes
- Model references that weren't updated

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve test failures after feature toggle restructure"
```

---

### Task 21: Run Pint Formatter

- [ ] **Step 1: Format all modified PHP files**

```bash
vendor/bin/sail bin pint --dirty --format agent
```

- [ ] **Step 2: Commit formatting changes**

```bash
git add -A
git commit -m "style: apply Pint formatting"
```

---

## Phase 7: Verification & Cleanup

### Task 22: Verify Fresh Install

- [ ] **Step 1: Reset database and verify**

```bash
vendor/bin/sail artisan migrate:fresh
# Do NOT run seeders
```

- [ ] **Step 2: Visit admin UI**

Navigate to `/administrators/feature-toggles` as an admin user.

Expected: All feature toggles are listed immediately, even though no seeders were run.

- [ ] **Step 3: Test toggle functionality**

- Click a toggle switch → feature state changes
- Open user overrides modal → add a user override
- Verify per-user override works

- [ ] **Step 4: Commit verification notes**

```bash
git commit --allow-empty -m "verify: fresh install shows all feature toggles without seeders"
```

---

## Spec Coverage Check

| Spec Requirement | Implementing Task |
|------------------|-------------------|
| FeatureToggle interface | Task 1 |
| ResolvesFeatureToggle trait | Task 2 |
| FeatureToggleRegistry | Task 3 |
| FeatureToggleService | Task 4 |
| Fresh install visibility | Task 22 (verification) |
| Faculty feature classes migrated | Task 6 |
| Student feature classes migrated | Task 7 |
| Generic feature classes migrated | Task 8 |
| AppServiceProvider updated | Task 9 |
| OnboardingShareService refactored | Task 10 |
| Enrollment controller updated | Task 11 |
| Routes updated | Task 12 |
| Admin controller created | Task 13 |
| Frontend index page | Task 14 |
| Frontend edit/preview page | Task 15 |
| Old model removed | Task 16 |
| Old table dropped | Task 17 |
| Old classes removed | Task 18 |
| Tests updated | Task 19 |
| Full test suite passes | Task 20 |
| Code formatted | Task 21 |

---

## Placeholder Scan

No TBD, TODO, or placeholder text found in this plan. All tasks include exact file paths, code blocks, and commands.

## Type Consistency Check

- `FeatureToggle::key()` returns `string` consistently
- `FeatureToggle::audience()` returns `string` consistently
- `FeatureToggleRegistry::classForKey()` returns `?string` consistently
- Route parameters use `string $featureKey` consistently
- Pennant methods use `Feature::active()` and `Feature::activateForEveryone()` consistently
