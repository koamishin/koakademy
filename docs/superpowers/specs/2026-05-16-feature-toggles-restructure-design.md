# Feature Toggles Restructure Design

**Session ID:** 2026-05-16-feature-toggles-restructure  
**Created:** 2026-05-16  
**Status:** Draft — Pending User Review

---

## 1. Problem Statement

The current feature management system stores feature metadata (name, summary, steps, audience, CTA) in the `onboarding_features` database table and uses a separate `is_active` boolean column to control visibility. Pennant class-based features are registered in `AppServiceProvider`, but their resolution logic (`ResolvesOnboardingFeature` trait) queries the same `onboarding_features` table.

**This creates a critical failure mode:** On a fresh install with no seeded data, the admin UI at `/administrators/onboarding-features` shows an empty list because no rows exist in the database. Even though all Pennant feature classes are registered and ready, the system appears broken to administrators.

**Secondary issues:**
- The `OnboardingFeature` model is referenced in 58 locations across the codebase, creating tight coupling.
- Feature state (active/inactive) is duplicated: stored in both the `onboarding_features.is_active` column AND Pennant's native `features` table.
- Adding a new feature requires both a new class AND a database seeder entry.
- The term "onboarding" is overloaded: it refers to both feature flags AND guided walkthroughs.

---

## 2. Goals

1. **Fresh-install visibility:** All registered feature toggles must appear in the admin UI immediately, without running seeders.
2. **Single source of truth:** Feature metadata lives in code (feature classes). Feature state lives in Pennant's native storage.
3. **Trunk-based development:** A developer adds a feature class → it appears in admin automatically. No database changes needed.
4. **Incremental rollout:** Support percentage-based rollouts (A/B testing) via Pennant's `Lottery`.
5. **Kill switch:** Any feature can be disabled globally via the admin UI without a deploy.
6. **Per-user overrides:** Continue supporting `Feature::for($user)->activate()` / `deactivate()` for targeted access.
7. **Separation of concerns:** Feature toggles (availability) are distinct from onboarding walkthroughs (UX).

---

## 3. Architecture

### 3.1 Core Principle

**Metadata in code, state in Pennant.**

- Each feature is represented by a PHP class that implements a `FeatureToggle` contract.
- The class defines its own metadata: name, summary, audience, steps, badge, accent, CTA.
- The class defines its own resolution logic: who should see this feature by default.
- Pennant stores ONLY the override state: global on/off, per-user on/off.
- The `onboarding_features` database table is removed entirely.

### 3.2 Feature Class Contract

```php
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

### 3.3 Example Feature Class

```php
<?php

declare(strict_types=1);

namespace App\Features\Toggles;

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
    
    public function resolve(User $scope): bool
    {
        // Only faculty see this by default
        return $scope->isFaculty();
    }
    
    public function lottery(): ?Lottery
    {
        // Uncomment for 50% rollout:
        // return Lottery::odds(1, 2);
        return null;
    }
    
    public function category(): string
    {
        return 'Faculty';
    }
}
```

### 3.4 Resolution Flow

When checking if a user has access to a feature:

1. **Pennant checks for explicit overrides first:**
   - Global override (`activateForEveryone` / `deactivateForEveryone`)
   - Per-user override (`for($user)->activate` / `deactivate`)
   - If an override exists, Pennant returns that value immediately.

2. **If no override exists, Pennant calls the class's `resolve()` method:**
   - The `resolve()` method checks audience matching (student/faculty/all).
   - Optionally applies a `Lottery` for percentage-based rollout.
   - Returns `true` or `false`.

3. **The result is cached by Pennant** for the duration of the request.

This means:
- **Default state:** Feature is available to its target audience (no DB query needed).
- **Global off:** Admin clicks "Deactivate" → `Feature::deactivateForEveryone()` → no one sees it.
- **Global on:** Admin clicks "Activate" → `Feature::activateForEveryone()` → everyone sees it (even outside target audience).
- **Per-user override:** Admin assigns to specific user → that user sees it regardless of audience.
- **Incremental rollout:** Developer sets `Lottery::odds(1, 10)` → 10% of target audience sees it.

### 3.5 Directory Structure

```
app/
  Features/
    Toggles/                          # NEW: All feature toggle classes
      FacultyDashboard.php
      FacultyActionCenter.php
      FacultyClasses.php
      ... (all faculty features)
      StudentDashboard.php
      StudentClasses.php
      ... (all student features)
      OnlineCollegeEnrollment.php     # Moved from root
      OnlineTesdaEnrollment.php       # Moved from root
      StudentSignaturePad.php         # Moved from root
      StudentAvatarUpload.php         # Moved from root
      
    Contracts/                        # NEW
      FeatureToggle.php               # Interface
      
    Concerns/                         # NEW
      ResolvesFeatureToggle.php         # Trait (replaces ResolvesOnboardingFeature)
      
    Onboarding/                       # KEPT but refactored
      # Only classes that are specifically about onboarding UX
      # Most will be moved to Toggles/
      
  Services/
    FeatureToggleRegistry.php         # NEW: Replaces FeatureClassRegistry
    FeatureToggleService.php          # NEW: Admin operations (activate, deactivate, overrides)
    OnboardingShareService.php        # REFACTORED: Reads from FeatureToggleRegistry
    
  Http/
    Controllers/
      AdministratorFeatureToggleController.php  # NEW: Replaces AdministratorOnboardingFeatureController
      OnboardingProgressController.php            # KEPT (independent concern)
      OnboardingDismissalController.php           # KEPT (independent concern)
      
  Models/
    # OnboardingFeature.php           # REMOVED
    OnboardingProgress.php            # KEPT
    OnboardingDismissal.php           # KEPT
    
