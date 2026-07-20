import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classPostTypeMeta, formatClassDate, parseClassDate } from "@/lib/classroom";
import { ClassPostEntry } from "@/types/class-detail-types";
import { ArrowRight, CalendarClock } from "lucide-react";
import { useMemo } from "react";

interface ClassroomUpcomingProps {
    posts: ClassPostEntry[];
    onViewClasswork: () => void;
    studentView?: boolean;
}

export function ClassroomUpcoming({ posts, onViewClasswork, studentView = false }: ClassroomUpcomingProps) {
    const upcoming = useMemo(() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        return posts
            .filter((post) => post.type !== "announcement" && post.due_date && (!studentView || !post.my_submission))
            .map((post) => ({ post, due: parseClassDate(post.due_date) }))
            .filter((item): item is { post: ClassPostEntry; due: Date } => Boolean(item.due && item.due.getTime() >= startOfToday.getTime()))
            .sort((left, right) => left.due.getTime() - right.due.getTime())
            .slice(0, 3);
    }, [posts, studentView]);

    return (
        <aside className="border-border/70 bg-card overflow-hidden rounded-lg border">
            <div className="border-border/70 flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <CalendarClock className="text-primary size-4" />
                    <h2 className="text-sm font-semibold">Upcoming</h2>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={onViewClasswork}>
                    View all
                    <ArrowRight className="size-3.5" />
                </Button>
            </div>
            {upcoming.length > 0 ? (
                <div className="divide-border/70 divide-y">
                    {upcoming.map(({ post }) => (
                        <button key={post.id} type="button" className="hover:bg-muted/40 w-full px-4 py-3 text-left" onClick={onViewClasswork}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{post.title}</p>
                                    <p className="text-muted-foreground mt-0.5 text-xs">Due {formatClassDate(post.due_date)}</p>
                                </div>
                                <Badge variant="secondary" className="shrink-0 text-[10px]">
                                    {classPostTypeMeta[post.type]?.label ?? post.type}
                                </Badge>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground px-4 py-5 text-sm">Nothing due soon.</p>
            )}
        </aside>
    );
}
