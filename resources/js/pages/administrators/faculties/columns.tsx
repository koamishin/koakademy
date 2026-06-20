import { destroy, edit, show } from "@/actions/App/Http/Controllers/AdministratorFacultyManagementController";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, FileText, KeyRound, MoreHorizontal, PieChart, Trash } from "lucide-react";
import { DataTableColumnHeader } from "./data-table-column-header";

export type FacultyRow = {
    id: string;
    faculty_id_number: string | null;
    name: string;
    email: string;
    department: string | null;
    status: string | null;
    avatar_url: string | null;
    current_classes_count: number;
    profile_completion: {
        completed: number;
        total: number;
        percent: number;
        missing: string[];
    };
    portal_account: {
        status: "linked" | "needs_repair" | "not_linked";
        label: string;
        role_label: string | null;
        needs_repair: boolean;
    };
    workload_summary: {
        current_classes_count: number;
        level: "needs_classes" | "light" | "balanced" | "heavy";
        label: string;
    };
    filament: {
        view_url: string;
        edit_url: string;
    };
};

function statusLabel(status: string | null | undefined): string {
    if (!status) return "Unknown";
    if (status === "active") return "Active";
    if (status === "inactive") return "Inactive";
    if (status === "on_leave") return "On Leave";

    return status;
}

function statusBadgeVariant(status: string | null | undefined): "default" | "secondary" | "outline" {
    if (status === "active") return "default";
    if (status === "inactive") return "secondary";
    if (status === "on_leave") return "outline";

    return "outline";
}

function portalVariant(status: FacultyRow["portal_account"]["status"]): "default" | "secondary" | "outline" {
    if (status === "linked") return "default";
    if (status === "needs_repair") return "secondary";

    return "outline";
}

function workloadVariant(level: FacultyRow["workload_summary"]["level"]): "default" | "secondary" | "outline" {
    if (level === "balanced") return "default";
    if (level === "heavy") return "secondary";

    return "outline";
}

interface GetColumnsProps {
    onDelete: (id: string, name: string) => void;
}

export const getColumns = ({ onDelete }: GetColumnsProps): ColumnDef<FacultyRow>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Faculty" />,
        cell: ({ row }) => (
            <div className="flex min-w-64 items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={row.original.avatar_url ?? undefined} alt={row.original.name} />
                    <AvatarFallback>{(row.original.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <span className="block truncate font-medium">{row.original.name}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                        {row.original.faculty_id_number ? `ID: ${row.original.faculty_id_number} - ` : ""}
                        {row.original.email}
                    </span>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "department",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        cell: ({ row }) => <div className="text-muted-foreground">{row.original.department ?? "No department"}</div>,
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <Badge variant={statusBadgeVariant(row.original.status)}>{statusLabel(row.original.status)}</Badge>,
    },
    {
        accessorKey: "current_classes_count",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Workload" />,
        cell: ({ row }) => (
            <Badge variant={workloadVariant(row.original.workload_summary.level)} className="gap-1 whitespace-nowrap">
                <PieChart className="h-3.5 w-3.5" />
                {row.original.workload_summary.label} ({row.original.current_classes_count})
            </Badge>
        ),
    },
    {
        accessorKey: "portal_account",
        header: "Portal",
        cell: ({ row }) => (
            <Badge variant={portalVariant(row.original.portal_account.status)} className="gap-1 whitespace-nowrap">
                <KeyRound className="h-3.5 w-3.5" />
                {row.original.portal_account.label}
            </Badge>
        ),
    },
    {
        accessorKey: "profile_completion",
        header: "Profile",
        cell: ({ row }) => (
            <div className="min-w-28">
                <div className="text-sm font-medium">{row.original.profile_completion.percent}%</div>
                <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${row.original.profile_completion.percent}%` }} />
                </div>
            </div>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const faculty = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.visit(show.url(faculty.id))}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.visit(edit.url(faculty.id))}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(faculty.filament.edit_url, "_blank")}>
                            <FileText className="mr-2 h-4 w-4" /> Edit in Filament
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600" onClick={() => onDelete(faculty.id, faculty.name)}>
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
