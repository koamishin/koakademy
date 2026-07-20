import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ClassSettings, ScheduleEntry, TeacherEntry } from "@/types/class-detail-types";
import { CalendarDays, Clock3, EllipsisVertical, History, Settings, Users } from "lucide-react";

interface EnhancedClassHeaderProps {
    classData: {
        id: number;
        subject_code: string;
        course_title?: string;
        subject_title?: string;
        section: string;
        classification: string;
        settings: ClassSettings;
    };
    teacher: TeacherEntry;
    schedule: ScheduleEntry[];
    enrollmentStats: {
        current_count: number;
        max_slots: number;
        waitlist_count?: number;
    };
    onSettingsClick?: () => void;
    onActivityLogClick?: () => void;
    isStudent?: boolean;
}

export function EnhancedClassHeader({
    classData,
    teacher,
    schedule,
    enrollmentStats,
    onSettingsClick,
    onActivityLogClick,
    isStudent = false,
}: EnhancedClassHeaderProps) {
    const settings = classData.settings;
    const classificationLabel = classData.classification === "shs" ? "Senior High" : "College";
    const nextSchedule = schedule[0];
    const headerBackground = settings.background_color || "bg-zinc-900";

    return (
        <section className="border-border/70 bg-card overflow-hidden rounded-lg border shadow-sm">
            <div className={cn("relative min-h-44 overflow-hidden md:min-h-56", headerBackground)}>
                {settings.banner_image && (
                    <img src={settings.banner_image} alt="" className="absolute inset-0 size-full object-cover" aria-hidden="true" />
                )}
                <div className="absolute inset-0 bg-black/55" />

                <div className="relative flex min-h-44 flex-col justify-between p-4 text-white md:min-h-56 md:p-7">
                    <div className="flex items-start justify-between gap-3">
                        <Badge className="border-white/25 bg-black/30 text-white backdrop-blur-sm">{classificationLabel}</Badge>
                        {!isStudent && (onSettingsClick || onActivityLogClick) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="bg-black/30 text-white hover:bg-black/50 hover:text-white"
                                    >
                                        <EllipsisVertical className="size-5" />
                                        <span className="sr-only">Class actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {onActivityLogClick && (
                                        <DropdownMenuItem onClick={onActivityLogClick}>
                                            <History className="size-4" />
                                            Activity log
                                        </DropdownMenuItem>
                                    )}
                                    {onSettingsClick && (
                                        <DropdownMenuItem onClick={onSettingsClick}>
                                            <Settings className="size-4" />
                                            Class settings
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <div className="max-w-3xl min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-white/80">
                            <span className="rounded bg-black/35 px-2 py-1 font-mono">{classData.subject_code}</span>
                            <span>Section {classData.section}</span>
                        </div>
                        <h1 className="line-clamp-2 text-xl leading-tight font-semibold sm:text-2xl md:text-3xl">
                            {classData.subject_title || classData.course_title || "Class"}
                        </h1>
                        <div className="mt-3 flex items-center gap-2">
                            <Avatar className="size-8 border border-white/30">
                                <AvatarImage src={teacher.photo_url || undefined} alt={teacher.name} />
                                <AvatarFallback className="bg-white/15 text-xs text-white">{teacher.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{teacher.name}</p>
                                <p className="text-xs text-white/70">Instructor</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" className="h-auto min-h-14 justify-start gap-3 rounded-none px-4 py-3 text-left">
                            <Clock3 className="text-primary size-5 shrink-0" />
                            <span className="min-w-0 flex-1">
                                <span className="text-muted-foreground block text-xs">Next schedule</span>
                                <span className="block truncate text-sm font-medium">
                                    {nextSchedule ? `${nextSchedule.day}, ${nextSchedule.start} - ${nextSchedule.end}` : "No schedule set"}
                                </span>
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[calc(100vw-2rem)] max-w-sm p-0">
                        <div className="border-border flex items-center gap-2 border-b px-4 py-3 font-medium">
                            <CalendarDays className="text-primary size-4" />
                            Class schedule
                        </div>
                        <div className="max-h-72 divide-y overflow-y-auto">
                            {schedule.length > 0 ? (
                                schedule.map((entry) => (
                                    <div key={entry.id} className="px-4 py-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-medium">{entry.day}</span>
                                            <span className="text-muted-foreground text-xs">{entry.room || "TBA"}</span>
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {entry.start} - {entry.end}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground p-4 text-sm">No schedule configured.</p>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex min-h-14 items-center gap-3 px-4 py-3">
                    <Users className="text-primary size-5 shrink-0" />
                    <div>
                        <p className="text-muted-foreground text-xs">Class members</p>
                        <p className="text-sm font-medium">
                            {enrollmentStats.current_count} {enrollmentStats.current_count === 1 ? "student" : "students"}
                            {enrollmentStats.max_slots > 0 ? ` of ${enrollmentStats.max_slots}` : ""}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
