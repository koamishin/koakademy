# Student Onboarding UX Alignment with Faculty Pattern

## Goal
- Replace the student's modal-based `OnboardingExperience` with the faculty's `OnboardingTour` + `OnboardingChecklistWidget` pattern on the student dashboard.

## Constraints & Preferences
- Student onboarding should follow faculty's UX pattern (tooltip tour + sidebar checklist widget) — not modals
- Trigger = "first time to login" (no 14-day window) using `onboarding_progress` table absence as the signal
- Faculty stays aligned to student's new pattern (helper method + same gating)

## Progress
### Done
- Added `User::isNewToOnboarding(string $variant): bool` helper at `app/Models/User.php:113-128`
- `routes/web/faculty-portal.php:43` uses `$user->isNewToOnboarding('faculty')`; dropped `Carbon\CarbonInterface` import
- `app/Http/Controllers/StudentDashboardController.php:103` uses `$user->isNewToOnboarding('student')`; dropped `Carbon\CarbonInterface` import
- Tests rewritten: `tests/Feature/FacultyDashboardOnboardingTest.php` and `tests/Feature/StudentDashboardOnboardingTest.php` (no progress row = new, pre-created row = not new)
- Student dashboard React page fully refactored (`resources/js/pages/student/dashboard.tsx`):
  - Imports: dropped `OnboardingExperience, OnboardingFeatureData`; added `OnboardingChecklistWidget` from `@/components/onboarding-checklist`, `OnboardingTour, TourStep` from `@/components/onboarding-tour`
  - `StudentDashboardProps` extended with `is_new_user: boolean`
  - Fixed broken `studentChecklist` `actionRoute: "/student/grades"` → `"/student/classes"` and `actionLabel: "View Grades"` → `"View Classes"` (route does not exist; `/student/classes` is the grade-access path)
  - Added `studentTourSteps: TourStep[]` array with 5 steps targeting `data-tour` selectors: welcome-header, stats-grid, up-next, my-subjects, id-card
  - `usePage` type simplified: `features?: unknown[]`; dropped `dismissEndpoint` field
  - Gating logic: `shouldForceOnboarding = (props.onboarding?.forceOnLogin ?? false) && is_new_user`; `hasOnboardingFeatures = (props.onboarding?.features?.length ?? 0) > 0`; `onboardingEnabled = shouldForceOnboarding || hasOnboardingFeatures`
  - Added `data-tour="welcome-header"` to welcome header section
  - Rendered `<OnboardingChecklistWidget />` inline between `<MobileQuickActions />` and the stats grid (mirroring faculty placement)
  - Added `data-tour="stats-grid"` to stats section
  - Added `data-tour="up-next"` to Up Next section
  - Added `data-tour="my-subjects"` to the CourseCard grid div
  - Added `data-tour="id-card"` to the ID card `motion.div` in the sidebar
  - Return restructured: extracted body into `const body = (<>...</>)`; conditional wrap `{onboardingEnabled ? <OnboardingProvider variant="student" ...><OnboardingTour steps={studentTourSteps} />{body}</OnboardingProvider> : body}`
