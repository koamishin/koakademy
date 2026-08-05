import { StudentScheduleBoard } from "@/components/class/student-schedule-board";
import { ClassData } from "@/components/data-table";
import StudentLayout from "@/components/student/student-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useClassFilters } from "@/pages/classes/hooks/use-class-filters";
import { formatClassSchedule, formatTime12Hour, parseTimeToMinutes, useClassSchedule } from "@/pages/classes/hooks/use-class-schedule";
import { StudentScheduleConflict } from "@/types/student-schedule";
import { User as UserType } from "@/types/user";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconAlertTriangle,
    IconCalendarEvent,
    IconChevronRight,
    IconClock,
    IconFilter,
    IconListDetails,
    IconMapPin,
    IconRefresh,
    IconSchool,
    IconSearch,
    IconUser,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

interface StudentScheduleProps {
    user: UserType;
    faculty_data: {
        classes: ClassData[];
        stats: unknown[];
    };
    schedule_conflicts: StudentScheduleConflict[];
    rooms: { id: number; name: string }[];
}

function formatClock(value: string): string {
    const minutes = parseTimeToMinutes(value);
    return minutes === null ? value : formatTime12Hour(minutes);
}

function ConflictSummary({ conflicts }: { conflicts: StudentScheduleConflict[] }) {
    if (conflicts.length === 0) return null;

    return (
        <section className="border-destructive/35 bg-destructive/5 rounded-lg border" aria-labelledby="schedule-conflicts-title">
            <div className="border-destructive/20 flex items-center gap-2 border-b px-4 py-3">
                <IconAlertTriangle className="text-destructive size-5 shrink-0" />
                <div>
                    <h2 id="schedule-conflicts-title" className="text-foreground text-sm font-semibold">
                        {conflicts.length} schedule conflict{conflicts.length === 1 ? "" : "s"}
                    </h2>
                    <p className="text-muted-foreground text-xs">Overlapping enrolled classes</p>
                </div>
            </div>
            <div className="divide-destructive/15 divide-y">
                {conflicts.map((conflict) => (
                    <div key={conflict.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[10rem_minmax(0,1fr)] lg:items-center">
                        <div>
                            <p className="text-foreground text-sm font-medium">{conflict.day}</p>
                            <p className="text-destructive text-xs font-medium">
                                {formatClock(conflict.overlap_start)}-{formatClock(conflict.overlap_end)}
                            </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {conflict.classes.map((classItem) => (
                                <Link
                                    key={classItem.schedule_id}
                                    href={`/student/classes/${classItem.id}`}
                                    className="border-destructive/20 bg-background hover:border-destructive/40 flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors"
                                >
                                    <span className="min-w-0">
                                        <span className="text-foreground block truncate text-xs font-semibold">
                                            {classItem.subject_code} · {classItem.section}
                                        </span>
                                        <span className="text-muted-foreground block truncate text-[11px]">
                                            {formatClock(classItem.start_time)}-{formatClock(classItem.end_time)} · {classItem.room}
                                        </span>
                                    </span>
                                    <IconChevronRight className="text-muted-foreground size-4 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function StudentClassList({ classes }: { classes: ClassData[] }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((classItem) => (
                <Link
                    key={classItem.id}
                    href={`/student/classes/${classItem.id}`}
                    className="border-border bg-background hover:border-primary/40 group rounded-lg border p-4 transition-colors"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-primary text-xs font-semibold">{classItem.subject_code}</p>
                            <h2 className="text-foreground mt-1 line-clamp-2 text-sm font-semibold">{classItem.subject_title}</h2>
                        </div>
                        <Badge variant="outline">{classItem.section}</Badge>
                    </div>
                    <div className="text-muted-foreground mt-4 grid gap-2 text-xs">
                        <span className="flex items-start gap-2">
                            <IconClock className="mt-0.5 size-3.5 shrink-0" />
                            <span>{classItem.schedule || "Schedule TBA"}</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <IconMapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{classItem.room || "Room TBA"}</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <IconUser className="size-3.5 shrink-0" />
                            <span className="truncate">{classItem.faculty_name || "Faculty TBA"}</span>
                        </span>
                    </div>
                    <span className="text-primary mt-4 flex items-center justify-end text-xs font-medium">
                        View details <IconChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                </Link>
            ))}
        </div>
    );
}

export default function StudentSchedule({ user, faculty_data, schedule_conflicts = [], rooms }: StudentScheduleProps) {
    const [viewMode, setViewMode] = useState<"schedule" | "classes">("schedule");

    useEffect(() => {
        const savedMode = window.localStorage.getItem("koakademy.student.schedule.viewMode");
        setViewMode(savedMode === "classes" || savedMode === "gallery" || savedMode === "list" ? "classes" : "schedule");
    }, []);

    const setAndSaveViewMode = (mode: "schedule" | "classes") => {
        setViewMode(mode);
        window.localStorage.setItem("koakademy.student.schedule.viewMode", mode);
    };

    const processedClasses = useMemo(
        () =>
            (faculty_data?.classes ?? []).map((classItem) => ({
                ...classItem,
                schedule: formatClassSchedule(classItem.schedules ?? []) || classItem.schedule || "TBA",
            })),
        [faculty_data?.classes],
    );

    const { events, unscheduled, nextUp } = useClassSchedule(processedClasses, rooms);
    const canonicalConflictIds = useMemo(
        () => new Set(schedule_conflicts.flatMap((conflict) => conflict.classes.map((classItem) => String(classItem.id)))),
        [schedule_conflicts],
    );
    const { search, setSearch, filterRoom, setFilterRoom, filterDay, effectiveClasses, resetFilters } = useClassFilters(
        processedClasses,
        events,
        canonicalConflictIds,
        unscheduled,
        "koakademy.student.schedule",
    );

    const effectiveClassIds = useMemo(() => new Set(effectiveClasses.map((classItem) => String(classItem.id))), [effectiveClasses]);
    const visibleEvents = useMemo(() => events.filter((event) => effectiveClassIds.has(String(event.classItem.id))), [effectiveClassIds, events]);
    const visibleConflicts = useMemo(
        () => schedule_conflicts.filter((conflict) => conflict.classes.every((classItem) => effectiveClassIds.has(String(classItem.id)))),
        [effectiveClassIds, schedule_conflicts],
    );
    const stats = useMemo(
        () => ({
            scheduled: new Set(visibleEvents.map((event) => String(event.classItem.id))).size,
            awaiting: effectiveClasses.filter((classItem) => !visibleEvents.some((event) => String(event.classItem.id) === String(classItem.id)))
                .length,
            conflicts: visibleConflicts.length,
        }),
        [effectiveClasses, visibleConflicts.length, visibleEvents],
    );
    const period = processedClasses[0]
        ? `${processedClasses[0].school_year ?? "Current year"} · Semester ${processedClasses[0].semester ?? "-"}`
        : "Current academic period";
    const hasActiveFilters = search.trim() !== "" || filterRoom !== "all";

    return (
        <StudentLayout user={{ name: user.name, email: user.email, avatar: user.avatar, role: user.role }}>
            <Head title="Class Schedule" />

            <main className="mx-auto w-full max-w-7xl min-w-0 space-y-4 overflow-x-hidden px-3 py-4 pb-24 sm:px-5 md:space-y-6 md:px-6 md:py-6">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-muted-foreground text-xs font-medium">{period}</p>
                        <h1 className="text-foreground mt-1 text-2xl font-semibold">Class schedule</h1>
                    </div>
                    <div className="border-border bg-background grid grid-cols-3 overflow-hidden rounded-lg border lg:w-[28rem]">
                        {[
                            ["Scheduled", stats.scheduled],
                            ["Awaiting", stats.awaiting],
                            ["Conflicts", stats.conflicts],
                        ].map(([label, value], index) => (
                            <div key={String(label)} className={cn("px-3 py-2.5", index > 0 && "border-border border-l")}>
                                <p className="text-muted-foreground text-[10px] font-medium uppercase">{label}</p>
                                <p
                                    className={cn(
                                        "mt-0.5 text-lg font-semibold",
                                        label === "Conflicts" && Number(value) > 0 ? "text-destructive" : "text-foreground",
                                    )}
                                >
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                </header>

                {nextUp && effectiveClassIds.has(String(nextUp.event.classItem.id)) && (
                    <Link
                        href={`/student/classes/${nextUp.event.classItem.id}`}
                        className="border-border bg-muted/25 hover:border-primary/35 flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
                    >
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                            <IconCalendarEvent className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-muted-foreground text-[10px] font-medium uppercase">Next class · in {nextUp.in}</p>
                            <p className="text-foreground truncate text-sm font-semibold">{nextUp.event.classItem.subject_title}</p>
                            <p className="text-muted-foreground truncate text-xs">
                                {nextUp.event.day} · {formatTime12Hour(nextUp.event.startMinutes)} · {nextUp.event.roomLabel}
                            </p>
                        </div>
                        <IconChevronRight className="text-muted-foreground size-5 shrink-0" />
                    </Link>
                )}

                <ConflictSummary conflicts={visibleConflicts} />

                <section
                    className="border-border bg-background flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center"
                    aria-label="Schedule controls"
                >
                    <div className="relative min-w-0 flex-1">
                        <IconSearch className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search classes"
                            className="h-9 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={filterRoom !== "all" ? "secondary" : "outline"}
                                    size="icon"
                                    className="size-9"
                                    aria-label="Filter schedule"
                                    title="Filter schedule"
                                >
                                    <IconFilter className="size-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-72">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="student-schedule-room">Room</Label>
                                        {hasActiveFilters && (
                                            <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="h-7 px-2 text-xs">
                                                Reset
                                            </Button>
                                        )}
                                    </div>
                                    <Select value={filterRoom} onValueChange={setFilterRoom}>
                                        <SelectTrigger id="student-schedule-room" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All rooms</SelectItem>
                                            {rooms.map((room) => (
                                                <SelectItem key={room.id} value={String(room.id)}>
                                                    {room.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <div className="bg-muted grid grid-cols-2 rounded-md p-1">
                            <Button
                                type="button"
                                variant={viewMode === "schedule" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setAndSaveViewMode("schedule")}
                                className="h-7 rounded-sm px-2.5 text-xs"
                            >
                                <IconCalendarEvent className="size-4" /> Schedule
                            </Button>
                            <Button
                                type="button"
                                variant={viewMode === "classes" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setAndSaveViewMode("classes")}
                                className="h-7 rounded-sm px-2.5 text-xs"
                            >
                                <IconListDetails className="size-4" /> Classes
                            </Button>
                        </div>
                    </div>
                </section>

                {viewMode === "schedule" ? (
                    <StudentScheduleBoard events={visibleEvents} classes={effectiveClasses} filterDay={filterDay} conflicts={visibleConflicts} />
                ) : effectiveClasses.length > 0 ? (
                    <StudentClassList classes={effectiveClasses} />
                ) : null}

                {effectiveClasses.length === 0 && (
                    <section className="border-border bg-muted/20 text-muted-foreground flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                        <IconSchool className="mb-3 size-9" />
                        <h2 className="text-foreground text-base font-semibold">{hasActiveFilters ? "No matching classes" : "No active classes"}</h2>
                        <p className="mt-1 max-w-sm text-sm">
                            {hasActiveFilters ? "Clear the filters to see your full schedule." : "Your classes will appear here after enrollment."}
                        </p>
                        <div className="mt-4 flex gap-2">
                            {hasActiveFilters && <Button onClick={resetFilters}>Clear filters</Button>}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => router.reload()}
                                aria-label="Refresh schedule"
                                title="Refresh schedule"
                            >
                                <IconRefresh className="size-4" />
                            </Button>
                        </div>
                    </section>
                )}
            </main>
        </StudentLayout>
    );
}
