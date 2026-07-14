import { ClassData } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DAYS, formatTime12Hour, getDayNameFromDate, ScheduleEvent } from "@/pages/classes/hooks/use-class-schedule";
import { StudentScheduleConflict } from "@/types/student-schedule";
import { Link } from "@inertiajs/react";
import { IconAlertTriangle, IconBroadcast, IconClock, IconMapPin, IconSchool, IconUser } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

interface StudentScheduleBoardProps {
    events: ScheduleEvent[];
    classes: ClassData[];
    filterDay: string;
    conflicts: StudentScheduleConflict[];
}

type PositionedEvent = {
    event: ScheduleEvent;
    lane: number;
    laneCount: number;
};

const START_HOUR = 7;
const END_HOUR = 18;
const HOUR_HEIGHT = 56;

function positionDayEvents(dayEvents: ScheduleEvent[]): PositionedEvent[] {
    const sorted = [...dayEvents].sort((left, right) => left.startMinutes - right.startMinutes || left.endMinutes - right.endMinutes);
    const positioned: PositionedEvent[] = [];
    let cluster: ScheduleEvent[] = [];
    let clusterEnd = -Infinity;

    const flushCluster = () => {
        if (cluster.length === 0) return;

        const laneEnds: number[] = [];
        const assigned = cluster.map((event) => {
            let lane = laneEnds.findIndex((end) => end <= event.startMinutes);
            if (lane === -1) {
                lane = laneEnds.length;
                laneEnds.push(event.endMinutes);
            } else {
                laneEnds[lane] = event.endMinutes;
            }

            return { event, lane };
        });

        const laneCount = Math.max(1, laneEnds.length);
        positioned.push(...assigned.map((item) => ({ ...item, laneCount })));
        cluster = [];
        clusterEnd = -Infinity;
    };

    for (const event of sorted) {
        if (cluster.length > 0 && event.startMinutes >= clusterEnd) {
            flushCluster();
        }

        cluster.push(event);
        clusterEnd = Math.max(clusterEnd, event.endMinutes);
    }

    flushCluster();
    return positioned;
}

function getEventState(event: ScheduleEvent, now: Date) {
    const currentDay = getDayNameFromDate(now);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return {
        isLive: event.day === currentDay && currentMinutes >= event.startMinutes && currentMinutes < event.endMinutes,
        isPast: DAYS.indexOf(event.day) < DAYS.indexOf(currentDay) || (event.day === currentDay && currentMinutes >= event.endMinutes),
    };
}

