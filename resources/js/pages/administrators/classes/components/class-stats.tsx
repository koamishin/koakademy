import { BookOpen, Layers, Users } from "lucide-react";

export function ClassStats({ totalClasses, totalStudents }: { totalClasses: number; totalStudents: number }) {
    const averageStudents = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;

    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-lg border-l-4 border-l-blue-500 p-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Classes</span>
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{totalClasses}</div>
            </div>
            <div className="bg-card rounded-lg border-l-4 border-l-emerald-500 p-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Students</span>
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{totalStudents.toLocaleString()}</div>
            </div>
            <div className="bg-card rounded-lg border-l-4 border-l-amber-500 p-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Avg Size</span>
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{averageStudents}</div>
            </div>
        </div>
    );
}


