import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TeacherEntry } from "@/types/class-detail-types";
import { GraduationCap, UsersRound } from "lucide-react";

interface StudentPeopleTabProps {
    teacher: TeacherEntry;
    classmates: Array<{ id: number; name: string; avatar: string }>;
}

export function StudentPeopleTab({ teacher, classmates }: StudentPeopleTabProps) {
    return (
        <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="border-border/70 rounded-lg p-4 shadow-sm">
                <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase">
                    <GraduationCap className="size-4" />
                    Instructor
                </div>
                <div className="mt-4 flex items-center gap-3">
                    <Avatar className="size-12">
                        <AvatarImage src={teacher.photo_url || undefined} alt={teacher.name} />
                        <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="truncate font-semibold">{teacher.name}</p>
                        {teacher.email && <p className="text-muted-foreground truncate text-xs">{teacher.email}</p>}
                    </div>
                </div>
            </Card>

            <Card className="border-border/70 overflow-hidden rounded-lg shadow-sm">
                <div className="border-border/70 flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <UsersRound className="text-primary size-4" />
                        <h2 className="text-sm font-semibold">Classmates</h2>
                    </div>
                    <Badge variant="secondary">{classmates.length}</Badge>
                </div>
                {classmates.length > 0 ? (
                    <div className="divide-border/70 grid divide-y sm:grid-cols-2 sm:divide-y-0">
                        {classmates.map((classmate) => (
                            <div key={classmate.id} className="flex min-w-0 items-center gap-3 px-4 py-3 sm:border-b">
                                <Avatar className="size-10 shrink-0">
                                    <AvatarImage src={classmate.avatar || undefined} alt={classmate.name} />
                                    <AvatarFallback>{classmate.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="truncate text-sm font-medium">{classmate.name}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground px-4 py-10 text-center text-sm">No classmates are listed yet.</p>
                )}
            </Card>
        </div>
    );
}