resources/
  js/
    pages/
      administrators/
        feature-toggles/              # NEW: Replaces onboarding-features/
          index.tsx
          edit.tsx
```

---

## 4. What Gets Removed

### 4.1 Database

| Item | Action | Reason |
|------|--------|--------|
| `onboarding_features` table | **Drop** | Metadata now lives in code |
| `OnboardingFeature` model | **Delete** | No longer needed |
| `OnboardingFeatureFactory` | **Delete** | No model to factory |
| `OnboardingFeatureSeeder` | **Delete** | No table to seed |

### 4.2 Filament Resources

| Item | Action | Reason |
|------|--------|--------|
| `app/Filament/Resources/OnboardingFeatures/` | **Delete entire directory** | Uses removed model |
| `OnboardingFeatureResource.php` | **Delete** | Uses removed model |
| `OnboardingFeatureForm.php` | **Delete** | Uses removed model |
| `OnboardingFeaturesTable.php` | **Delete** | Uses removed model |
| `Pages/ListOnboardingFeatures.php` | **Delete** | Uses removed resource |
| `Pages/CreateOnboardingFeature.php` | **Delete** | Uses removed resource |
| `Pages/EditOnboardingFeature.php` | **Delete** | Uses removed resource |

### 4.3 Controllers & Policies

| Item | Action | Reason |
|------|--------|--------|
| `AdministratorOnboardingFeatureController.php` | **Delete** | Uses removed model |
| `OnboardingFeaturePolicy.php` | **Delete** | Uses removed model |

### 4.4 Frontend

| Item | Action | Reason |
|------|--------|--------|
| `resources/js/pages/administrators/onboarding-features/` | **Delete** | Replaced by feature-toggles |

### 4.5 Traits

| Item | Action | Reason |
|------|--------|--------|
| `ResolvesOnboardingFeature.php` | **Delete** | Queries removed model |

---

## 5. What Gets Created

### 5.1 Core Infrastructure

| Item | Purpose |
|------|---------|
| `App\Features\Contracts\FeatureToggle` | Interface all feature classes implement |
| `App\Features\Concerns\ResolvesFeatureToggle` | Trait providing audience matching, lottery support |
| `App\Services\FeatureToggleRegistry` | Registry mapping keys to classes (replaces `FeatureClassRegistry`) |
| `App\Services\FeatureToggleService` | Admin operations: list, toggle, overrides, purge |
| `App\Http\Controllers\AdministratorFeatureToggleController` | Inertia routes for admin UI |

### 5.2 Feature Classes

All existing `App\Features\Onboarding\*` classes are **migrated** to `App\Features\Toggles\*` and updated to implement `FeatureToggle`.

Non-onboarding features currently at `App\Features\*` root level are also **moved** to `App\Features\Toggles\*`:
- `StudentSignaturePad.php`
- `StudentAvatarUpload.php`
- `OnlineCollegeEnrollment.php`
- `OnlineTesdaEnrollment.php`

### 5.3 Frontend

| Item | Purpose |
|------|---------|
| `resources/js/pages/administrators/feature-toggles/index.tsx` | List all toggles, toggle global state, manage overrides |
| `resources/js/pages/administrators/feature-toggles/edit.tsx` | Edit feature metadata (read-only preview for now) |

---

## 6. What Gets Refactored

### 6.1 Services

**`OnboardingShareService`** → **`FeatureToggleService`**

- Remove dependency on `OnboardingFeature` model.
- Read feature metadata from `FeatureToggleRegistry`.
- Continue using `OnboardingDismissal` for dismissal tracking (independent concern).
- Continue using `OnboardingProgress` for progress tracking (independent concern).

### 6.2 Enrollment Controller

**`EnrollmentRegistrationController`**

- Replace `OnboardingFeature::query()->where('feature_key', ...)->value('is_active')` with `Feature::active(OnlineCollegeEnrollment::class)`.

### 6.3 AppServiceProvider

- Update `FeatureClassRegistry` references to `FeatureToggleRegistry`.
- Continue registering all class-based features with `Feature::define()`.

### 6.4 Routes

Replace all `onboarding-features` routes with `feature-toggles` routes:

```php
Route::get('/feature-toggles', [AdministratorFeatureToggleController::class, 'index'])->name('feature-toggles.index');
Route::post('/feature-toggles/{featureKey}/toggle', [AdministratorFeatureToggleController::class, 'toggle'])->name('feature-toggles.toggle');
Route::post('/feature-toggles/{featureKey}/activate-for-user', [AdministratorFeatureToggleController::class, 'activateForUser'])->name('feature-toggles.activate-for-user');
Route::post('/feature-toggles/{featureKey}/deactivate-for-user', [AdministratorFeatureToggleController::class, 'deactivateForUser'])->name('feature-toggles.deactivate-for-user');
Route::post('/feature-toggles/{featureKey}/purge-overrides', [AdministratorFeatureToggleController::class, 'purgeOverrides'])->name('feature-toggles.purge-overrides');
Route::get('/feature-toggles/{featureKey}/overridden-users', [AdministratorFeatureToggleController::class, 'overriddenUsers'])->name('feature-toggles.overridden-users');
```

Note: No `{record}` model binding needed — features are identified by string key.

### 6.5 Tests

- Remove all `OnboardingFeature::factory()->create()` calls.
- Use Pennant test helpers: `Feature::activateForEveryone(FeatureClass::class)` and `Feature::deactivateForEveryone(FeatureClass::class)`.
- Update `OnboardingFeatureResourceTest` → `FeatureToggleTest`.

---

## 7. Onboarding vs Feature Toggles: Separation of Concerns

### 7.1 What Is a Feature Toggle?

A **feature toggle** controls whether a piece of functionality is available to users. It answers: "Can this user access this feature?"

- Is the new dashboard enabled?
- Is online enrollment live?
- Is the signature pad available?

### 7.2 What Is Onboarding?

**Onboarding** is a UX layer that guides users through a feature when they first encounter it. It answers: "Has this user seen the walkthrough for this feature?"

- Show a 3-step tooltip tour for the dashboard.
- Track which steps the user has completed.
- Allow the user to dismiss the tour.

### 7.3 How They Relate

```
Feature Toggle (Pennant)          Onboarding (Progress/Dismissal)
        │                                    │
        ▼                                    ▼
