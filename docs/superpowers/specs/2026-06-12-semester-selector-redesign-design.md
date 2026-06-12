# SemesterSelector redesign — migrate to new Select pattern

## Goal

Rewrite `resources/js/components/semester-selector.tsx` to use the new `@reui/c-select-1` pattern (the `Select` `items` prop + `Field`/`FieldGroup`/`SelectGroup` markup) introduced via `bunx --bun shadcn@latest add @reui/c-select-1`. Drop the override indicators. Preserve all current public behavior and consumer call sites.

## Scope

- **In scope:** Single file rewrite of `resources/js/components/semester-selector.tsx`. No new tests. No changes to consumers (`admin-header.tsx`, `portal-sidebar.tsx`, `site-header.tsx`, `student/dashboard.tsx`, `pages/administrators/enrollments/*`).
- **Out of scope:** New override UX, accessibility labels, unit/feature tests, restyling unrelated to the new Select pattern.

## Public API (unchanged)

```ts
export interface SemesterSelectorProps {
    currentSemester?: number | null;
    currentSchoolYear?: number | null;
    systemSemester?: number | null;
    systemSchoolYear?: number | null;
    availableSemesters?: Record<number, string> | null;
    availableSchoolYears?: Record<number, string> | null;
}
```

The exported `SemesterSelector` function keeps the same name and signature. `systemSemester` and `systemSchoolYear` props remain on the type (for forward-compat with any external callers) but are no longer rendered.

## Behavior (unchanged)

- `handleSemesterChange(value)` calls `router.put(resolveSettingsEndpoint("semester"), { semester: parseInt(value) }, { preserveScroll: true })`.
- `handleSchoolYearChange(value)` calls `router.put(resolveSettingsEndpoint("school-year"), { school_year_start: parseInt(value) }, { preserveScroll: true })`.
- `resolveSettingsEndpoint` keeps the same `/administrators`, `/student`, `/faculty`, and default fallbacks.
- Initial selected values derived from `currentSemester` and `currentSchoolYear` as today.

## Markup structure

```
<TooltipProvider>            // REMOVED
  <div className="flex items-center gap-3">
    <div>                    // REMOVED outer wrapper for semester
      <Select>               // semester
        <Field>
          <Select items={...}>
            <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>{items.map(...)}</SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </Select>
    </div>
    <div>                    // REMOVED outer wrapper for school year
      <Select>               // school year — same shape
      </Select>
    </div>
  </div>
</TooltipProvider>
```

**New structure:**

```
<FieldGroup orientation="responsive" className="flex items-center gap-3">
  <Field>
    <Select
      items={semesterItems}
      value={currentSemesterValue}
      onValueChange={handleSemesterChange}
    >
      <SelectTrigger className="h-8 w-[140px]">
        <SelectValue placeholder="Select Semester" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {semesterItems.map(item => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </Field>
  <Field>
    <Select
      items={schoolYearItems}
      value={currentSchoolYearValue}
      onValueChange={handleSchoolYearChange}
    >
      <SelectTrigger className="h-8 w-[140px]">
        <SelectValue placeholder="Select School Year" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {schoolYearItems.map(item => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </Field>
</FieldGroup>
```

### Items construction

`semesterItems` and `schoolYearItems` are derived in the component body:

```ts
const semesterItems = Object.entries(safeAvailableSemesters).map(([value, label]) => ({
    label,
    value,
}));

const schoolYearItems = Object.entries(safeAvailableSchoolYears).map(([value, label]) => ({
    label,
    value,
}));
```

These feed the `Select` `items` prop and drive the `SelectGroup` `SelectItem` mapping.

### Layout

- `FieldGroup` uses `orientation="responsive"` so it stacks vertically on small screens and lays out horizontally at the `md` breakpoint.
- Each trigger keeps the existing `h-8 w-[140px]` sizing to prevent header layout shifts in current call sites.
- `Field` is used without a `FieldLabel` (no visible labels) — consistent with current header treatment.

## Imports

**Drop:**
- `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` from `@/components/ui/tooltip`
- `IconUser`, `IconSettings` from `@tabler/icons-react`

**Add:**
- `Field` from `@/components/ui/field`
- `FieldGroup` from `@/components/ui/field`
- `SelectGroup` from `@/components/ui/select`

**Keep:**
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui/select`
- `router` from `@inertiajs/react`

## Files touched

| File | Change |
| --- | --- |
| `resources/js/components/semester-selector.tsx` | Full rewrite of body. Public type and exports unchanged. |

## Files NOT touched

- `resources/js/components/administrators/admin-header.tsx`
- `resources/js/components/portal-sidebar.tsx`
- `resources/js/components/site-header.tsx`
- `resources/js/pages/student/dashboard.tsx`
- `resources/js/pages/administrators/enrollments/*`
- `resources/js/components/ui/select.tsx`
- `resources/js/components/ui/field.tsx`

## Verification

- `vendor/bin/sail bin pint --dirty --format agent` (lint)
- `vendor/bin/sail artisan test --compact` (existing suite must remain green)
- Manual smoke: load `/student/dashboard`, `/administrators/...`, `/faculty/...` and confirm both selects render, change values, and the Inertia PUT hits the right endpoint. (User can confirm via the running app — no new tests authored.)

## Risks

- `Select` value coercion: numeric `currentSemester` is converted to `string` exactly as today, then the `SelectItem` `value` matches via string equality (handled by base-ui's `Select`).
- The `items` prop duplicates the `SelectItem` children but base-ui uses it for typeahead and `SelectValue` label resolution — that is the intent of the c-select-1 pattern.
- Consumer call sites pass `currentSemester` / `currentSchoolYear` and the `available*` maps; both still flow through unchanged.
