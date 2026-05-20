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
        <Card className={`${dashboardCardClass} group relative min-h-[100px] overflow-hidden hover:-translate-y-1 sm:min-h-[120px]`}>
            <div className="absolute top-0 left-0 h-full w-1 bg-primary/20 transition-colors group-hover:bg-primary" />
            <Icon className="text-primary pointer-events-none absolute top-3 right-3 size-10 opacity-[0.08] transition-all duration-300 group-hover:scale-110 group-hover:opacity-15 sm:top-4 sm:right-5 sm:size-12" />
            <CardContent className="relative p-3 pr-10 sm:p-4 sm:pr-16">
                <p className="text-muted-foreground text-[9px] font-bold tracking-wider uppercase sm:text-[10px]">{label}</p>
                <div className="mt-1 flex items-baseline gap-1 sm:mt-2">
                    <p className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
                </div>
                <p className="text-muted-foreground/80 mt-0.5 line-clamp-1 text-[10px] font-medium leading-tight sm:mt-1 sm:text-[11px]">{detail}</p>
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

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 pb-16 md:gap-6 md:p-6">
                {/* Header Section */}
                <Card className={cn(dashboardPanelClass, "relative overflow-hidden")}>
                    {/* Decorative Glass Elements */}
                    <div className="bg-primary/5 absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl" />
                    <div className="bg-primary/10 absolute -bottom-12 -left-12 h-48 w-48 rounded-full blur-2xl" />

                    <CardContent className="relative z-10 flex flex-col justify-between gap-6 p-4 sm:p-5 md:flex-row md:items-end md:p-6">
                        <div className="space-y-2.5 sm:space-y-3">
                            <div className="text-primary flex items-center gap-2 font-bold">
                                <div className="bg-primary/10 rounded-lg p-1 sm:p-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </div>
                                <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase sm:text-[11px]">Weekly Plan</span>
                            </div>
                            <div>
                                <h1 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
                                    Class <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">Schedule</span>
                                </h1>
                                <p className="text-muted-foreground mt-1.5 flex max-w-xl items-center gap-2 text-xs leading-relaxed sm:text-sm">
                                    <Clock className="h-3.5 w-3.5 shrink-0 opacity-70 sm:h-4 sm:w-4" />
                                    Manage your enrolled class schedule for the selected academic period.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:w-[32rem]">
                            <ScheduleStatCard label="Scheduled" value={stats.scheduledCount} detail="with time blocks" icon={IconCalendarStats} />
                            <ScheduleStatCard label="Unscheduled" value={stats.unscheduledCount} detail="awaiting schedule" icon={IconStack2} />
                            <div className="col-span-2 sm:col-span-1">
                                <ScheduleStatCard label="Conflicts" value={stats.conflictCount} detail="overlapping blocks" icon={IconClockHour4} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