"Can user see dashboard?"        "Has user completed dashboard tour?"
        │                                    │
   If YES ──────────────────► Show feature
        │                            │
        │                            ▼
        │              If not dismissed ──► Show onboarding walkthrough
        │                            │
        │                            ▼
        │                   Track progress in OnboardingProgress
        │                   Track dismissal in OnboardingDismissal
```

**Key insight:** The `OnboardingProgress` and `OnboardingDismissal` models are **independent** of feature toggles. They track UX state, not feature availability. They should be **kept** but decoupled from the `OnboardingFeature` model.

### 7.4 What Happens to Onboarding Features?

The current `onboarding-faculty-dashboard`, `onboarding-student-dashboard`, etc. classes serve **two purposes**:
1. They are feature toggles (control whether the feature is available).
2. They carry onboarding step metadata (for the walkthrough).

In the new architecture:
- **Purpose 1** becomes the primary role: they are feature toggles in `App\Features\Toggles\`.
- **Purpose 2** is still supported: the `steps()` method on the `FeatureToggle` interface carries walkthrough data.
- The `OnboardingShareService` reads `steps()` from the feature class instead of the DB model.
- The `OnboardingProgress` and `OnboardingDismissal` models continue to track user state independently.

**The onboarding system is NOT removed.** It is **decoupled** from the feature flag system. The feature flag says "you can use this." The onboarding system says "let me show you how."

---

## 8. Admin UI Design

### 8.1 Feature Toggles Index Page

```
┌─────────────────────────────────────────────────────────────┐
│  Feature Toggles                              [New Toggle] │
│  Pennant class-based features with per-user scoping       │
├─────────────────────────────────────────────────────────────┤
│  Total: 32 │ Active: 18 │ Inactive: 14 │ Overrides: 7      │
├─────────────────────────────────────────────────────────────┤
│  [Search...]  [Filter ▼]  [Category ▼]                      │
├─────────────────────────────────────────────────────────────┤
│  ☰ │ Faculty Dashboard          │ Faculty │ ● Active │ ⚙ │
│     │ faculty-dashboard           │         │ 3 overrides │  │
│  ─────────────────────────────────────────────────────────  │
│  ☰ │ Student Dashboard          │ Student │ ● Active │ ⚙ │
│     │ student-dashboard           │         │ 0 overrides │  │
│  ─────────────────────────────────────────────────────────  │
│  ☰ │ Online College Enrollment  │ Student │ ○ Inactive│ ⚙│
│     │ online-college-enrollment   │         │ 1 override │  │
│  ─────────────────────────────────────────────────────────  │
│  ☰ │ Faculty Toolkit            │ Faculty │ ○ Inactive│ ⚙│
│     │ faculty-toolkit             │         │ Lottery 10%│  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Per-Feature Actions

