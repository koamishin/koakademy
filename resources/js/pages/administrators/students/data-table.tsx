import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
import { BulkExportButton, type ExportColumn } from "@/components/ui/bulk-export-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { router } from "@inertiajs/react";
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    GraduationCap,
    Loader2,
    Mail,
    Settings2,
    Trash2,
    Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { Student } from "./columns";

declare let route: any;

interface DataTableProps<TData extends Student, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    // Server-side pagination props
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        next_page_url: string | null;
        prev_page_url: string | null;
        from: number;
        to: number;
    };
    filters?: Record<string, any>;
    routeName?: string; // Route to visit for server-side updates
    bulkActions?: {
        statusOptions?: { value: string; label: string }[];
    };
}

function readableLabel(value: string | null, fallback = "Not specified"): string {
    if (!value) return fallback;

    return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAddedAt(value: string | null): string | null {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

const studentExportColumns: ExportColumn<Student>[] = [
    { key: "student_id", label: "Student ID", getValue: (student) => student.student_id },
    { key: "name", label: "Student Name", getValue: (student) => student.name },
    { key: "course", label: "Course Code", getValue: (student) => student.course },
    { key: "course_title", label: "Course Title", defaultSelected: false, getValue: (student) => student.course_title },
    { key: "academic_year", label: "Academic Year", getValue: (student) => student.academic_year },
    { key: "status", label: "Status", getValue: (student) => readableLabel(student.status) },
    { key: "type", label: "Student Type", getValue: (student) => readableLabel(student.type) },
    {
        key: "previous_sem_clearance",
        label: "Clearance",
        defaultSelected: false,
        getValue: (student) =>
            student.previous_sem_clearance === "cleared" ? "Cleared" : student.previous_sem_clearance === "not_cleared" ? "Pending" : "No record",
    },
    { key: "scholarship_type", label: "Scholarship", getValue: (student) => student.scholarship_type || "None" },
    {
        key: "employment_status",
        label: "Employment Status",
        defaultSelected: false,
        getValue: (student) => student.employment_status || "Not specified",
    },
    {
        key: "is_indigenous_person",
        label: "Indigenous Person",
        defaultSelected: false,
        getValue: (student) => student.is_indigenous_person,
    },
    {
        key: "region_of_origin",
        label: "Region of Origin",
        defaultSelected: false,
        getValue: (student) => student.region_of_origin,
    },
    {
        key: "created_at",
        label: "Date Added",
        defaultSelected: false,
        getValue: (student) => formatAddedAt(student.created_at),
    },
];

export function DataTable<TData extends Student, TValue>({
    columns,
    data,
    pagination,
    filters = {},
    routeName = "administrators.students.index",
    bulkActions,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [forceDeleteDialogOpen, setForceDeleteDialogOpen] = React.useState(false);
    const [forceDeleteConfirmText, setForceDeleteConfirmText] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const defaultEmailSubject = "Important Update Regarding Your Student Record";
    const defaultEmailMessage =
        "We hope this message finds you well.\n\nWe are writing to inform you of an important update to your student record. Please review this information at your earliest convenience and respond if any details require clarification.\n\nThank you for your attention and cooperation.";
    const [emailSubject, setEmailSubject] = React.useState(defaultEmailSubject);
    const [emailMessage, setEmailMessage] = React.useState(defaultEmailMessage);

    React.useEffect(() => {
        if (!forceDeleteDialogOpen) {
            setForceDeleteConfirmText("");
        }
    }, [forceDeleteDialogOpen]);

    React.useEffect(() => {
        setRowSelection({});
    }, [data]);

    // Initialize sorting from URL if present
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sort = urlParams.get("sort");
        const direction = urlParams.get("direction");
        if (sort) {
            setSorting([{ id: sort, desc: direction === "desc" }]);
        }
    }, []);

    const table = useReactTable({
        data,
        columns,
        getRowId: (row) => String(row.id),
        getCoreRowModel: getCoreRowModel(),
        manualPagination: !!pagination,
        manualSorting: !!pagination,
        pageCount: pagination?.last_page ?? -1,
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: (updater) => {
            const newSorting = typeof updater === "function" ? updater(sorting) : updater;
            setSorting(newSorting);

            // Trigger server-side sort
            if (newSorting.length > 0) {
                const { id, desc } = newSorting[0];
                router.get(
                    route(routeName),
                    { ...filters, sort: id, direction: desc ? "desc" : "asc", page: 1 },
                    { only: ["students", "filters"], preserveScroll: true, preserveState: true, replace: true },
                );
            } else {
                // Reset sort
                router.get(
                    route(routeName),
                    { ...filters, sort: "created_at", direction: "desc", page: 1 },
                    { only: ["students", "filters"], preserveScroll: true, preserveState: true, replace: true },
                );
            }
        },
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: pagination ? pagination.current_page - 1 : 0,
                pageSize: pagination ? pagination.per_page : 10,
            },
        },
        // Server-side pagination handlers
        onPaginationChange: (updater) => {
            // This is tricky with Inertia because we need to navigate.
            // Typically manualPagination implies we handle the state ourselves and fetch.
            // But with Inertia, we just visit the URL.
            // However, standard table pagination UI calls table.nextPage(), which updates internal state.
            // We can override the Pagination Controls to navigate directly.
        },
    });

    // Function to handle page navigation via Inertia
    const navigateToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { only: ["students", "filters"], preserveScroll: true, preserveState: true, replace: true });
        }
    };

    const handlePerPageChange = (value: string | null) => {
        if (!value) {
            return;
        }

        router.get(
            route(routeName),
            { ...filters, per_page: value, page: 1 },
            { only: ["students", "filters"], preserveScroll: true, preserveState: true, replace: true },
        );
    };

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedData = selectedRows.map((row) => row.original);
    const selectedIds = selectedRows
        .map((row) => {
            const record = row.original as { id?: number };
            return record.id;
        })
        .filter((id): id is number => typeof id === "number");
    const selectedCount = selectedIds.length;
    const hasSelection = selectedCount > 0;

    const resetSelection = () => {
        table.resetRowSelection();
    };

    const resetEmailForm = () => {
        setEmailSubject(defaultEmailSubject);
        setEmailMessage(defaultEmailMessage);
    };

    const handleBulkStatusSubmit = (status: string) => {
        if (!hasSelection || !status || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.patch(
            route("administrators.students.bulk-update-status"),
            { student_ids: selectedIds, status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Updated status for ${selectedCount} student(s).`);
                    resetSelection();
                },
                onError: () => {
                    toast.error("Failed to update student statuses.");
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleBulkClearanceSubmit = (clearance: "cleared" | "not_cleared") => {
        if (!hasSelection || !clearance || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            route("administrators.students.bulk-manage-clearance"),
            {
                student_ids: selectedIds,
                is_cleared: clearance === "cleared",
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Updated clearance for ${selectedCount} student(s).`);
                    resetSelection();
                },
                onError: () => {
                    toast.error("Failed to update student clearance.");
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleBulkDelete = () => {
        if (!hasSelection || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.delete(route("administrators.students.bulk-destroy"), {
            data: { student_ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Deleted ${selectedCount} student(s).`);
                setDeleteDialogOpen(false);
                resetSelection();
            },
            onError: () => {
                toast.error("Failed to delete students.");
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const expectedForceConfirm = `PERMANENTLY DELETE ${selectedCount} STUDENT${selectedCount === 1 ? "" : "S"}`;

    const handleBulkForceDelete = () => {
        if (!hasSelection || isSubmitting) {
            return;
        }

        if (forceDeleteConfirmText !== expectedForceConfirm) {
            toast.error(`Type "${expectedForceConfirm}" exactly to confirm.`);
            return;
        }

        setIsSubmitting(true);
        router.delete(route("administrators.students.bulk-force-destroy"), {
            data: {
                student_ids: selectedIds,
                confirm_text: forceDeleteConfirmText,
            },
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Permanently deleted ${selectedCount} student(s).`);
                setForceDeleteDialogOpen(false);
                setForceDeleteConfirmText("");
                resetSelection();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(typeof firstError === "string" ? firstError : "Failed to permanently delete students.");
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleBulkEmailSubmit = () => {
        if (!hasSelection || !emailSubject.trim() || !emailMessage.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            route("administrators.students.bulk-email"),
            { student_ids: selectedIds, subject: emailSubject.trim(), message: emailMessage.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Email sent to ${selectedCount} student(s).`);
                    setEmailDialogOpen(false);
                    resetEmailForm();
                    resetSelection();
                },
                onError: () => {
                    toast.error("Failed to send email.");
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <div>
            <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <BulkExportButton
                        data={selectedData}
                        columns={studentExportColumns}
                        filename="selected-students"
                        title="Selected Students"
                        getSortValue={(student) => student.name}
                        getSortTieBreaker={(student) => String(student.student_id ?? student.id)}
                    />
                    <Badge variant="secondary" className="h-7 px-2 text-xs">
                        Selected {selectedCount}
                    </Badge>
                    {bulkActions?.statusOptions?.length ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={<Button variant="outline" size="sm" className="gap-2" disabled={!hasSelection || isSubmitting} />}
                            >
                                <GraduationCap className="h-4 w-4" />
                                Change Status
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {bulkActions.statusOptions.map((option) => (
                                    <DropdownMenuItem key={option.value} onClick={() => handleBulkStatusSubmit(option.value)}>
                                        {option.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={<Button variant="outline" size="sm" className="gap-2" disabled={!hasSelection || isSubmitting} />}
                        >
                            <CheckCircle className="h-4 w-4" />
                            Update Clearance
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleBulkClearanceSubmit("cleared")}>Mark as Cleared</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkClearanceSubmit("not_cleared")}>Mark as Pending</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="gap-2" disabled={!hasSelection} onClick={() => setEmailDialogOpen(true)}>
                        <Mail className="h-4 w-4" />
                        Send Email
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-2" disabled={!hasSelection} onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4" />
                        Soft Delete
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2 border-red-900 bg-red-700 hover:bg-red-800"
                        disabled={!hasSelection}
                        onClick={() => setForceDeleteDialogOpen(true)}
                    >
                        <Zap className="h-4 w-4" />
                        Force Delete
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {pagination && (
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select value={`${pagination.per_page}`} onValueChange={handlePerPageChange}>
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={pagination.per_page} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" className="ml-auto" />}>
                            <Settings2 className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id.replace("_", " ")}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <Dialog
                open={emailDialogOpen}
                onOpenChange={(open) => {
                    setEmailDialogOpen(open);
                    if (!open) {
                        resetEmailForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Send Email</DialogTitle>
                        <DialogDescription>Send a formal email to the selected students.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <span className="text-sm font-medium">Subject</span>
                            <Input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <span className="text-sm font-medium">Message</span>
                            <Textarea value={emailMessage} onChange={(event) => setEmailMessage(event.target.value)} rows={7} />
                            <p className="text-muted-foreground text-xs">A personalized greeting and formal closing will be added automatically.</p>
                        </div>
                        <p className="text-muted-foreground text-xs">Selected: {selectedCount} student(s).</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkEmailSubmit}
                            disabled={!hasSelection || !emailSubject.trim() || !emailMessage.trim() || isSubmitting}
                        >
                            Send Email
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Students</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will soft delete {selectedCount} student(s). You can restore them later if needed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                            Soft Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={forceDeleteDialogOpen} onOpenChange={(open) => !isSubmitting && setForceDeleteDialogOpen(open)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Permanently Delete {selectedCount} Student{selectedCount === 1 ? "" : "s"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently erase all {selectedCount} selected student record{selectedCount === 1 ? "" : "s"} along with their
                            enrollments, tuition, transactions, clearances, and contact data. This action{" "}
                            <span className="text-foreground font-semibold">cannot be undone</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="bulk-force-confirm">
                            Type <span className="font-mono font-semibold">{expectedForceConfirm}</span> to confirm:
                        </Label>
                        <Input
                            id="bulk-force-confirm"
                            value={forceDeleteConfirmText}
                            onChange={(e) => setForceDeleteConfirmText(e.target.value)}
                            placeholder={expectedForceConfirm}
                            autoComplete="off"
                            disabled={isSubmitting}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleBulkForceDelete}
                            disabled={isSubmitting || forceDeleteConfirmText !== expectedForceConfirm}
                            className="bg-red-700 text-white hover:bg-red-800"
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                            Force Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                        // Don't navigate if clicking on checkbox, buttons, or dropdown menus
                                        const target = e.target as HTMLElement;
                                        if (
                                            target.closest("button") ||
                                            target.closest('[role="checkbox"]') ||
                                            target.closest("a") ||
                                            target.closest('[role="menu"]')
                                        ) {
                                            return;
                                        }

                                        // Navigate to student detail page
                                        const student = row.original as any;
                                        if (student?.id) {
                                            router.visit(route("administrators.students.show", student.id));
                                        }
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                    {pagination ? (
                        <>
                            Showing {pagination.from} to {pagination.to} of {pagination.total} entries
                        </>
                    ) : (
                        <>
                            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
                        </>
                    )}
                </div>

                {pagination ? (
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">
                                Page {pagination.current_page} of {pagination.last_page}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => navigateToPage(route(routeName, { ...filters, page: 1 }))}
                                disabled={pagination.current_page === 1}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => navigateToPage(pagination.prev_page_url)}
                                disabled={!pagination.prev_page_url}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => navigateToPage(pagination.next_page_url)}
                                disabled={!pagination.next_page_url}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => navigateToPage(route(routeName, { ...filters, page: pagination.last_page }))}
                                disabled={pagination.current_page === pagination.last_page}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
