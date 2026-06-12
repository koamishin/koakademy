# SemesterSelector Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `resources/js/components/semester-selector.tsx` to the new `@reui/c-select-1` Select pattern (`Field`/`FieldGroup`/`SelectGroup` + `items` prop), drop override indicators, and preserve all current public behavior.

**Architecture:** Single-file rewrite. Public props and behavior stay identical; the JSX switches to a `FieldGroup` of two `Field`-wrapped `Select`s using the `items` prop. No new tests (per user choice). No consumer changes.

**Tech Stack:** React 19, Inertia.js v3, base-ui Select primitives, Tailwind v4, TypeScript, Pest (PHP) for sanity regression.

---

## Task 1: Rewrite semester-selector.tsx

**Files:**
- Modify: `resources/js/components/semester-selector.tsx` (full body rewrite, public type and exports unchanged)

- [ ] **Step 1: Replace the file contents with the new implementation**

Write the following to `resources/js/components/semester-selector.tsx`:

```tsx
import { Field, FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { router } from "@inertiajs/react";

export interface SemesterSelectorProps {
    currentSemester?: number | null;
    currentSchoolYear?: number | null;
    systemSemester?: number | null;
    systemSchoolYear?: number | null;
    availableSemesters?: Record<number, string> | null;
    availableSchoolYears?: Record<number, string> | null;
}

export function SemesterSelector({
    currentSemester,
    currentSchoolYear,
    availableSemesters,
    availableSchoolYears,
}: SemesterSelectorProps) {
    function resolveSettingsEndpoint(path: "semester" | "school-year"): string {
        if (typeof window !== "undefined") {
            const pathname = window.location.pathname;
            if (pathname.startsWith("/administrators")) {
                return `/administrators/settings/${path}`;
            }
            if (pathname.startsWith("/student")) {
                return `/student/settings/${path}`;
            }
            if (pathname.startsWith("/faculty")) {
                return `/faculty/settings/${path}`;
            }
        }

        return `/settings/${path}`;
    }

    const handleSemesterChange = (value: string) => {
        router.put(
            resolveSettingsEndpoint("semester"),
            {
                semester: parseInt(value),
            },
            {
                preserveScroll: true,
            },
        );
    };

    const handleSchoolYearChange = (value: string) => {
        router.put(
            resolveSettingsEndpoint("school-year"),
            {
                school_year_start: parseInt(value),
            },
            {
                preserveScroll: true,
            },
        );
    };

    const currentSemesterValue = currentSemester != null ? currentSemester.toString() : undefined;
    const currentSchoolYearValue = currentSchoolYear != null ? currentSchoolYear.toString() : undefined;

    const safeAvailableSemesters: Record<number, string> = availableSemesters ?? {};
    const safeAvailableSchoolYears: Record<number, string> = availableSchoolYears ?? {};

    const semesterItems = Object.entries(safeAvailableSemesters).map(([value, label]) => ({
        label,
        value,
    }));

    const schoolYearItems = Object.entries(safeAvailableSchoolYears).map(([value, label]) => ({
        label,
        value,
    }));

    return (
        <FieldGroup orientation="responsive" className="flex items-center gap-3">
            <Field>
                <Select items={semesterItems} value={currentSemesterValue} onValueChange={handleSemesterChange}>
                    <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                        <SelectGroup>
                            {semesterItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>

            <Field>
                <Select items={schoolYearItems} value={currentSchoolYearValue} onValueChange={handleSchoolYearChange}>
                    <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Select School Year" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                        <SelectGroup>
                            {schoolYearItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>
        </FieldGroup>
    );
}
```

- [ ] **Step 2: Verify the file compiles via the project typecheck**

Run: `vendor/bin/sail npx tsc --noEmit -p resources/js/tsconfig.json 2>&1 | head -50`
Expected: no errors referencing `semester-selector.tsx`.

(If a `tsconfig.json` is not present at that path, fall back to: `vendor/bin/sail npx tsc --noEmit` from the repo root. The relevant signal is "no errors".)

- [ ] **Step 3: Run the full frontend type check / build smoke**

Run: `vendor/bin/sail npm run build 2>&1 | tail -30`
Expected: build completes without errors mentioning `semester-selector.tsx`.

- [ ] **Step 4: Run the existing test suite to confirm no regression**

Run: `vendor/bin/sail artisan test --compact 2>&1 | tail -30`
Expected: all tests pass (no test was added, but the suite must remain green because we only touched a React component file).

- [ ] **Step 5: Run Pint on any modified PHP files (none expected, but be safe)**

Run: `vendor/bin/sail bin pint --dirty --format agent 2>&1 | tail -10`
Expected: "no files to fix" or all files already pass. (This is a no-op for a TS-only change but the AGENTS.md rule says to run it on any modification.)

- [ ] **Step 6: Commit**

```bash
git add resources/js/components/semester-selector.tsx
git commit -m "refactor(semester-selector): migrate to new Select pattern"
```

---

## Self-Review

- **Spec coverage:** ✓ Public type unchanged, `handleSemesterChange`/`handleSchoolYearChange` preserved, `resolveSettingsEndpoint` preserved, `currentSemesterValue`/`currentSchoolYearValue` derivation preserved, override indicators removed, FieldGroup responsive layout, no visible labels, h-8 w-[140px] triggers, `items` prop, `alignItemWithTrigger={false}`. All checked.
- **Placeholder scan:** No TBDs/TODOs. Full code provided.
- **Type consistency:** `Select` `items` shape `{ label: string; value: string }` matches `c-select-1` example. `SelectItem` `value` is `string` (matches stringified `currentSemesterValue`). `SelectValue` placeholder strings spelled identically. Public exported function `SemesterSelector` and type `SemesterSelectorProps` unchanged.