| Action | Behavior |
|--------|----------|
| **Toggle switch** | `Feature::activateForEveryone()` or `Feature::deactivateForEveryone()` |
| **User overrides** | Modal showing users with explicit overrides. Add/remove per-user. |
| **Purge overrides** | `Feature::forget()` — reset all users to default resolution |
| **Preview** | Show metadata: steps, CTA, audience, resolution logic |
| **Rollout %** | Slider to set `Lottery::odds(n, 100)` for incremental rollout |

### 8.3 New Feature Toggle Flow (Developer)

1. Create `App\Features\Toggles\MyNewFeature.php` implementing `FeatureToggle`.
2. Add class to `FeatureToggleRegistry::KEY_TO_CLASS` mapping.
3. Deploy.
4. Feature appears in admin UI automatically.
5. Admin enables it when ready.

No database migration. No seeder. No factory.

---

## 9. Data Flow

### 9.1 Fresh Install

```
1. Composer install → classes autoloaded
2. AppServiceProvider boot() → Feature::define() all classes from registry
3. Admin visits /feature-toggles
4. Controller calls FeatureToggleRegistry::all() → returns all classes
5. UI renders list with metadata from each class's methods
6. Pennant state is empty (no overrides) → all features show "Default" status
7. Default resolution (audience matching) determines user access
```

### 9.2 Admin Enables a Feature

```
1. Admin clicks toggle switch on "Faculty Dashboard"
2. POST /feature-toggles/faculty-dashboard/toggle
3. Controller calls Feature::activateForEveryone(FacultyDashboard::class)
4. Pennant stores global override in features table: scope=__laravel_null, value=true
5. All users now see Faculty Dashboard (bypasses audience matching)
```

### 9.3 Admin Sets Per-User Override

```
1. Admin opens "User Overrides" modal for "Faculty Dashboard"
2. Enters user ID and clicks "Activate"
3. POST /feature-toggles/faculty-dashboard/activate-for-user {user_id: 42}
4. Controller calls Feature::for($user)->activate(FacultyDashboard::class)
5. Pennant stores per-user override in features table: scope="App\Models\User|42", value=true
6. User 42 sees Faculty Dashboard regardless of global state
```

### 9.4 Developer Adds Incremental Rollout

```
1. Developer edits FacultyDashboard::lottery()
2. Returns Lottery::odds(1, 10) // 10% rollout
3. Deploy
4. For users without overrides, resolve() calls lottery->make()
5. 10% of matched audience sees the feature
6. Admin can still force global on/off via UI
```

---

## 10. Migration Strategy

### 10.1 Phase 1: Create New Infrastructure

