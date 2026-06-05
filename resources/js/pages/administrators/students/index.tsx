import AdminLayout from "@/components/administrators/admin-layout";
import { Filters, type FilterFieldConfig, type Filter as FilterType } from "@/components/reui/filters";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@/types/user";
import { Head, Link, router } from "@inertiajs/react";
import {
    Award,
    Briefcase,
    CheckCircle,
    Filter,
    GraduationCap,
    HelpCircle,
    LayoutGrid,
    List,
    Loader2,
    MapPin,
    MoreHorizontal,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    UserCheck,
    UserIcon,
    UserPlus,
    Users,
    XCircle,
    Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { columns, Student } from "./columns";
import { DataTable } from "./data-table";

declare let route: (name: string, params?: Record<string, unknown> | string | number) => string;

interface StudentsIndexProps {
    user: User;
    filament: {
        students: {
            index_url: string;
            create_url: string;
        };
    };
    students: {
        data: Student[];
        total: number;
        from: number;
        to: number;
        current_page: number;
        last_page: number;
        per_page: number;
        next_page_url: string | null;
        prev_page_url: string | null;
    };
    stats: {
        total_students: number;
        total_enrolled: number;
        total_applicants: number;
        total_graduated: number;
    };
    filters: {
        search?: string | null;
        type?: string | null;
        status?: string | null;
        scholarship_type?: string | null;
        employment_status?: string | null;
        is_indigenous_person?: string | null;
        previous_semester_cleared?: string | null;
        trashed?: "active" | "trashed" | "all" | null;
        sort?: string | null;
        direction?: "asc" | "desc" | null;
        per_page?: number;
    };
    options: {
        types: { value: string; label: string }[];
        statuses: { value: string; label: string }[];
        scholarship_types: { value: string; label: string }[];
        employment_statuses: { value: string; label: string }[];
    };
}

export default function AdministratorStudentsIndex({ user, students, stats, filters, options }: StudentsIndexProps) {
    const [search, setSearch] = useState(filters.search || "");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [sortOption, setSortOption] = useState(`${filters.sort ?? "created_at"}:${filters.direction ?? "desc"}`);

    const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);

    const filteredStudents = useMemo(() => {
        const searchTerm = search.trim().toLowerCase();

        if (searchTerm === "") {
            return students.data;
        }

        return students.data.filter((student) =>
            [
                student.student_id,
                student.name,
                student.course,
                student.course_title,
                student.academic_year,
                student.type,
                student.status,
                student.scholarship_type,
                student.employment_status,
                student.region_of_origin,
            ]
                .filter((value): value is string | number => value !== null && value !== undefined)
                .some((value) => String(value).toLowerCase().includes(searchTerm)),
        );
    }, [search, students.data]);

    const hasLocalSearch = search.trim() !== "";
    const serverSearch = filters.search ?? "";
    const isServerSearchCurrent = search.trim() === serverSearch.trim();
    const shouldUseLocalSearchResults = hasLocalSearch && !isServerSearchCurrent;
    const visibleStudents = shouldUseLocalSearchResults ? filteredStudents : students.data;
    const visiblePagination = shouldUseLocalSearchResults
        ? {
              current_page: 1,
              last_page: 1,
              per_page: students.per_page,
              total: filteredStudents.length,
              next_page_url: null,
              prev_page_url: null,
              from: filteredStudents.length > 0 ? 1 : 0,
              to: filteredStudents.length,
          }
        : {
              current_page: students.current_page,
              last_page: students.last_page,
              per_page: students.per_page,
              total: students.total,
              next_page_url: students.next_page_url,
              prev_page_url: students.prev_page_url,
              from: students.from,
              to: students.to,
          };

    const parseSortOption = (value: string): { sort: string; direction: "asc" | "desc" } => {
        const [sort = "created_at", direction = "desc"] = value.split(":");

        return {
            sort,
            direction: direction === "asc" ? "asc" : "desc",
        };
    };

    const buildFilterParams = (
        searchTerm: string,
        filterValues: FilterType[] = activeFilters,
        selectedSortOption: string = sortOption,
    ): Record<string, string | number | null> => {
        const sort = parseSortOption(selectedSortOption);
        const appliedFilters: Record<string, string | number | null> = {
            search: searchTerm.trim() || null,
            type: null,
            status: null,
            scholarship_type: null,
            employment_status: null,
            is_indigenous_person: null,
            previous_semester_cleared: null,
            sort: sort.sort,
            direction: sort.direction,
            per_page: students.per_page,
            page: 1,
        };

        filterValues.forEach((filter) => {
            const value = filter.values[0];

            if (typeof value === "string" || typeof value === "number") {
                appliedFilters[filter.field] = value;
            }
        });

        return appliedFilters;
    };

    const refreshStudents = useDebouncedCallback((searchTerm: string, filterValues: FilterType[], selectedSortOption: string = sortOption) => {
        router.get(route("administrators.students.index"), buildFilterParams(searchTerm, filterValues, selectedSortOption), {
            only: ["students", "filters"],
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }, 350);

    useEffect(() => {
        const initialFilters: FilterType[] = [];
        const trashedValue = filters.trashed ?? "active";
        if (trashedValue !== "active") {
            initialFilters.push({ id: "trashed", field: "trashed", operator: "is", values: [trashedValue] });
        }
        if (filters.type) initialFilters.push({ id: "type", field: "type", operator: "is", values: [filters.type] });
        if (filters.status) initialFilters.push({ id: "status", field: "status", operator: "is", values: [filters.status] });
        if (filters.scholarship_type)
            initialFilters.push({ id: "scholarship_type", field: "scholarship_type", operator: "is", values: [filters.scholarship_type] });
        if (filters.employment_status)
            initialFilters.push({ id: "employment_status", field: "employment_status", operator: "is", values: [filters.employment_status] });
        if (filters.is_indigenous_person)
            initialFilters.push({
                id: "is_indigenous_person",
                field: "is_indigenous_person",
                operator: "is",
                values: [filters.is_indigenous_person],
            });
        if (filters.previous_semester_cleared)
            initialFilters.push({
                id: "previous_semester_cleared",
                field: "previous_semester_cleared",
                operator: "is",
                values: [filters.previous_semester_cleared],
            });
        setActiveFilters(initialFilters);
        setSortOption(`${filters.sort ?? "created_at"}:${filters.direction ?? "desc"}`);
    }, [filters]);

    const handleFiltersChange = (newFilters: FilterType[]) => {
        setActiveFilters(newFilters);

        router.get(route("administrators.students.index"), buildFilterParams(search, newFilters), {
            only: ["students", "filters"],
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setActiveFilters([]);
        router.get(route("administrators.students.index"), buildFilterParams(search, []), {
            only: ["students", "filters"],
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleSortChange = (value: string) => {
        setSortOption(value);
        router.get(route("administrators.students.index"), buildFilterParams(search, activeFilters, value), {
            only: ["students", "filters"],
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const navigateToStudentsPage = (url: string | null) => {
        if (!url) {
            return;
        }

        router.get(
            url,
            {},
            {
                only: ["students", "filters"],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const filterFields: FilterFieldConfig[] = useMemo(
        () => [
            {
                key: "trashed",
                label: "Status",
                type: "select",
                icon: <Filter className="h-4 w-4" />,
                options: [
                    { value: "active", label: "Active", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
                    { value: "trashed", label: "Trashed", icon: <Trash2 className="h-4 w-4 text-red-500" /> },
                    { value: "all", label: "All", icon: <Users className="h-4 w-4" /> },
                ],
            },
            {
                key: "type",
                label: "Student Type",
                type: "select",
                icon: <UserIcon className="h-4 w-4" />,
                options: options.types.map((opt) => ({ ...opt, icon: <UserIcon className="text-muted-foreground h-4 w-4" /> })),
            },
            {
                key: "status",
                label: "Enrollment Status",
                type: "select",
                icon: <GraduationCap className="h-4 w-4" />,
                options: options.statuses.map((opt) => ({ ...opt, icon: <GraduationCap className="text-muted-foreground h-4 w-4" /> })),
            },
            {
                key: "previous_semester_cleared",
                label: "Current Semester Clearance",
                type: "select",
                icon: <CheckCircle className="h-4 w-4" />,
                options: [
                    { value: "true", label: "Cleared", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
                    { value: "false", label: "Pending", icon: <HelpCircle className="h-4 w-4 text-yellow-500" /> },
                ],
            },
            {
                key: "scholarship_type",
                label: "Scholarship",
                type: "select",
                icon: <Award className="h-4 w-4" />,
                options: options.scholarship_types.map((opt) => ({ ...opt, icon: <Award className="text-muted-foreground h-4 w-4" /> })),
            },
            {
                key: "employment_status",
                label: "Employment Status",
                type: "select",
                icon: <Briefcase className="h-4 w-4" />,
                options: options.employment_statuses.map((opt) => ({ ...opt, icon: <Briefcase className="text-muted-foreground h-4 w-4" /> })),
            },
            {
                key: "is_indigenous_person",
                label: "Indigenous Person Status",
                type: "select",
                icon: <MapPin className="h-4 w-4" />,
                options: [
                    { value: "yes", label: "Yes", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
                    { value: "no", label: "No", icon: <XCircle className="h-4 w-4 text-red-500" /> },
                ],
            },
        ],
        [options],
    );

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusColor = (status: string | null) => {
        switch (status?.toLowerCase()) {
            case "enrolled":
                return "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400 border-transparent";
            case "graduated":
                return "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400 border-transparent";
            case "dropped":
            case "withdrawn":
                return "bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400 border-transparent";
            case "applicant":
                return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent";
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-400 border-transparent";
        }
    };

    const getClearanceIcon = (status: string) => {
        switch (status) {
            case "cleared":
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case "not_cleared":
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <HelpCircle className="text-muted-foreground h-4 w-4" />;
        }
    };

    const [softDeleteTarget, setSoftDeleteTarget] = useState<Student | null>(null);
    const [forceDeleteTarget, setForceDeleteTarget] = useState<Student | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<Student | null>(null);
    const [confirmForceText, setConfirmForceText] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const onSoft = (e: Event) => setSoftDeleteTarget((e as CustomEvent<Student>).detail);
        const onForce = (e: Event) => {
            setForceDeleteTarget((e as CustomEvent<Student>).detail);
            setConfirmForceText("");
        };
        const onRestore = (e: Event) => setRestoreTarget((e as CustomEvent<Student>).detail);
        window.addEventListener("students:soft-delete", onSoft as EventListener);
        window.addEventListener("students:force-delete", onForce as EventListener);
        window.addEventListener("students:restore", onRestore as EventListener);
        return () => {
            window.removeEventListener("students:soft-delete", onSoft as EventListener);
            window.removeEventListener("students:force-delete", onForce as EventListener);
            window.removeEventListener("students:restore", onRestore as EventListener);
        };
    }, []);

    const handleConfirmSoftDelete = () => {
        if (!softDeleteTarget) return;
        setDeleting(true);
        router.delete(route("administrators.students.destroy", softDeleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Student "${softDeleteTarget.name}" has been moved to trash.`);
                setSoftDeleteTarget(null);
            },
            onError: () => toast.error("Failed to delete student."),
            onFinish: () => setDeleting(false),
        });
    };

    const handleConfirmForceDelete = () => {
        if (!forceDeleteTarget || confirmForceText !== forceDeleteTarget.student_id) {
            toast.error("Student ID confirmation does not match.");
            return;
        }
        setDeleting(true);
        router.delete(route("administrators.students.force-destroy", forceDeleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Student "${forceDeleteTarget.name}" has been permanently deleted.`);
                setForceDeleteTarget(null);
                setConfirmForceText("");
            },
            onError: () => toast.error("Failed to permanently delete student."),
            onFinish: () => setDeleting(false),
        });
    };

    const handleConfirmRestore = () => {
        if (!restoreTarget) return;
        setDeleting(true);
        router.post(
            route("administrators.students.restore", restoreTarget.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Student "${restoreTarget.name}" has been restored.`);
                    setRestoreTarget(null);
                },
                onError: () => toast.error("Failed to restore student."),
                onFinish: () => setDeleting(false),
            },
        );
    };

    return (
        <AdminLayout user={user} title="Students">
            <Head title="Administrators • Students" />

            <div className="flex flex-col gap-6">
                {/* Header & Stats */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Students</h2>
                            <p className="text-muted-foreground">Manage and monitor student records, enrollment, and status.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild className="gap-2">
                                <Link href={route("administrators.students.create")}>
                                    <Plus className="h-4 w-4" />
                                    Create Student
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="bg-primary/10 rounded-full p-3">
                                    <Users className="text-primary h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Students</p>
                                    <h3 className="text-2xl font-bold">{stats.total_students}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Enrolled</p>
                                    <h3 className="text-2xl font-bold">{stats.total_enrolled}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                                    <UserPlus className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Applicants</p>
                                    <h3 className="text-2xl font-bold">{stats.total_applicants}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                    <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Graduated</p>
                                    <h3 className="text-2xl font-bold">{stats.total_graduated}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Control Bar */}
                <div className="bg-card flex flex-col justify-between gap-4 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center">
                    <div className="relative max-w-md flex-1">
                        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search by name, ID..."
                            className="bg-background pl-8"
                            value={search}
                            onChange={(e) => {
                                const nextSearch = e.target.value;

                                setSearch(nextSearch);
                                refreshStudents(nextSearch, activeFilters);
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={sortOption} onValueChange={handleSortChange}>
                            <SelectTrigger className="h-8 w-[180px]">
                                <SelectValue placeholder="Sort students" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="created_at:desc">Latest added</SelectItem>
                                <SelectItem value="created_at:asc">Oldest added</SelectItem>
                                <SelectItem value="name:asc">Name A-Z</SelectItem>
                                <SelectItem value="name:desc">Name Z-A</SelectItem>
                                <SelectItem value="student_id:asc">Student ID ascending</SelectItem>
                                <SelectItem value="student_id:desc">Student ID descending</SelectItem>
                            </SelectContent>
                        </Select>

                        <Filters
                            fields={filterFields}
                            filters={activeFilters}
                            onChange={handleFiltersChange}
                            trigger={
                                <Button variant="outline" className="relative gap-2" size="sm">
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    {activeFilters.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs">
                                            {activeFilters.length}
                                        </Badge>
                                    )}
                                </Button>
                            }
                        />

                        {activeFilters.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-8 px-2">
                                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                Reset
                            </Button>
                        )}

                        <Separator orientation="vertical" className="mx-1 h-8" />

                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "grid")}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="list" title="List View">
                                    <List className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="grid" title="Grid View">
                                    <LayoutGrid className="h-4 w-4" />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* Content */}
                <Tabs value={viewMode} className="w-full">
                    <TabsContent value="list" className="mt-0">
                        <DataTable
                            columns={columns}
                            data={visibleStudents}
                            pagination={visiblePagination}
                            filters={filters}
                            bulkActions={{ statusOptions: options.statuses }}
                        />
                    </TabsContent>

                    <TabsContent value="grid" className="mt-0">
                        {visibleStudents.length === 0 ? (
                            <div className="bg-muted/10 flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
                                <Search className="mb-2 h-8 w-8 opacity-20" />
                                <p className="text-muted-foreground">No students found matching your criteria.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {visibleStudents.map((row) => (
                                        <Card
                                            key={row.id}
                                            className="cursor-pointer transition-shadow hover:shadow-md"
                                            onClick={(e) => {
                                                // Don't navigate if clicking on buttons or links
                                                const target = e.target as HTMLElement;
                                                if (target.closest("button") || target.closest("a")) {
                                                    return;
                                                }
                                                router.visit(route("administrators.students.show", row.id));
                                            }}
                                        >
                                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                                <Avatar className="h-12 w-12 border">
                                                    <AvatarImage src={row.avatar_url ?? undefined} alt={row.name} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                                                        {getInitials(row.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col overflow-hidden">
                                                    <h3 className="truncate text-sm font-semibold" title={row.name}>
                                                        {row.name}
                                                    </h3>
                                                    <p className="text-muted-foreground truncate text-xs">{row.student_id ?? "No ID"}</p>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-4">
                                                <div className="mb-3 flex flex-wrap gap-2">
                                                    <Badge className={`text-[10px] font-bold shadow-none ${getStatusColor(row.status)}`}>
                                                        {row.status ?? "Unknown"}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {row.course ?? "N/A"}
                                                    </Badge>
                                                </div>
                                                <div className="text-muted-foreground space-y-1 text-xs">
                                                    <div className="flex items-center justify-between">
                                                        <span>Year:</span>
                                                        <span className="text-foreground font-medium">{row.academic_year}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span>Clearance:</span>
                                                        <div className="flex items-center gap-1">
                                                            {getClearanceIcon(row.previous_sem_clearance)}
                                                            <span className="capitalize">
                                                                {row.previous_sem_clearance === "cleared" ? "Cleared" : "Pending"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex gap-2 pt-0">
                                                <Button asChild variant="outline" size="sm" className="w-full">
                                                    <Link href={route("administrators.students.show", row.id)}>View</Link>
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route("administrators.students.edit", row.id)}>Edit</Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                                {/* Manual Pagination for Grid View using the same style as Table */}
                                <div className="mt-4 flex items-center justify-between border-t pt-4">
                                    <div className="text-muted-foreground text-sm">
                                        Showing {visiblePagination.from} to {visiblePagination.to} of {visiblePagination.total} entries
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!visiblePagination.prev_page_url}
                                            onClick={() => navigateToStudentsPage(visiblePagination.prev_page_url)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!visiblePagination.next_page_url}
                                            onClick={() => navigateToStudentsPage(visiblePagination.next_page_url)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <AlertDialog open={!!softDeleteTarget} onOpenChange={(open) => !open && setSoftDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Soft Delete Student?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong className="text-foreground">{softDeleteTarget?.name}</strong> will be moved to trash and hidden from default views. You can restore them later from the "Trashed" filter.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSoftDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Soft Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!forceDeleteTarget} onOpenChange={(open) => !open && !deleting && setForceDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <Zap className="h-5 w-5" />
                            Permanently Delete Student?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently erase <strong className="text-foreground">{forceDeleteTarget?.name}</strong> along with all enrollments, tuition, transactions, clearances, and contact data. This action <strong className="text-foreground">cannot be undone</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="index-force-confirm">
                            Type <span className="font-mono font-semibold">{forceDeleteTarget?.student_id}</span> to confirm:
                        </Label>
                        <Input
                            id="index-force-confirm"
                            value={confirmForceText}
                            onChange={(e) => setConfirmForceText(e.target.value)}
                            placeholder={String(forceDeleteTarget?.student_id ?? "")}
                            autoComplete="off"
                            disabled={deleting}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleConfirmForceDelete}
                            disabled={deleting || confirmForceText !== forceDeleteTarget?.student_id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                            Force Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5" />
                            Restore Student?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong className="text-foreground">{restoreTarget?.name}</strong> will be restored and reappear in the active students list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmRestore} disabled={deleting}>
                            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
