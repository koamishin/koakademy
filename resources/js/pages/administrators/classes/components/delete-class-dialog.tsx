import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import type { ClassRow } from "../columns";

interface DeleteClassDialogProps {
    pendingDelete: ClassRow | null;
    onConfirm: () => void;
    onCancel: () => void;
    processing?: boolean;
}

export function DeleteClassDialog({ pendingDelete, onConfirm, onCancel, processing = false }: DeleteClassDialogProps) {
    return (
        <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete this class?</DialogTitle>
                    <DialogDescription>
                        This will permanently remove <span className="text-foreground font-medium">{pendingDelete?.record_title}</span> along with
                        its schedules and settings. Enrolled students will lose access. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={processing}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={processing}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete class
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
