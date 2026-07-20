import { ClassPostEntry } from "@/types/class-detail-types";

export const classPostTypeMeta: Record<string, { label: string; tone: string }> = {
    announcement: { label: "Announcement", tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
    quiz: { label: "Quiz", tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
    assignment: { label: "Assignment", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
    activity: { label: "Activity", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
};

export const classPostStatusLabels: Record<string, string> = {
    backlog: "Planned",
    in_progress: "In progress",
    review: "Needs review",
    blocked: "Needs help",
    done: "Completed",
};

export function parseClassDate(value?: string | null): Date | null {
    if (!value) return null;

    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (ymd) {
        return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatClassDate(value?: string | null, includeTime = false): string {
    const date = parseClassDate(value);
    if (!date) return "";

    return new Intl.DateTimeFormat(undefined, includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

export function isClassPostOverdue(post: ClassPostEntry): boolean {
    const dueDate = parseClassDate(post.due_date);
    if (!dueDate || post.my_submission) return false;

    dueDate.setHours(23, 59, 59, 999);
    return dueDate.getTime() < Date.now();
}
