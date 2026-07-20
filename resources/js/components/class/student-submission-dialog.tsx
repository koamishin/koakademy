import { FilePreview } from "@/components/class/file-preview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatClassDate, isClassPostOverdue } from "@/lib/classroom";
import { ClassPostEntry } from "@/types/class-detail-types";
import { router, useForm } from "@inertiajs/react";
import { IconCalendar, IconFileUpload, IconPaperclip, IconStar } from "@tabler/icons-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

interface StudentSubmissionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classId: number;
    post: ClassPostEntry | null;
}

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export function StudentSubmissionDialog({ open, onOpenChange, classId, post }: StudentSubmissionDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        content: "",
    });

    const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) {
            return;
        }

        const incomingFiles = Array.from(event.target.files);
        const oversizedFiles = incomingFiles.filter((file) => file.size > MAX_FILE_SIZE);
        const validFiles = incomingFiles.filter((file) => file.size <= MAX_FILE_SIZE);

        if (oversizedFiles.length > 0) {
            const names = oversizedFiles.map((file) => file.name).join(", ");
            toast.error(`These files exceed ${MAX_FILE_SIZE_MB}MB: ${names}`);
        }

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles]);
        }

        event.target.value = "";
    };

    const handleRemoveFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;

        if (!post) {
            return;
        }

        const totalUploadSize = files.reduce((size, file) => size + file.size, 0);
        if (totalUploadSize > MAX_FILE_SIZE) {
            toast.error(`Total attachment size must be ${MAX_FILE_SIZE_MB}MB or less.`);
            return;
        }

        const formData = new FormData();
        formData.append("content", form.data.content);

        files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });

        router.post(`/student/classes/${classId}/posts/${post.id}/submit`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setIsSubmitting(true),
            onSuccess: () => {
                toast.success("Assignment submitted successfully.");
                form.reset();
                setFiles([]);
                onOpenChange(false);
            },
            onError: (errors) => {
                if (errors.error) {
                    toast.error(errors.error);
                } else {
                    toast.error("Failed to submit assignment. Please try again.");
                }
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && isSubmitting) return;
        if (!nextOpen) {
            form.reset();
            setFiles([]);
        }
        onOpenChange(nextOpen);
    };

    const isOverdue = post ? isClassPostOverdue(post) : false;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:rounded-lg sm:border">
                <DialogHeader className="border-border border-b px-4 py-5 text-left sm:px-6">
                    <DialogTitle className="text-lg font-semibold">Submit Assignment</DialogTitle>
                    <DialogDescription className="text-muted-foreground">{post?.title}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                        <div className="bg-muted/50 rounded-lg border p-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                {post?.total_points && (
                                    <div className="flex items-center gap-1">
                                        <IconStar className="text-primary size-3.5" />
                                        <span className="font-medium">{post.total_points} points</span>
                                    </div>
                                )}
                                {post?.due_date && (
                                    <div className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                                        <IconCalendar className="size-3.5" />
                                        <span>
                                            Due {formatClassDate(post.due_date)}
                                            {isOverdue && " (Overdue)"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Response</label>
                            <Textarea
                                value={form.data.content}
                                onChange={(e) => form.setData("content", e.target.value)}
                                placeholder="Write your answer or comments here..."
                                rows={4}
                                className="resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Attachments</label>

                            {files.length > 0 && (
                                <div className="space-y-2">
                                    {files.map((file, index) => (
                                        <FilePreview
                                            key={`submit-${file.name}-${index}`}
                                            name={file.name}
                                            size={file.size}
                                            kind="file"
                                            file={file}
                                            onRemove={() => handleRemoveFile(index)}
                                        />
                                    ))}
                                </div>
                            )}

                            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                <IconPaperclip className="mr-2 size-4" />
                                {files.length > 0 ? "Add more files" : "Attach files"}
                            </Button>
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />
                        </div>
                    </div>

                    <Separator />
                    <DialogFooter className="bg-background px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-6">
                        <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            <IconFileUpload className="mr-2 size-4" />
                            {isSubmitting ? "Submitting..." : "Submit Assignment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
