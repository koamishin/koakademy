import { AssignmentComposerDialog } from "@/components/class/assignment-composer-dialog";
import { StudentSubmissionDialog } from "@/components/class/student-submission-dialog";
import { SubmissionViewerSheet } from "@/components/class/submission-viewer-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { classPostStatusLabels, classPostTypeMeta, formatClassDate, isClassPostOverdue, parseClassDate } from "@/lib/classroom";
import { cn } from "@/lib/utils";
import { ClassPostEntry, StudentEntry } from "@/types/class-detail-types";
import { BookOpenCheck, CalendarClock, ChevronRight, ClipboardCheck, FileQuestion, Paperclip, Pencil, Send, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

interface ClassworkTabProps {
    classId?: number;
    classCode?: string;
    classSection?: string;
    currentFacultyId?: string | null;
    classPosts: ClassPostEntry[];
    students?: StudentEntry[];
    isStudentView?: boolean;
}

const typeIcons = { assignment: ClipboardCheck, activity: BookOpenCheck, quiz: FileQuestion };

export function ClassworkTab({
    classId = 0,
    classCode = "",
    classSection = "",
    currentFacultyId = null,
    classPosts,
    students = [],
    isStudentView = false,
}: ClassworkTabProps) {
    const [filter, setFilter] = useState("all");
    const [submissionPost, setSubmissionPost] = useState<ClassPostEntry | null>(null);
    const [viewingSubmissions, setViewingSubmissions] = useState<ClassPostEntry | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<ClassPostEntry | null>(null);

    const classwork = useMemo(() => {
        return classPosts
            .filter((post) => ["assignment", "activity", "quiz"].includes(post.type))
            .filter((post) => filter === "all" || post.type === filter)
            .sort((left, right) => {
                const leftDue = parseClassDate(left.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                const rightDue = parseClassDate(right.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                return leftDue - rightDue;
            });
    }, [classPosts, filter]);

    const assignmentPost = editingAssignment
        ? {
              ...editingAssignment,
              instruction: editingAssignment.assignment?.instruction,
              audience_mode: editingAssignment.assignment?.audience_mode,
              assigned_student_ids: editingAssignment.assignment?.assigned_student_ids?.map(Number),
              rubric: editingAssignment.assignment?.rubric,
          }
        : null;

    return (
        <div className="space-y-4">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {["all", "assignment", "activity", "quiz"].map((type) => (
                    <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={filter === type ? "secondary" : "outline"}
                        className="shrink-0"
                        onClick={() => setFilter(type)}
                    >
                        {type === "all" ? "All work" : (classPostTypeMeta[type]?.label ?? type)}
                    </Button>
                ))}
            </div>

            {classwork.length > 0 ? (
                <div className="space-y-3">
                    {classwork.map((post) => {
                        const Icon = typeIcons[post.type as keyof typeof typeIcons] ?? BookOpenCheck;
                        const overdue = isClassPostOverdue(post);
                        const submitted = Boolean(post.my_submission);

                        return (
                            <Card key={post.id} className="border-border/70 overflow-hidden rounded-lg shadow-sm">
                                <article className="p-4 sm:p-5">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                "flex size-10 shrink-0 items-center justify-center rounded-md",
                                                classPostTypeMeta[post.type]?.tone,
                                            )}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {classPostTypeMeta[post.type]?.label ?? post.type}
                                                        </Badge>
                                                        {post.status && (
                                                            <Badge variant="outline" className="text-[10px] font-normal">
                                                                {classPostStatusLabels[post.status] ?? post.status}
                                                            </Badge>
                                                        )}
                                                        {submitted && (
                                                            <Badge className="bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300">
                                                                Submitted
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h2 className="mt-2 text-base leading-snug font-semibold">{post.title}</h2>
                                                    {(post.assignment?.instruction || post.content) && (
                                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm leading-5">
                                                            {post.assignment?.instruction || post.content}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0 sm:hidden" />
                                            </div>

                                            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                                                {post.due_date && (
                                                    <span className={cn("flex items-center gap-1", overdue && "text-destructive")}>
                                                        <CalendarClock className="size-3.5" />
                                                        {overdue ? "Overdue" : "Due"} {formatClassDate(post.due_date)}
                                                    </span>
                                                )}
                                                {post.total_points !== null && post.total_points !== undefined && (
                                                    <span>{post.total_points} points</span>
                                                )}
                                                {post.attachments.length > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Paperclip className="size-3.5" />
                                                        {post.attachments.length}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-border/70 mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
                                        {isStudentView ? (
                                            post.type === "assignment" &&
                                            (post.my_submission ? (
                                                <p className="text-muted-foreground mr-auto text-sm">
                                                    {post.my_submission.status === "graded"
                                                        ? `Graded: ${post.my_submission.points ?? 0}/${post.total_points ?? 0}`
                                                        : `Submitted ${formatClassDate(post.my_submission.submitted_at)}`}
                                                </p>
                                            ) : (
                                                <Button type="button" className="min-h-10 sm:w-auto" onClick={() => setSubmissionPost(post)}>
                                                    <Send className="size-4" />
                                                    Submit assignment
                                                </Button>
                                            ))
                                        ) : post.type === "assignment" ? (
                                            <>
                                                <Button type="button" variant="outline" onClick={() => setViewingSubmissions(post)}>
                                                    <UsersRound className="size-4" />
                                                    Submissions
                                                    {post.submission_count !== undefined && (
                                                        <Badge variant="secondary" className="ml-1 text-[10px]">
                                                            {post.submission_count}
                                                        </Badge>
                                                    )}
                                                </Button>
                                                <Button type="button" variant="ghost" onClick={() => setEditingAssignment(post)}>
                                                    <Pencil className="size-4" />
                                                    Edit
                                                </Button>
                                            </>
                                        ) : null}
                                    </div>
                                </article>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="border-border/70 bg-card flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                    <BookOpenCheck className="text-muted-foreground size-8" />
                    <h2 className="mt-3 text-sm font-semibold">No classwork here</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Try another filter or check back when new work is posted.</p>
                </div>
            )}

            <StudentSubmissionDialog
                open={submissionPost !== null}
                onOpenChange={(open) => !open && setSubmissionPost(null)}
                classId={classId}
                post={submissionPost}
            />
            {!isStudentView && (
                <>
                    <SubmissionViewerSheet
                        open={viewingSubmissions !== null}
                        onOpenChange={(open) => !open && setViewingSubmissions(null)}
                        classId={classId}
                        post={viewingSubmissions}
                    />
                    <AssignmentComposerDialog
                        classId={classId}
                        classCode={classCode}
                        classSection={classSection}
                        currentFacultyId={currentFacultyId}
                        students={students}
                        mode="edit"
                        post={assignmentPost}
                        open={editingAssignment !== null}
                        onOpenChange={(open) => !open && setEditingAssignment(null)}
                    />
                </>
            )}
        </div>
    );
}
