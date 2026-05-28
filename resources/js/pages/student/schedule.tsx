import StudentLayout from "@/components/student/student-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { User as UserType } from "@/types/user";
import { Head, Link, router } from "@inertiajs/react";
import { IconCalendarStats, IconClockHour4, IconSchool, IconStack2 } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { CalendarDays, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ClassCards } from "@/components/class-cards";
import { StudentScheduleBoard } from "@/components/class/student-schedule-board";
import { ClassData, DataTable } from "@/components/data-table";
import { ClassesStatus } from "@/pages/classes/components/classes-status";
import { ClassesToolbar } from "@/pages/classes/components/classes-toolbar";
import { useClassFilters } from "@/pages/classes/hooks/use-class-filters";
import { formatClassSchedule, useClassSchedule } from "@/pages/classes/hooks/use-class-schedule";

interface StudentScheduleProps {
    user: UserType;
    faculty_data: {
        classes: ClassData[];
        stats: any[];
    };
    rooms: { id: number; name: string }[];
}

const dashboardCardClass =
    "border-border/40 bg-card/60 rounded-xl shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-md";
const dashboardPanelClass = "border-border/40 bg-card/60 rounded-xl shadow-sm backdrop-blur-sm";

function ScheduleStatCard({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof IconSchool }) {
    return (
        <Card className="border-border/40 bg-card/60 relative overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-card">
            <CardContent className="p-2 sm:p-3">
                <div className="flex flex-col gap-0.5">
                    <p className="text-foreground/50 text-[7px] font-bold tracking-wider uppercase sm:text-[9px]">{label}</p>
                    <div className="flex items-center justify-between">
                        <p className="text-foreground text-base font-bold tracking-tight sm:text-2xl leading-none">
                            {value}
                        </p>
                        <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9">
                            <Icon className="h-3 w-3 sm:h-5 sm:w-5" strokeWidth={2} />
                        </div>
                    </div>
                    <p className="text-foreground/45 mt-0.5 truncate text-[7px] font-medium sm:text-[9px]">{detail}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function StudentSchedule({ user, faculty_data, rooms }: StudentScheduleProps) {
    const [viewMode, setViewMode] = useState<"board" | "gallery" | "list">("board");

    useEffect(() => {
        const savedMode = localStorage.getItem("dccp.student.schedule.viewMode");
        if (savedMode === "gallery" || savedMode === "list" || savedMode === "board") {
            setViewMode(savedMode as any);
        }
    }, []);

    function handleSetViewMode(mode: "board" | "gallery" | "list") {
        setViewMode(mode);
        localStorage.setItem("dccp.student.schedule.viewMode", mode);
    }

    // --- Logic Hooks for Classes ---
    const processedClasses = useMemo(() => {
        return (faculty_data?.classes ?? []).map((c) => {
            const calculated = formatClassSchedule(c.schedules ?? []);
            return {
                ...c,
                schedule: calculated || c.schedule || "TBA",
            };
        });
    }, [faculty_data?.classes]);

    const { events, unscheduled, conflictIds, nextUp } = useClassSchedule(processedClasses, rooms);

    const {
        search,
        setSearch,
        filterClassification,
        setFilterClassification,
        filterDay,
        setFilterDay,
        filterRoom,
        setFilterRoom,
        effectiveClasses,
        resetFilters,
    } = useClassFilters(processedClasses, events, conflictIds, unscheduled);

    const hasActiveFilters = search !== "" || filterClassification !== "all" || filterRoom !== "all" || filterDay !== "all";

    // Stats for the class view
    const stats = useMemo(() => {
        const scheduledCount = new Set(events.map((event) => String(event.classItem.id))).size;
        const unscheduledCount = unscheduled.length;
        const conflictCount = conflictIds.size;

        return {
            scheduledCount,
            unscheduledCount,
            conflictCount,
            nearCapacityCount: 0,
        };
    }, [events, unscheduled, conflictIds]);

    return (
        <StudentLayout
            user={{
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            }}
        >
            <Head title="Class Schedule" />

            {/* Mobile Header Background */}
            <div className="bg-primary/10 md:hidden relative h-[110px] w-full overflow-hidden px-4 pt-5">
                <div className="bg-primary/20 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
                <div className="bg-primary/10 absolute -bottom-12 -left-12 h-40 w-40 rounded-full blur-2xl" />
                <div className="relative">
                    <p className="text-foreground/60 text-[9px] font-bold tracking-wider uppercase">Weekly Plan</p>
                    <h1 className="text-foreground mt-0.5 text-xl font-bold tracking-tight">
                        Class <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">Schedule</span>
                    </h1>
                </div>
            </div>

            <div className={cn(
                "mx-auto flex w-full max-w-7xl flex-col gap-2.5 p-3.5 pb-20 md:gap-6 md:p-6",
                "relative z-20 -mt-10 md:mt-0"
            )}>
                {/* Header Section */}
                <Card className={cn(dashboardPanelClass, "relative overflow-hidden hidden md:block")}>
                    {/* Decorative Glass Elements */}
                    <div className="bg-primary/5 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
                    <div className="bg-primary/10 absolute -bottom-12 -left-12 h-48 w-48 rounded-full blur-2xl" />

                    <CardContent className="relative z-10 flex flex-col justify-between gap-3 p-3 sm:p-5 md:flex-row md:items-end md:gap-6 md:p-6">
                        <div className="space-y-1.5 sm:space-y-3">
                            <div className="text-primary flex items-center gap-2 font-bold">
                                <div className="bg-primary/10 rounded-md p-1 sm:rounded-lg sm:p-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </div>
                                <span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase sm:text-[11px]">Weekly Plan</span>
                            </div>
                            <div>
                                <h1 className="text-foreground text-xl leading-tight font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                                    Class <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">Schedule</span>
                                </h1>
                                <p className="text-muted-foreground mt-1 hidden max-w-xl items-center gap-2 text-xs leading-relaxed sm:flex sm:text-sm">
                                    <Clock className="h-3.5 w-3.5 shrink-0 opacity-70 sm:h-4 sm:w-4" />
                                    Manage your enrolled class schedule for the selected academic period.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:w-[32rem] md:gap-3">
                            <ScheduleStatCard label="Scheduled" value={stats.scheduledCount} detail="with time blocks" icon={IconCalendarStats} />
                            <ScheduleStatCard label="Unscheduled" value={stats.unscheduledCount} detail="awaiting schedule" icon={IconStack2} />
                            <div>
                                <ScheduleStatCard label="Conflicts" value={stats.conflictCount} detail="overlapping blocks" icon={IconClockHour4} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mobile Stats Row (Visible only on mobile) */}
                <div className="md:hidden grid grid-cols-3 gap-2">
                    <ScheduleStatCard label="Scheduled" value={stats.scheduledCount} detail="Classes" icon={IconCalendarStats} />
                    <ScheduleStatCard label="Awaiting" value={stats.unscheduledCount} detail="Schedule" icon={IconStack2} />
                    <ScheduleStatCard label="Conflicts" value={stats.conflictCount} detail="Overlap" icon={IconClockHour4} />
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {/* Status Section */}
                    {nextUp && (
                        <div className="mb-6">
                            <ClassesStatus nextUp={nextUp} stats={stats} baseUrl="/student/classes" />
                        </div>
                    )}

                    <Card className={`${dashboardPanelClass} overflow-hidden border-none bg-transparent shadow-none`}>
                        <CardContent className="p-0">
                            <ClassesToolbar
                                viewMode={viewMode}
                                setViewMode={handleSetViewMode}
                                search={search}
                                setSearch={setSearch}
                                filterClassification={filterClassification}
                                setFilterClassification={setFilterClassification}
                                filterRoom={filterRoom}
                                setFilterRoom={setFilterRoom}
                                filterDay={filterDay}
                                setFilterDay={setFilterDay}
                                rooms={rooms}
                                resetFilters={resetFilters}
                                hasActiveFilters={hasActiveFilters}
                            />
                        </CardContent>
                    </Card>

                    <div className="mt-6">
                        <Tabs value={viewMode} onValueChange={(v) => handleSetViewMode(v as any)} className="w-full">
                            <TabsContent value="board" className="mt-0 ring-offset-transparent focus-visible:ring-0">
                                <StudentScheduleBoard events={events} classes={effectiveClasses} filterDay={filterDay} />
                            </TabsContent>

                            <TabsContent value="gallery" className="mt-0 ring-offset-transparent focus-visible:ring-0">
                                <ClassCards data={effectiveClasses} onEdit={(item) => router.visit(`/student/classes/${item.id}`)} />
                            </TabsContent>

                            <TabsContent value="list" className="mt-0 ring-offset-transparent focus-visible:ring-0">
                                <DataTable data={effectiveClasses} onEdit={(item) => router.visit(`/student/classes/${item.id}`)} />
                            </TabsContent>
                        </Tabs>

                        {effectiveClasses.length === 0 && (
                            <Card className={`${dashboardPanelClass} mt-6 overflow-hidden border-dashed`}>
                                <CardContent className="relative flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
                                    <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none overflow-hidden">
                                        <IconSchool className="absolute -top-12 -right-12 size-64 rotate-12" />
                                        <IconSchool className="absolute -bottom-12 -left-12 size-64 -rotate-12" />
                                    </div>
                                    
                                    <div className="bg-primary/10 text-primary relative mb-6 rounded-2xl p-6 ring-8 ring-primary/5">
                                        <IconSchool className="h-12 w-12" />
                                    </div>
                                    
                                    <h3 className="text-foreground text-xl font-bold tracking-tight">No active classes found</h3>
                                    <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
                                        {hasActiveFilters 
                                            ? "We couldn't find any classes matching your current filters. Try adjusting them or clear all filters to see everything."
                                            : "You are not enrolled in any classes for this academic period yet."}
                                    </p>
                                    
                                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                        {hasActiveFilters ? (
                                            <Button onClick={resetFilters} className="rounded-xl px-6">
                                                Clear all filters
                                            </Button>
                                        ) : (
                                            <Button asChild className="rounded-xl px-6">
                                                <Link href="/student/enrollment">Browse Enrollment</Link>
                                            </Button>
                                        )}
                                        <Button variant="outline" onClick={() => router.reload()} className="rounded-xl px-6">
                                            Refresh Page
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </motion.div>
            </div>
        </StudentLayout>
    );
}