export function StudentScheduleBoard({ events, classes, filterDay, conflicts }: StudentScheduleBoardProps) {
    const today = useMemo(() => getDayNameFromDate(new Date()), []);
    const defaultDay = today === "Sunday" ? "Monday" : today;
    const [selectedDay, setSelectedDay] = useState<string>(filterDay !== "all" && filterDay !== "" ? filterDay : defaultDay);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (filterDay !== "all" && filterDay !== "") {
            setSelectedDay(filterDay);
        }
    }, [filterDay]);

    const displayDays = useMemo(() => (filterDay !== "all" && filterDay !== "" ? [filterDay] : DAYS), [filterDay]);
    const conflictScheduleIds = useMemo(
        () => new Set(conflicts.flatMap((conflict) => conflict.classes.map((classItem) => String(classItem.schedule_id)))),
        [conflicts],
    );
    const scheduledClassIds = useMemo(() => new Set(events.map((event) => String(event.classItem.id))), [events]);
    const unscheduledClasses = useMemo(
        () => classes.filter((classItem) => !scheduledClassIds.has(String(classItem.id))),
        [classes, scheduledClassIds],
    );
    const mobileEvents = useMemo(
        () => events.filter((event) => event.day === selectedDay).sort((left, right) => left.startMinutes - right.startMinutes),
        [events, selectedDay],
    );

    if (classes.length === 0) {
        return (
            <div className="border-border bg-muted/20 text-muted-foreground flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                <IconSchool className="mb-3 size-8" />
                <h3 className="text-foreground font-semibold">No enrolled classes</h3>
                <p className="mt-1 text-sm">Your active classes will appear here once enrollment is complete.</p>
            </div>
        );
    }

    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
    const totalHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const currentDay = getDayNameFromDate(currentTime);
    const currentTimeTop = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
    const showCurrentTime = currentMinutes >= START_HOUR * 60 && currentMinutes <= (END_HOUR + 1) * 60;

    return (
        <>
            <section className="space-y-3 md:hidden" aria-label="Daily class schedule">
                <div className="border-border bg-muted/30 grid grid-cols-6 rounded-lg border p-1" aria-label="Choose schedule day">
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            type="button"
                            onClick={() => setSelectedDay(day)}
                            className={cn(
                                "relative flex h-11 min-w-0 flex-col items-center justify-center rounded-md text-xs font-medium",
                                selectedDay === day ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                            )}
                            aria-pressed={selectedDay === day}
                        >
                            <span>{day.slice(0, 3)}</span>
                            {day === today && <span className="bg-primary mt-1 size-1 rounded-full" aria-label="Today" />}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between px-1">
                    <div>
                        <p className="text-foreground text-sm font-semibold">{selectedDay}</p>
                        <p className="text-muted-foreground text-xs">
                            {mobileEvents.length} class{mobileEvents.length === 1 ? "" : "es"}
                        </p>
                    </div>
                    {selectedDay === today && <Badge variant="secondary">Today</Badge>}
                </div>

                {mobileEvents.length > 0 ? (
                    <div className="border-border divide-border bg-background divide-y overflow-hidden rounded-lg border">
                        {mobileEvents.map((event) => {
                            const { isLive, isPast } = getEventState(event, currentTime);
                            const hasConflict = conflictScheduleIds.has(event.scheduleId);

                            return (
                                <Link
                                    key={event.scheduleId}
                                    href={`/student/classes/${event.classItem.id}`}
                                    className={cn(
                                        "hover:bg-muted/30 grid min-h-28 grid-cols-[5.25rem_minmax(0,1fr)] gap-3 px-3 py-4 transition-colors",
                                        isPast && !isLive && "opacity-65",
                                        hasConflict && "bg-destructive/5",
                                    )}
                                >
                                    <div className="border-border border-r pr-3 text-right">
                                        <p className="text-foreground text-sm font-semibold">{formatTime12Hour(event.startMinutes)}</p>
                                        <p className="text-muted-foreground mt-1 text-xs">{formatTime12Hour(event.endMinutes)}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {isLive && (
                                                <Badge className="gap-1 bg-emerald-600 text-white">
                                                    <IconBroadcast className="size-3" /> Live
                                                </Badge>
                                            )}
                                            {hasConflict && (
                                                <Badge variant="destructive" className="gap-1">
                                                    <IconAlertTriangle className="size-3" /> Conflict
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="text-foreground mt-1 line-clamp-2 text-sm leading-snug font-semibold">
                                            {event.classItem.subject_title}
                                        </h3>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {event.classItem.subject_code} · Section {event.classItem.section}
                                        </p>
                                        <div className="text-muted-foreground mt-3 grid gap-1 text-xs">
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <IconMapPin className="size-3.5 shrink-0" /> <span className="truncate">{event.roomLabel}</span>
                                            </span>
                                            <span className="flex min-w-0 items-center gap-1.5">
                                                <IconUser className="size-3.5 shrink-0" />{" "}
                                                <span className="truncate">{event.classItem.faculty_name || "Faculty TBA"}</span>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="border-border bg-muted/20 text-muted-foreground flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                        <IconClock className="mb-2 size-6" />
                        <p className="text-foreground text-sm font-medium">No classes on {selectedDay}</p>
                        <p className="mt-1 text-xs">Choose another day to review the rest of your week.</p>
                    </div>
                )}

                {unscheduledClasses.length > 0 && (
                    <div className="border-border rounded-lg border border-dashed p-3">
                        <p className="text-foreground text-sm font-medium">Awaiting schedule</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {unscheduledClasses.map((classItem) => (
                                <Badge key={classItem.id} variant="outline">
                                    {classItem.subject_code}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            <section
                className="border-border bg-background hidden max-w-full min-w-0 overflow-hidden rounded-lg border md:block"
                aria-label="Weekly class timetable"
            >
                <div className="max-h-[760px] overflow-auto">
                    <div className="min-w-[960px]">
                        <div className="border-border bg-muted/40 sticky top-0 z-30 flex border-b">
                            <div className="border-border bg-background sticky left-0 z-40 flex w-16 shrink-0 items-center justify-center border-r">
                                <IconClock className="text-muted-foreground size-4" />
                            </div>
                            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${displayDays.length}, minmax(140px, 1fr))` }}>
                                {displayDays.map((day) => (
                                    <div
                                        key={day}
                                        className={cn(
                                            "border-border border-r px-2 py-3 text-center last:border-r-0",
                                            day === today && "bg-primary/5",
                                        )}
                                    >
                                        <span className={cn("text-xs font-semibold", day === today ? "text-primary" : "text-foreground")}>{day}</span>
                                        {day === today && <span className="text-primary ml-1.5 text-[10px] font-medium">Today</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative flex" style={{ height: `${totalHeight}px` }}>
                            <div className="border-border bg-background sticky left-0 z-20 w-16 shrink-0 border-r">
                                {hours.map((hour) => (
                                    <span
                                        key={hour}
                                        className="text-muted-foreground absolute w-full -translate-y-1/2 text-center text-[10px]"
                                        style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                                    >
                                        {formatTime12Hour(hour * 60).replace(":00", "")}
                                    </span>
                                ))}
                            </div>

                            <div
                                className="relative grid flex-1"
                                style={{ gridTemplateColumns: `repeat(${displayDays.length}, minmax(140px, 1fr))` }}
                            >
                                <div className="pointer-events-none absolute inset-0">
                                    {hours.map((hour) => (
                                        <div
                                            key={hour}
                                            className="border-border/60 absolute w-full border-t"
                                            style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                                        />
                                    ))}
                                </div>

                                {showCurrentTime && displayDays.includes(currentDay) && (
                                    <div
                                        className="pointer-events-none absolute right-0 left-0 z-20 border-t-2 border-red-500"
                                        style={{ top: `${currentTimeTop}px` }}
                                    >
                                        <span className="absolute -top-1.5 -left-1 size-3 rounded-full bg-red-500" />
                                    </div>
                                )}

                                {displayDays.map((day) => (
                                    <div
                                        key={day}
                                        className={cn("border-border/60 relative border-r last:border-r-0", day === today && "bg-primary/[0.025]")}
                                    >
                                        {positionDayEvents(events.filter((event) => event.day === day)).map(({ event, lane, laneCount }) => {
                                            const { isLive, isPast } = getEventState(event, currentTime);
                                            const hasConflict = conflictScheduleIds.has(event.scheduleId);
                                            const top = ((event.startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                                            const height = Math.max(28, ((event.endMinutes - event.startMinutes) / 60) * HOUR_HEIGHT);

                                            return (
                                                <Link
                                                    key={event.scheduleId}
                                                    href={`/student/classes/${event.classItem.id}`}
                                                    className={cn(
                                                        "border-border bg-card absolute overflow-hidden rounded-md border p-2 transition-shadow hover:z-20 hover:shadow-md",
                                                        isLive && "border-emerald-600 ring-2 ring-emerald-600/20",
                                                        hasConflict && "border-destructive bg-destructive/5",
                                                        isPast && !isLive && "opacity-60",
                                                    )}
                                                    style={{
                                                        top,
                                                        height,
                                                        left: `calc(${(lane / laneCount) * 100}% + 3px)`,
                                                        width: `calc(${100 / laneCount}% - 6px)`,
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-1">
                                                        <p className="text-foreground line-clamp-2 text-[11px] leading-tight font-semibold">
                                                            {event.classItem.subject_title}
                                                        </p>
                                                        {hasConflict && (
                                                            <IconAlertTriangle
                                                                className="text-destructive size-3.5 shrink-0"
                                                                aria-label="Schedule conflict"
                                                            />
                                                        )}
                                                    </div>
                                                    {height >= 48 && (
                                                        <p className="text-muted-foreground mt-1 truncate text-[10px]">
                                                            {event.classItem.subject_code} · {event.classItem.section}
                                                        </p>
                                                    )}
                                                    {height >= 70 && (
                                                        <div className="text-muted-foreground mt-2 space-y-1 text-[10px]">
                                                            <p className="flex items-center gap-1">
                                                                <IconClock className="size-3" /> {formatTime12Hour(event.startMinutes)}-
                                                                {formatTime12Hour(event.endMinutes)}
                                                            </p>
                                                            <p className="flex items-center gap-1 truncate">
                                                                <IconMapPin className="size-3 shrink-0" /> {event.roomLabel}
                                                            </p>
                                                        </div>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
