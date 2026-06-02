import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type SelectOption = { value: string; label: string };
type EntityOption = { id: string | number; label: string };

interface ClassFilters {
    search?: string | null;
    classification?: string | null;
    course_id?: number | null;
    shs_track_id?: number | null;
    shs_strand_id?: number | null;
    subject_code?: string | null;
    room_id?: number | null;
    faculty_id?: string | null;
    academic_year?: number | null;
    grade_level?: string | null;
    semester?: string | null;
    available_slots?: boolean | null;
    fully_enrolled?: boolean | null;
}

interface ClassFilterOptions {
    classifications: SelectOption[];
    sections: SelectOption[];
    semesters: SelectOption[];
    grade_levels: SelectOption[];
    day_of_week: SelectOption[];
    courses: EntityOption[];
    faculties: EntityOption[];
    rooms: EntityOption[];
    shs_tracks: EntityOption[];
}

interface ClassFiltersSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: ClassFilters;
    handleFilterChange: (key: string, value: string | number | boolean | null) => void;
    options: ClassFilterOptions;
    hasActiveFilters: boolean;
    clearAll: () => void;
}

export function ClassFiltersSheet({
    open,
    onOpenChange,
    filters,
    handleFilterChange,
    options,
    hasActiveFilters,
    clearAll,
}: ClassFiltersSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Refine the class list.</SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-auto px-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Course</Label>
                            <Select
                                value={filters.course_id ? String(filters.course_id) : "all"}
                                onValueChange={(value) => handleFilterChange("course_id", value === "all" ? null : Number(value))}
                                disabled={filters.classification === "shs"}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All courses</SelectItem>
                                    {options.courses.map((course) => (
                                        <SelectItem key={course.id} value={String(course.id)}>
                                            {course.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Faculty</Label>
                            <Select
                                value={filters.faculty_id ? String(filters.faculty_id) : "all"}
                                onValueChange={(value) => handleFilterChange("faculty_id", value === "all" ? null : Number(value))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Faculty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All faculty</SelectItem>
                                    {options.faculties.map((faculty) => (
                                        <SelectItem key={faculty.id} value={String(faculty.id)}>
                                            {faculty.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Room</Label>
                            <Select
                                value={filters.room_id ? String(filters.room_id) : "all"}
                                onValueChange={(value) => handleFilterChange("room_id", value === "all" ? null : Number(value))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Room" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All rooms</SelectItem>
                                    {options.rooms.map((room) => (
                                        <SelectItem key={room.id} value={String(room.id)}>
                                            {room.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Semester</Label>
                            <Select value={filters.semester ?? "all"} onValueChange={(value) => handleFilterChange("semester", value === "all" ? null : value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All semesters</SelectItem>
                                    {options.semesters.map((semester) => (
                                        <SelectItem key={semester.value} value={semester.value}>
                                            {semester.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>College year</Label>
                            <Select
                                value={filters.academic_year ? String(filters.academic_year) : "all"}
                                onValueChange={(value) => handleFilterChange("academic_year", value === "all" ? null : Number(value))}
                                disabled={filters.classification === "shs"}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All college years</SelectItem>
                                    {[1, 2, 3, 4].map((year) => (
                                        <SelectItem key={year} value={String(year)}>
                                            {year} year
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>SHS grade</Label>
                            <Select
                                value={filters.grade_level ?? "all"}
                                onValueChange={(value) => handleFilterChange("grade_level", value === "all" ? null : value)}
                                disabled={filters.classification === "college"}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All SHS grades</SelectItem>
                                    {options.grade_levels.map((grade) => (
                                        <SelectItem key={grade.value} value={grade.value}>
                                            {grade.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-lg border p-4">
                        <div className="text-foreground text-sm font-medium">Enrollment</div>
                        <label className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">Has available slots</span>
                            <Checkbox
                                checked={Boolean(filters.available_slots)}
                                onCheckedChange={(checked) => handleFilterChange("available_slots", checked ? true : null)}
                            />
                        </label>
                        <label className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">Fully enrolled only</span>
                            <Checkbox
                                checked={filters.fully_enrolled === true}
                                onCheckedChange={(checked) => handleFilterChange("fully_enrolled", checked ? true : null)}
                            />
                        </label>
                    </div>
                </div>

                <SheetFooter>
                    <Button variant="outline" onClick={clearAll} disabled={!hasActiveFilters && (filters.search ?? "") === ""}>
                        Clear
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
