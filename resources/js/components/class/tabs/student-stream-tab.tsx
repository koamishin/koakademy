import { ClassPostCard } from "@/components/class/class-post-card";
import { StudentSubmissionDialog } from "@/components/class/student-submission-dialog";
import { ClassPostEntry, TeacherEntry } from "@/types/class-detail-types";
import { Megaphone } from "lucide-react";
import { useState } from "react";

interface StudentStreamTabProps {
    classData: {
        id: number;
        subject_code: string;
    };
    teacher: TeacherEntry;
    classPosts: ClassPostEntry[];
}

export function StudentStreamTab({ classData, teacher, classPosts }: StudentStreamTabProps) {
    const [submittingPost, setSubmittingPost] = useState<ClassPostEntry | null>(null);

    if (classPosts.length === 0) {
        return (
            <div className="border-border/70 bg-card flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                <Megaphone className="text-muted-foreground size-8" />
                <h2 className="mt-3 text-sm font-semibold">No class updates yet</h2>
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">Announcements and activities from your instructor will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {classPosts.map((post) => (
                <ClassPostCard
                    key={post.id}
                    post={post}
                    authorName={teacher.name}
                    authorAvatar={teacher.photo_url}
                    viewer="student"
                    onSubmit={setSubmittingPost}
                />
            ))}

            <StudentSubmissionDialog
                open={submittingPost !== null}
                onOpenChange={(open) => !open && setSubmittingPost(null)}
                classId={classData.id}
                post={submittingPost}
            />
        </div>
    );
}
