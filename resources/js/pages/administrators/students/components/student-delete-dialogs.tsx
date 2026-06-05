import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { router } from "@inertiajs/react";
import { Loader2, RotateCcw, Trash2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { StudentDetail } from "../types";

interface StudentDeleteDialogsProps {
    student: StudentDetail;
    action: "softDelete" | "forceDelete" | "restore" | null;
    onClose: () => void;
}

export function StudentDeleteDialogs({ student, action, onClose }: StudentDeleteDialogsProps) {
    const [submitting, setSubmitting] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    useEffect(() => {
        if (action) {
            setConfirmText("");
        }
    }, [action]);

    if (!action) {
        return null;
    }

    const handleSoftDelete = () => {
        setSubmitting(true);
        router.delete(route("administrators.students.destroy", student.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Student "${student.name}" has been moved to trash.`);
                onClose();
                router.visit(route("administrators.students.index"));
            },
            onError: () => {
                toast.error("Failed to delete student.");
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleForceDelete = () => {
        if (confirmText !== student.student_id) {
            toast.error("Student ID confirmation does not match.");
            return;
        }

        setSubmitting(true);
        router.delete(route("administrators.students.force-destroy", student.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Student "${student.name}" has been permanently deleted.`);
                router.visit(route("administrators.students.index"));
            },
            onError: () => {
                toast.error("Failed to permanently delete student.");
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleRestore = () => {
        setSubmitting(true);
        router.post(
            route("administrators.students.restore", student.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Student "${student.name}" has been restored.`);
                    onClose();
                },
                onError: () => {
                    toast.error("Failed to restore student.");
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <>
            <AlertDialog open={action === "softDelete"} onOpenChange={(open) => !open && onClose()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Soft Delete Student?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong className="text-foreground">{student.name}</strong> will be moved to the trash and hidden
                            from default views. You can restore this record later from the trashed students list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSoftDelete}
                            disabled={submitting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Soft Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={action === "forceDelete"} onOpenChange={(open) => !open && onClose()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <Zap className="h-5 w-5" />
                            Permanently Delete Student?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently erase <strong className="text-foreground">{student.name}</strong> along with
                            all enrollments, tuition records, transactions, clearances, and contact data. This action
                            <strong className="text-foreground"> cannot be undone</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="force-delete-confirm">
                            Type <span className="font-mono font-semibold">{student.student_id}</span> to confirm:
                        </Label>
                        <Input
                            id="force-delete-confirm"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={String(student.student_id ?? "")}
                            autoComplete="off"
                            disabled={submitting}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleForceDelete}
                            disabled={submitting || confirmText !== student.student_id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                            Force Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={action === "restore"} onOpenChange={(open) => !open && onClose()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5" />
                            Restore Student?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong className="text-foreground">{student.name}</strong> will be restored and reappear in
                            the active students list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestore} disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