- TypeScript verification: `tsc --noEmit` ran clean on the student dashboard — all 8 errors in my files are pre-existing casing issues (`components/` vs `Components/`) that also appear in `faculty/dashboard.tsx` (which I didn't touch), confirming project-wide pre-existing
- Pint passed on all PHP changes; `php -l` clean

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Use `onboarding_progress` table absence (not `created_at` window) as "first time" signal — aligns page-level gate with `OnboardingProvider`'s internal auto-open logic, both reading same source of truth
- Mirror faculty's `onboardingEnabled` gate: `(forceOnLogin && is_new_user) || onboardingFeatures.length > 0`
- Student keeps `variant="student"` in `OnboardingProvider` (so progress row is keyed correctly)
- 5 tour steps (matching faculty): welcome-header, stats-grid, up-next, my-subjects, id-card — student-specific copy
- `OnboardingChecklistWidget` placed between `MobileQuickActions` and stats grid (mirroring faculty)
- Checklist `check-grades` action route fixed from nonexistent `/student/grades` to existing `/student/classes`; label changed to "View Classes" for accuracy
- Body extracted to `const body = (<>...</>)` to share between the OnboardingProvider-wrapped and bare branches without duplicating ~350 lines of JSX
- `usePage` type's `features` typed as `unknown[]` since only `.length` is consumed — avoids importing `OnboardingFeatureData`

## Next Steps
- (none — all implementation work complete)

## Critical Context
- `OnboardingTour` and `OnboardingChecklistWidget` both call `useOnboarding()` — must be inside `OnboardingProvider`
- `OnboardingTour` uses `useElementRect` to measure `data-tour` selectors via `document.querySelector`; targets must exist in DOM
- Faculty's `DashboardContent` is inside `OnboardingProvider` and renders `OnboardingTour` right after `<Head>` — pattern mirrored in student dashboard
- Student test DB env: `dccp_admin_testing` PostgreSQL DB not provisioned locally — same blocker as faculty test, not a code issue
- `OnboardingExperience` import path was `@/components/onboarding-experience`; new imports: `@/components/onboarding-checklist`, `@/components/onboarding-tour`
- `OnboardingExperience` was never deleted from the codebase — it may now be unused; consider removing it in a follow-up if confirmed unused across all callers
- Pre-existing project-wide casing issues: `resources/js/components/` and `resources/js/Components/` both exist; `types/` and `Types/` both exist. Not caused by these changes.

## Relevant Files
- `C:\Users\MIS\Projects\koakademy\app\Models\User.php` — added `isNewToOnboarding()` helper
- `C:\Users\MIS\Projects\koakademy\routes\web\faculty-portal.php` — uses helper for faculty variant
- `C:\Users\MIS\Projects\koakademy\app\Http\Controllers\StudentDashboardController.php` — uses helper for student variant
- `C:\Users\MIS\Projects\koakademy\resources\js\pages\faculty\dashboard.tsx` — reference pattern for tour+widget structure
- `C:\Users\MIS\Projects\koakademy\resources\js\pages\student\dashboard.tsx` — fully refactored: imports (lines 1-5), `StudentDashboardProps.is_new_user` (line 72), `studentChecklist` fix (lines 125-131), `studentTourSteps` (lines 143-183), function signature (line 945), `usePage` type (lines 946-953), gating logic (lines 962-965), `data-tour` attributes (lines 1049, 1123, 1125, 1156, 1227, 1356), `OnboardingChecklistWidget` render (line 1123), `const body` extraction (line 1029), conditional return wrap (lines 1410-1423)
- `C:\Users\MIS\Projects\koakademy\resources\js\components\onboarding-tour.tsx` — `TourStep` type + component
- `C:\Users\MIS\Projects\koakademy\resources\js\components\onboarding-checklist.tsx` — widget component (no props, uses context)
- `C:\Users\MIS\Projects\koakademy\resources\js\components\onboarding-context.tsx` — `OnboardingProvider`, `useOnboarding`, `OnboardingProgress` type
- `C:\Users\MIS\Projects\koakademy\resources\js\components\onboarding-experience.tsx` — no longer imported by student dashboard; may be unused
- `C:\Users\MIS\Projects\koakademy\app\Models\OnboardingProgress.php` — `onboarding_progress` model used by helper
- `C:\Users\MIS\Projects\koakademy\app\Http\Controllers\OnboardingProgressController.php` — progress persistence endpoint
- `C:\Users\MIS\Projects\koakademy\app\Http\Middleware\HandleInertiaRequests.php` — shares `onboarding.forceOnLogin`, `features` to Inertia
- `C:\Users\MIS\Projects\koakademy\tests\Feature\FacultyDashboardOnboardingTest.php` — rewritten
- `C:\Users\MIS\Projects\koakademy\tests\Feature\StudentDashboardOnboardingTest.php` — rewritten
- `C:\Users\MIS\Projects\koakademy\routes\web\student.php` — confirms `/student/grades` route does not exist; only `/student/classes` is the grade-access path
