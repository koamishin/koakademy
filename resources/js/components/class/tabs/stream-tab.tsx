import { AssignmentComposerDialog } from "@/components/class/assignment-composer-dialog";
import { ClassPostCard } from "@/components/class/class-post-card";
import { SubmissionViewerSheet } from "@/components/class/submission-viewer-sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { classPostTypeMeta } from "@/lib/classroom";
import { cn } from "@/lib/utils";
import { ClassPostAttachment, ClassPostEntry, StudentEntry } from "@/types/class-detail-types";
import { router, useForm } from "@inertiajs/react";
import { BookOpenCheck, ClipboardPen, FileQuestion, Link2, Megaphone, Paperclip, Plus, Send, Trash2, X } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface StreamTabProps {
    classData: {
        id: number;
        subject_code: string;
        section: string;
    };
    currentFaculty: {
        id: string | null;
        name: string;
        email?: string | null;
    };
    students: StudentEntry[];
    classPosts: ClassPostEntry[];
}

type QuickPostType = "announcement" | "activity" | "quiz";

interface QuickPostForm {
    title: string;
    content: string;
    type: QuickPostType;
    status: "backlog" | "in_progress" | "review" | "done" | "blocked";
    priority: "low" | "medium" | "high";
    start_date: string;
    due_date: string;
    total_points: number;
    attachments: ClassPostAttachment[];
    files: File[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function localDateInputValue(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function StreamTab({ classData, currentFaculty, students, classPosts }: StreamTabProps) {
    const isMobile = useIsMobile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [assignmentOpen, setAssignmentOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<ClassPostEntry | null>(null);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [deletePost, setDeletePost] = useState<ClassPostEntry | null>(null);
    const [submissionPost, setSubmissionPost] = useState<ClassPostEntry | null>(null);
    const [linkName, setLinkName] = useState("");
    const [linkUrl, setLinkUrl] = useState("");

    const form = useForm<QuickPostForm>({
        title: "",
        content: "",
        type: "announcement",
        status: "backlog",
        priority: "medium",
        start_date: localDateInputValue(),
        due_date: "",
        total_points: 100,
        attachments: [],
        files: [],
    });

    const resetComposer = () => {
        form.reset();
        form.clearErrors();
        setEditingPostId(null);
        setLinkName("");
        setLinkUrl("");
    };

    const openNewComposer = (type: QuickPostType = "announcement") => {
        resetComposer();
        form.setData("type", type);
        setComposerOpen(true);
    };

    const openAssignmentComposer = (post: ClassPostEntry | null = null) => {
        setComposerOpen(false);
        setEditingAssignment(post);
        window.requestAnimationFrame(() => setAssignmentOpen(true));
    };

    const openPostEditor = (post: ClassPostEntry) => {
        if (post.type === "assignment") {
            openAssignmentComposer(post);
            return;
        }

        setEditingPostId(post.id);
        form.setData({
            title: post.title,
            content: post.content || "",
            type: post.type as QuickPostType,
            status: (post.status as QuickPostForm["status"]) || "backlog",
            priority: (post.priority as QuickPostForm["priority"]) || "medium",
            start_date: post.start_date || localDateInputValue(),
            due_date: post.due_date || "",
            total_points: post.total_points ?? 100,
            attachments: post.attachments || [],
            files: [],
        });
        setComposerOpen(true);
    };

    const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
        const incoming = Array.from(event.target.files ?? []);
        const valid = incoming.filter((file) => file.size <= MAX_FILE_SIZE);
        if (valid.length !== incoming.length) toast.error("Each attachment must be 50MB or smaller.");
        form.setData("files", [...form.data.files, ...valid]);
        event.target.value = "";
    };

    const addLink = () => {
        try {
            const parsed = new URL(linkUrl);
            form.setData("attachments", [
                ...form.data.attachments,
                { name: linkName.trim() || parsed.hostname, url: parsed.toString(), kind: "link" },
            ]);
            setLinkName("");
            setLinkUrl("");
        } catch {
            toast.error("Enter a valid link URL.");
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSaving) return;
        if (!form.data.title.trim()) {
            toast.error("Add a title before sharing this post.");
            return;
        }
        if (form.data.type !== "announcement" && form.data.total_points <= 0) {
            toast.error("Activities and quizzes need a point value.");
            return;
        }

        const data = new FormData();
        data.append("title", form.data.title);
        data.append("content", form.data.content);
        data.append("type", form.data.type);
        data.append("status", form.data.status);
        data.append("priority", form.data.priority);
        data.append("start_date", form.data.start_date);
        data.append("progress_percent", form.data.status === "done" ? "100" : "0");
        data.append("assigned_faculty_id", currentFaculty.id ?? "");
        if (form.data.type !== "announcement") {
            data.append("due_date", form.data.due_date);
            data.append("total_points", String(form.data.total_points));
        }
        form.data.attachments.forEach((attachment, index) => {
            data.append(`attachments[${index}][name]`, attachment.name);
            data.append(`attachments[${index}][url]`, attachment.url);
            data.append(`attachments[${index}][kind]`, attachment.kind);
        });
        form.data.files.forEach((file, index) => data.append(`files[${index}]`, file));
        if (editingPostId !== null) data.append("_method", "PUT");

        router.post(
            editingPostId === null ? `/faculty/classes/${classData.id}/posts` : `/faculty/classes/${classData.id}/posts/${editingPostId}`,
            data,
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setIsSaving(true),
                onSuccess: () => {
                    toast.success(editingPostId === null ? "Post shared with the class." : "Post updated.");
                    setComposerOpen(false);
                    resetComposer();
                },
                onError: () => toast.error("The post could not be saved. Check the form and try again."),
                onFinish: () => setIsSaving(false),
            },
        );
    };

    const assignmentPost = useMemo(() => {
        if (!editingAssignment) return null;
        return {
            ...editingAssignment,
            instruction: editingAssignment.assignment?.instruction,
            audience_mode: editingAssignment.assignment?.audience_mode,
            assigned_student_ids: editingAssignment.assignment?.assigned_student_ids?.map(Number),
            rubric: editingAssignment.assignment?.rubric,
        };
    }, [editingAssignment]);

    return (
        <div className="space-y-3">
            <div className="border-border/70 bg-card flex items-center gap-3 rounded-lg border p-3 shadow-sm">
                <button
                    type="button"
                    className="hover:bg-muted/60 min-h-11 min-w-0 flex-1 rounded-md px-3 text-left text-sm"
                    onClick={() => openNewComposer()}
                >
                    <span className="text-muted-foreground">Share an announcement or activity...</span>
                </button>
                <Button type="button" size="icon" className="size-11 shrink-0" onClick={() => openNewComposer()}>
                    <Plus className="size-5" />
                    <span className="sr-only">Create class post</span>
                </Button>
            </div>

            {classPosts.length > 0 ? (
                classPosts.map((post) => (
                    <ClassPostCard
                        key={post.id}
                        post={post}
                        authorName={currentFaculty.name}
                        viewer="faculty"
                        onEdit={openPostEditor}
                        onDelete={setDeletePost}
                        onViewSubmissions={setSubmissionPost}
                    />
                ))
            ) : (
                <div className="border-border/70 bg-card flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                    <Megaphone className="text-muted-foreground size-8" />
                    <h2 className="mt-3 text-sm font-semibold">Start the class stream</h2>
                    <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                        Share an announcement, activity, quiz, or assignment with your students.
                    </p>
                </div>
            )}

            <Sheet
                open={composerOpen}
                onOpenChange={(open) => {
                    if (!open && isSaving) return;
                    setComposerOpen(open);
                    if (!open) resetComposer();
                }}
            >
                <SheetContent
                    side={isMobile ? "bottom" : "right"}
                    className={cn("w-full gap-0 p-0", isMobile ? "h-[100dvh] max-h-[100dvh] rounded-none" : "sm:max-w-xl")}
                >
                    <SheetHeader className="border-border border-b px-5 py-4 text-left">
                        <SheetTitle>{editingPostId === null ? "Create class post" : "Edit class post"}</SheetTitle>
                        <SheetDescription>Share an update or create work for {classData.subject_code}.</SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
                            {editingPostId === null && (
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { type: "announcement", label: "Announcement", icon: Megaphone },
                                        { type: "activity", label: "Activity", icon: BookOpenCheck },
                                        { type: "quiz", label: "Quiz", icon: FileQuestion },
                                    ].map((option) => (
                                        <Button
                                            key={option.type}
                                            type="button"
                                            variant={form.data.type === option.type ? "secondary" : "outline"}
                                            className="min-h-12 justify-start gap-2"
                                            onClick={() => form.setData("type", option.type as QuickPostType)}
                                        >
                                            <option.icon className="size-4" />
                                            {option.label}
                                        </Button>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-h-12 justify-start gap-2"
                                        onClick={() => openAssignmentComposer()}
                                    >
                                        <ClipboardPen className="size-4" />
                                        Assignment
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="quick-post-title">Title</Label>
                                <Input
                                    id="quick-post-title"
                                    value={form.data.title}
                                    onChange={(event) => form.setData("title", event.target.value)}
                                    placeholder={`${classPostTypeMeta[form.data.type]?.label ?? "Post"} title`}
                                    autoFocus={!isMobile}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="quick-post-content">Message or instructions</Label>
                                <Textarea
                                    id="quick-post-content"
                                    value={form.data.content}
                                    onChange={(event) => form.setData("content", event.target.value)}
                                    placeholder="Share context, instructions, or next steps..."
                                    rows={6}
                                    className="min-h-36 resize-y"
                                />
                            </div>

                            {form.data.type !== "announcement" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="quick-post-due">Due date</Label>
                                        <Input
                                            id="quick-post-due"
                                            type="date"
                                            value={form.data.due_date}
                                            onChange={(event) => form.setData("due_date", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quick-post-points">Points</Label>
                                        <Input
                                            id="quick-post-points"
                                            type="number"
                                            min={1}
                                            value={form.data.total_points}
                                            onChange={(event) => form.setData("total_points", Number(event.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Stage</Label>
                                        <Select
                                            value={form.data.status}
                                            onValueChange={(value) => form.setData("status", value as QuickPostForm["status"])}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="backlog">Planned</SelectItem>
                                                <SelectItem value="in_progress">In progress</SelectItem>
                                                <SelectItem value="review">Needs review</SelectItem>
                                                <SelectItem value="done">Completed</SelectItem>
                                                <SelectItem value="blocked">Needs help</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select
                                            value={form.data.priority}
                                            onValueChange={(value) => form.setData("priority", value as QuickPostForm["priority"])}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <Label>Attachments</Label>
                                {(form.data.attachments.length > 0 || form.data.files.length > 0) && (
                                    <div className="space-y-2">
                                        {form.data.attachments.map((attachment, index) => (
                                            <div
                                                key={`${attachment.url}-${index}`}
                                                className="border-border flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                            >
                                                <Link2 className="text-muted-foreground size-4 shrink-0" />
                                                <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-9"
                                                    onClick={() =>
                                                        form.setData(
                                                            "attachments",
                                                            form.data.attachments.filter((_, itemIndex) => itemIndex !== index),
                                                        )
                                                    }
                                                >
                                                    <X className="size-4" />
                                                    <span className="sr-only">Remove link</span>
                                                </Button>
                                            </div>
                                        ))}
                                        {form.data.files.map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                className="border-border flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                            >
                                                <Paperclip className="text-muted-foreground size-4 shrink-0" />
                                                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-9"
                                                    onClick={() =>
                                                        form.setData(
                                                            "files",
                                                            form.data.files.filter((_, itemIndex) => itemIndex !== index),
                                                        )
                                                    }
                                                >
                                                    <X className="size-4" />
                                                    <span className="sr-only">Remove file</span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                                    <Input value={linkName} onChange={(event) => setLinkName(event.target.value)} placeholder="Link name" />
                                    <Input
                                        value={linkUrl}
                                        onChange={(event) => setLinkUrl(event.target.value)}
                                        placeholder="https://..."
                                        type="url"
                                    />
                                    <Button type="button" variant="outline" onClick={addLink} disabled={!linkUrl.trim()}>
                                        <Link2 className="size-4" />
                                        Add
                                    </Button>
                                </div>
                                <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="size-4" />
                                    Attach files
                                </Button>
                                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
                            </div>
                        </div>

                        <SheetFooter className="border-border bg-background border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => setComposerOpen(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                <Send className="size-4" />
                                {isSaving ? "Saving..." : editingPostId === null ? "Share with class" : "Save changes"}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <AssignmentComposerDialog
                classId={classData.id}
                classCode={classData.subject_code}
                classSection={classData.section}
                currentFacultyId={currentFaculty.id}
                students={students}
                mode={editingAssignment ? "edit" : "create"}
                post={assignmentPost}
                open={assignmentOpen}
                onOpenChange={(open) => {
                    setAssignmentOpen(open);
                    if (!open) setEditingAssignment(null);
                }}
            />

            <SubmissionViewerSheet
                open={submissionPost !== null}
                onOpenChange={(open) => !open && setSubmissionPost(null)}
                classId={classData.id}
                post={submissionPost}
            />

            <AlertDialog open={deletePost !== null} onOpenChange={(open) => !open && setDeletePost(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this class post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deletePost?.title} and its class attachments will no longer be available to students.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (!deletePost) return;
                                router.delete(`/faculty/classes/${classData.id}/posts/${deletePost.id}`, {
                                    preserveScroll: true,
                                    onSuccess: () => toast.success("Post deleted."),
                                    onError: () => toast.error("The post could not be deleted."),
                                    onFinish: () => setDeletePost(null),
                                });
                            }}
                        >
                            <Trash2 className="size-4" />
                            Delete post
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