1. Create `FeatureToggle` interface.
2. Create `ResolvesFeatureToggle` trait.
3. Create `FeatureToggleRegistry` (migrate from `FeatureClassRegistry`).
4. Create `FeatureToggleService`.
5. Create `AdministratorFeatureToggleController`.
6. Create new React pages under `feature-toggles/`.
7. Add new routes.

### 10.2 Phase 2: Migrate Feature Classes

1. Move all `App\Features\Onboarding\*` to `App\Features\Toggles\*`.
2. Update each class to implement `FeatureToggle`.
3. Move non-onboarding features to `App\Features\Toggles\*`.
4. Update `AppServiceProvider` to use new registry.
5. Update `OnboardingShareService` to read from new registry.

### 10.3 Phase 3: Update Consumers

1. Update `EnrollmentRegistrationController`.
2. Update all Blade/views that check `OnboardingFeature`.
3. Update all tests.
4. Update any other controllers/services referencing `OnboardingFeature`.

### 10.4 Phase 4: Remove Old System

1. Delete `OnboardingFeature` model.
2. Delete `OnboardingFeatureFactory`.
3. Delete `OnboardingFeatureSeeder`.
4. Delete `OnboardingFeaturePolicy`.
5. Delete `AdministratorOnboardingFeatureController`.
6. Delete `ResolvesOnboardingFeature` trait.
7. Delete `app/Filament/Resources/OnboardingFeatures/` directory.
8. Delete `resources/js/pages/administrators/onboarding-features/`.
9. Create migration to drop `onboarding_features` table.
10. Remove old routes.

### 10.5 Phase 5: Cleanup & Verification

1. Run full test suite.
2. Verify admin UI on fresh install.
3. Verify feature toggles work for all user types.
4. Verify onboarding progress/dismissal still works independently.
5. Run Pint formatter.

---

## 11. Testing Strategy

### 11.1 Unit Tests

| Test | Description |
|------|-------------|
| `FeatureToggleRegistryTest` | Keys resolve to correct classes, all classes are instantiable |
| `ResolvesFeatureToggleTest` | Audience matching works for student/faculty/all |
| `FeatureToggleServiceTest` | Activate/deactivate, overrides, purge work correctly |

### 11.2 Feature Tests

| Test | Description |
|------|-------------|
| `FeatureToggleAdminTest` | Admin UI lists all features on fresh install |
| `FeatureToggleToggleTest` | Toggle switch changes Pennant state |
| `FeatureToggleOverrideTest` | Per-user overrides work via API |
| `FeatureToggleRolloutTest` | Lottery-based rollout affects resolution |
| `FeatureToggleAudienceTest` | Features resolve correctly for different user roles |

### 11.3 Integration Tests

| Test | Description |
|------|-------------|
| `OnboardingDecoupledTest` | Onboarding progress/dismissal work without OnboardingFeature model |
| `EnrollmentFeatureToggleTest` | Enrollment controllers use Pennant, not DB model |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing consumer updates | High | Comprehensive grep for `OnboardingFeature::` before removal |
| Filament navigation broken | Medium | Remove Filament resource entirely; admin UI is Inertia-based |
| Onboarding UX broken | Medium | Keep `OnboardingProgress`/`OnboardingDismissal`; only remove `OnboardingFeature` |
| Feature class bloat | Low | Group by category; registry is a simple array map |
| Non-devs can't edit metadata | Low | Metadata is developer concern; state is admin concern. This is by design. |

---

## 13. Exit Criteria

- [ ] All feature classes implement `FeatureToggle` and live in `App\Features\Toggles\`.
- [ ] `FeatureToggleRegistry` maps all keys to classes.
- [ ] Admin UI at `/administrators/feature-toggles` shows all features on fresh install.
- [ ] Toggle switch updates Pennant state (global on/off).
- [ ] Per-user overrides work via API.
- [ ] `OnboardingFeature` model, table, factory, seeder are removed.
- [ ] `OnboardingProgress` and `OnboardingDismissal` continue to work independently.
- [ ] All tests pass.
- [ ] Code formatted with Pint.

---

## 14. Spec Self-Review

**Placeholder scan:** No TBDs or TODOs found.  
**Internal consistency:** Architecture uses Pennant for state, classes for metadata — consistent throughout.  
**Scope check:** This is a focused restructure of feature management. Onboarding UX is decoupled but not rebuilt.  
**Ambiguity check:** "Onboarding" term is clarified — feature toggles control availability, onboarding controls UX walkthroughs.
