import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { classPostStatusLabels, classPostTypeMeta, formatClassDate, isClassPostOverdue } from "@/lib/classroom";
import { cn } from "@/lib/utils";
import { ClassPostAttachment, ClassPostEntry } from "@/types/class-detail-types";
import { Download, EllipsisVertical, ExternalLink, FileText, Pencil, Send, Trash2, UsersRound } from "lucide-react";

interface ClassPostCardProps {
    post: ClassPostEntry;
    authorName: string;
    authorAvatar?: string | null;
    viewer: "faculty" | "student";
    onEdit?: (post: ClassPostEntry) => void;
    onDelete?: (post: ClassPostEntry) => void;
    onViewSubmissions?: (post: ClassPostEntry) => void;
    onSubmit?: (post: ClassPostEntry) => void;
}

const isImageAttachment = (attachment: ClassPostAttachment) => attachment.kind === "file" && /\.(jpe?g|png|gif|webp)$/i.test(attachment.name);
const isVideoAttachment = (attachment: ClassPostAttachment) => attachment.kind === "file" && /\.(mp4|webm|ogg)$/i.test(attachment.name);

function youtubeEmbedUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        const id = parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
    } catch {
        return null;
    }
}

export function ClassPostCard({ post, authorName, authorAvatar, viewer, onEdit, onDelete, onViewSubmissions, onSubmit }: ClassPostCardProps) {
    const typeMeta = classPostTypeMeta[post.type] ?? { label: post.type, tone: "bg-muted text-muted-foreground" };
    const overdue = isClassPostOverdue(post);
    const mediaAttachments = post.attachments.filter(
        (attachment) => isImageAttachment(attachment) || isVideoAttachment(attachment) || Boolean(youtubeEmbedUrl(attachment.url)),
    );
    const fileAttachments = post.attachments.filter((attachment) => !mediaAttachments.includes(attachment));
    const isFaculty = viewer === "faculty";

    return (
        <Card className="border-border/70 overflow-hidden rounded-lg shadow-sm">
            <article className="p-4 sm:p-5">
                <header className="flex items-start gap-3">
                    <Avatar className="size-10 shrink-0">
                        <AvatarImage src={authorAvatar || undefined} alt={authorName} />
                        <AvatarFallback>{authorName.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{authorName}</p>
                                <p className="text-muted-foreground text-xs">{formatClassDate(post.created_at, true)}</p>
                            </div>
                            {isFaculty && (onEdit || onDelete || onViewSubmissions) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="-mt-2 -mr-2 size-10 shrink-0">
                                            <EllipsisVertical className="size-4" />
                                            <span className="sr-only">Post actions</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        {post.type === "assignment" && onViewSubmissions && (
                                            <DropdownMenuItem onClick={() => onViewSubmissions(post)}>
                                                <UsersRound className="size-4" />
                                                View submissions
                                                {post.submission_count !== undefined && (
                                                    <Badge variant="secondary" className="ml-auto text-[10px]">
                                                        {post.submission_count}
                                                    </Badge>
                                                )}
                                            </DropdownMenuItem>
                                        )}
                                        {onEdit && (
                                            <DropdownMenuItem onClick={() => onEdit(post)}>
                                                <Pencil className="size-4" />
                                                Edit post
                                            </DropdownMenuItem>
                                        )}
                                        {onDelete && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem variant="destructive" onClick={() => onDelete(post)}>
                                                    <Trash2 className="size-4" />
                                                    Delete post
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge className={cn("border-0 text-[10px]", typeMeta.tone)}>{typeMeta.label}</Badge>
                            {post.status && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                    {classPostStatusLabels[post.status] ?? post.status}
                                </Badge>
                            )}
                            {post.due_date && (
                                <Badge
                                    variant="outline"
                                    className={cn("text-[10px] font-normal", overdue && "border-destructive/40 text-destructive")}
                                >
                                    {overdue ? "Overdue" : "Due"} {formatClassDate(post.due_date)}
                                </Badge>
                            )}
                            {post.total_points !== null && post.total_points !== undefined && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                    {post.total_points} points
                                </Badge>
                            )}
                        </div>
                    </div>
                </header>

                <div className="mt-4 min-w-0">
                    <h2 className="text-base leading-snug font-semibold">{post.title}</h2>
                    {post.content && <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">{post.content}</p>}

                    {post.assignment?.instruction && (
                        <div className="border-border/70 bg-muted/25 mt-3 rounded-md border px-3 py-3">
                            <p className="text-sm leading-6 whitespace-pre-wrap">{post.assignment.instruction}</p>
                            {isFaculty && (
                                <p className="text-muted-foreground mt-2 text-xs">
                                    {post.assignment.audience_mode === "all_students"
                                        ? "Assigned to all students"
                                        : `Assigned to ${post.assignment.assigned_student_ids.length} selected students`}
                                    {post.assignment.rubric.length > 0 ? ` | ${post.assignment.rubric.length} rubric criteria` : ""}
                                </p>
                            )}
                        </div>
                    )}

                    {mediaAttachments.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {mediaAttachments.map((attachment, index) => {
                                const embedUrl = youtubeEmbedUrl(attachment.url);
                                if (embedUrl) {
                                    return (
                                        <div
                                            key={`${attachment.url}-${index}`}
                                            className="border-border/70 overflow-hidden rounded-md border sm:col-span-2"
                                        >
                                            <div className="aspect-video">
                                                <iframe
                                                    src={embedUrl}
                                                    title={attachment.name || "Video attachment"}
                                                    className="size-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </div>
                                    );
                                }

                                if (isVideoAttachment(attachment)) {
                                    return (
                                        <video
                                            key={`${attachment.url}-${index}`}
                                            src={attachment.url}
                                            controls
                                            className="border-border/70 max-h-96 w-full rounded-md border bg-black sm:col-span-2"
                                        />
                                    );
                                }

                                return (
                                    <a
                                        key={`${attachment.url}-${index}`}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-border/70 bg-muted/20 block aspect-[4/3] overflow-hidden rounded-md border"
                                    >
                                        <img src={attachment.url} alt={attachment.name} className="size-full object-cover" />
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    {fileAttachments.length > 0 && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {fileAttachments.map((attachment, index) => (
                                <div
                                    key={`${attachment.url}-${index}`}
                                    className="border-border/70 flex min-w-0 items-center gap-3 rounded-md border p-3"
                                >
                                    <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                                        <FileText className="size-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{attachment.name}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {attachment.kind === "file" ? "File attachment" : "External link"}
                                        </p>
                                    </div>
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:bg-muted flex size-10 shrink-0 items-center justify-center rounded-md"
                                        aria-label={`Open ${attachment.name}`}
                                    >
                                        {attachment.kind === "file" ? <Download className="size-4" /> : <ExternalLink className="size-4" />}
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!isFaculty && post.type === "assignment" && (
                    <footer className="border-border/70 mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                        {post.my_submission ? (
                            <div>
                                <p className="text-sm font-medium">{post.my_submission.status === "graded" ? "Graded" : "Submitted"}</p>
                                <p className="text-muted-foreground text-xs">
                                    {post.my_submission.status === "graded"
                                        ? `${post.my_submission.points ?? 0} of ${post.total_points ?? 0} points`
                                        : `Submitted ${formatClassDate(post.my_submission.submitted_at)}`}
                                </p>
                            </div>
                        ) : (
                            <p className={cn("text-sm", overdue ? "text-destructive" : "text-muted-foreground")}>
                                {overdue ? "This assignment is overdue." : "Your work has not been submitted."}
                            </p>
                        )}
                        {!post.my_submission && onSubmit && (
                            <Button type="button" className="min-h-10 sm:w-auto" onClick={() => onSubmit(post)}>
                                <Send className="size-4" />
                                Submit assignment
                            </Button>
                        )}
                    </footer>
                )}
            </article>
        </Card>
    );
}
