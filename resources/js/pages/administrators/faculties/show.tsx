import {
    assignClasses,
    destroy,
    edit,
    index,
    managePortalAccount,
    sendNotice,
    storeDeadline,
    unassignClass,
    updateFacultyIdNumber,
} from "@/actions/App/Http/Controllers/AdministratorFacultyManagementController";
import AdminLayout from "@/components/administrators/admin-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { User } from "@/Types/user";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    AlertTriangle,
    BookOpen,
    CalendarClock,
    CheckCircle2,
    ExternalLink,
    GraduationCap,
    IdCard,
    KeyRound,
    Mail,
    Megaphone,
    Phone,
    Save,
    Trash2,
    UserCog,
} from "lucide-react";
import { useMemo, useState } from "react";

type Option = { value: string; label: string };

type ScheduleSlot = {
    time_range: string;
    room: { id: number; name: string };
};

type WeeklySchedule = Record<string, ScheduleSlot[]>;

type ClassRow = {
    id: number;
    subject_code: string;
    subject_title: string | null;
    section: string;
    school_year: string;
    semester: number;
    classification: string | null;
    student_count: number | null;
    schedule?: WeeklySchedule | null;
};

type AssignmentWarning = {
    type: "reassignment" | "schedule_conflict" | "heavy_load";
    message: string;
};

type AssignmentClass = ClassRow & {
    label: string;
    assigned_faculty: { id: string; name: string } | null;
    assignment_status: "unassigned" | "assigned_here" | "assigned_elsewhere";
    warnings: AssignmentWarning[];
};

type FacultyDetail = {
    id: string;
    faculty_id_number: string | null;
    name: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    phone_number: string | null;
    department: string | null;
    office_hours: string | null;
    birth_date: string | null;
    address_line1: string | null;
    biography: string | null;
    education: string | null;
    courses_taught: string | null;
    avatar_url: string | null;
    status: string | null;
    gender: string | null;
    age: number | null;
    classes: ClassRow[];
    current_classes: ClassRow[];
    profile_completion: {
        completed: number;
        total: number;
        percent: number;
        missing: string[];
    };
    portal_account: {
        status: "linked" | "needs_repair" | "not_linked";
        label: string;
        user_id: number | null;
        role: string | null;
        role_label: string | null;
        email_verified_at: string | null;
        last_login_at: string | null;
        needs_repair: boolean;
    };
    workload_summary: {
        current_classes_count: number;
        level: "needs_classes" | "light" | "balanced" | "heavy";
        label: string;
    };
    recommended_actions: {
        type: string;
        title: string;
        description: string;
    }[];
    recent_notifications: {
        id: string;
        title: string;
        message: string;
        priority: string;
        read_at: string | null;
        created_at: string | null;
    }[];
    deadlines: {
        id: number;
        title: string;
        description: string | null;
        due_date: string | null;
        priority: string;
        type: string | null;
        class_label: string | null;
    }[];
    filament: {
        view_url: string;
        edit_url: string;
    };
};

interface FacultyShowProps {
    user: User;
    faculty: FacultyDetail;
    assignment_planner: {
        classes: AssignmentClass[];
    };
    options: {
        statuses: Option[];
        faculty_roles: Option[];
        deadline_priorities: Option[];
        notice_priorities: Option[];
    };
}

function statusLabel(status: string | null | undefined): string {
    if (!status) return "Unknown";
    if (status === "active") return "Active";
    if (status === "inactive") return "Inactive";
    if (status === "on_leave") return "On Leave";

    return status;
}

function formatSchedule(schedule: WeeklySchedule | null | undefined) {
    if (!schedule) return <span className="text-muted-foreground">TBA</span>;

    const entries = Object.entries(schedule)
        .flatMap(([day, slots]) => slots.map((slot) => ({ day, slot })))
        .filter((entry) => entry.slot);

    if (entries.length === 0) return <span className="text-muted-foreground">TBA</span>;

    return (
        <div className="space-y-1">
            {entries.map((entry, index) => (
                <div key={`${entry.day}-${index}`} className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="h-5 px-1.5 py-0 font-mono text-[10px]">
                        {entry.day.slice(0, 3).toUpperCase()}
                    </Badge>
                    <span>{entry.slot.time_range}</span>
                    <span>{entry.slot.room.name}</span>
                </div>
            ))}
        </div>
    );
}

export default function AdministratorFacultyShow({ user, faculty, assignment_planner, options }: FacultyShowProps) {
    const [assignmentSearch, setAssignmentSearch] = useState("");

    const idForm = useForm({ faculty_id_number: faculty.faculty_id_number ?? "" });
    const assignmentForm = useForm({
        class_ids: [] as number[],
        allow_reassignment: false,
        notify_faculty: true,
    });
    const portalForm = useForm({
        mode: faculty.portal_account.status === "not_linked" ? "create" : "repair",
        role: faculty.portal_account.role ?? options.faculty_roles[0]?.value ?? "instructor",
        send_reset_link: true,
    });
    const noticeForm = useForm({
        title: "",
        message: "",
        priority: "normal",
        action_url: "",
    });
    const deadlineForm = useForm({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        type: "administrative",
        class_id: "none",
    });

    const filteredPlannerClasses = useMemo(() => {
        const query = assignmentSearch.trim().toLowerCase();
        if (!query) return assignment_planner.classes;

        return assignment_planner.classes.filter((item) => {
            return item.label.toLowerCase().includes(query) || item.subject_code.toLowerCase().includes(query) || item.section.toLowerCase().includes(query);
        });
    }, [assignmentSearch, assignment_planner.classes]);

    const selectedPlannerClasses = useMemo(() => {
        return assignment_planner.classes.filter((item) => assignmentForm.data.class_ids.includes(item.id));
    }, [assignmentForm.data.class_ids, assignment_planner.classes]);

    const selectedHasReassignment = selectedPlannerClasses.some((item) => item.assignment_status === "assigned_elsewhere");
    const selectedWarnings = selectedPlannerClasses.flatMap((item) => item.warnings.map((warning) => ({ ...warning, classLabel: item.label })));

    const toggleAssignmentClass = (classId: number) => {
        const classIds = assignmentForm.data.class_ids.includes(classId)
            ? assignmentForm.data.class_ids.filter((id) => id !== classId)
            : [...assignmentForm.data.class_ids, classId];

        assignmentForm.setData("class_ids", classIds);
    };

    const submitAssignments = () => {
        assignmentForm.post(assignClasses.url(faculty.id), {
            preserveScroll: true,
            onSuccess: () => {
                assignmentForm.reset("class_ids", "allow_reassignment");
                setAssignmentSearch("");
            },
        });
    };

    const submitPortal = () => {
        portalForm.post(managePortalAccount.url(faculty.id), { preserveScroll: true });
    };

    const submitNotice = () => {
        noticeForm.post(sendNotice.url(faculty.id), {
            preserveScroll: true,
            onSuccess: () => noticeForm.reset(),
        });
    };

    const submitDeadline = () => {
        deadlineForm.transform((data) => ({
            ...data,
            class_id: data.class_id === "none" ? null : Number(data.class_id),
        }));

        deadlineForm.post(storeDeadline.url(faculty.id), {
            preserveScroll: true,
            onSuccess: () => deadlineForm.reset(),
        });
    };

    const submitFacultyId = () => {
        idForm.put(updateFacultyIdNumber.url(faculty.id), { preserveScroll: true });
    };

    const removeClass = (classId: number) => {
        if (!confirm("Unassign this class from the faculty?")) return;

        router.delete(unassignClass.url({ faculty: faculty.id, class: classId }), { preserveScroll: true });
    };

    const deleteFaculty = () => {
        if (!confirm(`Delete ${faculty.name}? This cannot be undone.`)) return;

        router.delete(destroy.url(faculty.id));
    };

    return (
        <AdminLayout user={user} title="Faculty Details">
            <Head title={`Faculty - ${faculty.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Link href={index.url()} className="hover:text-foreground transition-colors">
                                Faculty Operations
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{faculty.name}</span>
                        </div>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight">{faculty.name}</h2>
                        <p className="text-muted-foreground">Teaching load, portal access, notices, and profile records.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={edit.url(faculty.id)}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <a href={faculty.filament.view_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Filament
                            </a>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={deleteFaculty}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <MetricCard title="Current load" value={`${faculty.current_classes.length}`} detail={faculty.workload_summary.label} icon={BookOpen} />
                    <MetricCard title="Portal" value={faculty.portal_account.label} detail={faculty.portal_account.role_label ?? "No role"} icon={KeyRound} />
                    <MetricCard title="Profile" value={`${faculty.profile_completion.percent}%`} detail={`${faculty.profile_completion.completed}/${faculty.profile_completion.total} fields`} icon={CheckCircle2} />
                    <MetricCard title="Status" value={statusLabel(faculty.status)} detail={faculty.department ?? "No department"} icon={GraduationCap} />
                </div>

                {faculty.recommended_actions.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-3">
                        {faculty.recommended_actions.map((action) => (
                            <Card key={action.title} className="border-yellow-200 bg-yellow-50/40">
                                <CardContent className="flex gap-3 p-4">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-700" />
                                    <div>
                                        <div className="text-sm font-medium">{action.title}</div>
                                        <div className="text-muted-foreground text-xs">{action.description}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : null}

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="load">Teaching load</TabsTrigger>
                        <TabsTrigger value="portal">Portal access</TabsTrigger>
                        <TabsTrigger value="notices">Notices</TabsTrigger>
                        <TabsTrigger value="records">Records</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={faculty.avatar_url ?? undefined} alt={faculty.name} />
                                        <AvatarFallback>{faculty.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <CardTitle className="truncate">{faculty.name}</CardTitle>
                                        <CardDescription className="truncate">{faculty.email}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoRow icon={IdCard} label="Faculty ID" value={faculty.faculty_id_number ?? "Missing"} />
                                <InfoRow icon={Mail} label="Email" value={faculty.email} />
                                <InfoRow icon={Phone} label="Phone" value={faculty.phone_number ?? "None"} />
                                <InfoRow icon={CalendarClock} label="Office hours" value={faculty.office_hours ?? "Not listed"} />
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">Profile completion</span>
                                        <span className="text-muted-foreground">{faculty.profile_completion.percent}%</span>
                                    </div>
                                    <Progress value={faculty.profile_completion.percent} className="h-2" />
                                    {faculty.profile_completion.missing.length > 0 ? (
                                        <div className="text-muted-foreground text-xs">Missing: {faculty.profile_completion.missing.join(", ")}</div>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Corrections</CardTitle>
                                <CardDescription>Small administrative repairs that do not require opening the full edit form.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
                                <div className="space-y-2">
                                    <Label htmlFor="faculty_id_number">Faculty ID Number</Label>
                                    <Input
                                        id="faculty_id_number"
                                        value={idForm.data.faculty_id_number}
                                        onChange={(event) => idForm.setData("faculty_id_number", event.target.value)}
                                    />
                                    {idForm.errors.faculty_id_number ? <p className="text-sm text-red-500">{idForm.errors.faculty_id_number}</p> : null}
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={submitFacultyId} disabled={idForm.processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save ID
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="load" className="mt-4 space-y-4">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Classes</CardTitle>
                                    <CardDescription>Classes assigned in the active academic period.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ClassTable classes={faculty.current_classes} onUnassign={removeClass} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Assignment Planner</CardTitle>
                                    <CardDescription>Select classes, review warnings, and optionally notify the faculty.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Input value={assignmentSearch} onChange={(event) => setAssignmentSearch(event.target.value)} placeholder="Search classes" />
                                    <div className="max-h-[440px] space-y-2 overflow-auto pr-1">
                                        {filteredPlannerClasses.map((classItem) => {
                                            const isSelected = assignmentForm.data.class_ids.includes(classItem.id);
                                            const isAssignedHere = classItem.assignment_status === "assigned_here";

                                            return (
                                                <button
                                                    key={classItem.id}
                                                    type="button"
                                                    disabled={isAssignedHere}
                                                    onClick={() => toggleAssignmentClass(classItem.id)}
                                                    className={cn(
                                                        "w-full rounded-md border p-3 text-left transition",
                                                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                                                        isAssignedHere && "cursor-not-allowed opacity-60",
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-sm font-medium">{classItem.label}</div>
                                                            <div className="text-muted-foreground text-xs">{formatSchedule(classItem.schedule)}</div>
                                                        </div>
                                                        <Checkbox checked={isSelected || isAssignedHere} />
                                                    </div>
                                                    {classItem.assigned_faculty && classItem.assignment_status === "assigned_elsewhere" ? (
                                                        <Badge variant="secondary" className="mt-2">
                                                            Assigned to {classItem.assigned_faculty.name}
                                                        </Badge>
                                                    ) : null}
                                                    {classItem.warnings.length > 0 ? (
                                                        <div className="mt-2 space-y-1">
                                                            {classItem.warnings.map((warning) => (
                                                                <div key={warning.message} className="text-xs text-yellow-700">
                                                                    {warning.message}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedWarnings.length > 0 ? (
                                        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                                            {selectedWarnings.slice(0, 3).map((warning) => (
                                                <div key={`${warning.classLabel}-${warning.message}`}>{warning.classLabel}: {warning.message}</div>
                                            ))}
                                        </div>
                                    ) : null}
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox checked={assignmentForm.data.notify_faculty} onCheckedChange={(checked) => assignmentForm.setData("notify_faculty", checked === true)} />
                                        Notify faculty after assignment changes
                                    </label>
                                    {selectedHasReassignment ? (
                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={assignmentForm.data.allow_reassignment}
                                                onCheckedChange={(checked) => assignmentForm.setData("allow_reassignment", checked === true)}
                                            />
                                            Confirm reassignment from another faculty
                                        </label>
                                    ) : null}
                                    {assignmentForm.errors.class_ids ? <p className="text-sm text-red-500">{assignmentForm.errors.class_ids}</p> : null}
                                    <Button
                                        className="w-full"
                                        onClick={submitAssignments}
                                        disabled={
                                            assignmentForm.processing ||
                                            assignmentForm.data.class_ids.length === 0 ||
                                            (selectedHasReassignment && !assignmentForm.data.allow_reassignment)
                                        }
                                    >
                                        Assign {assignmentForm.data.class_ids.length} class(es)
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Class History</CardTitle>
                                <CardDescription>Previous and current records tied to this faculty profile.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ClassTable classes={faculty.classes} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="portal" className="mt-4 grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Portal Account</CardTitle>
                                <CardDescription>Repair or create the linked faculty user account.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-md border p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="font-medium">{faculty.portal_account.label}</div>
                                            <div className="text-muted-foreground text-sm">{faculty.portal_account.role_label ?? "No faculty role linked"}</div>
                                        </div>
                                        <Badge variant={faculty.portal_account.status === "linked" ? "default" : "secondary"}>{faculty.portal_account.status}</Badge>
                                    </div>
                                    <Separator className="my-3" />
                                    <div className="text-muted-foreground space-y-1 text-sm">
                                        <div>Email verified: {faculty.portal_account.email_verified_at ?? "No"}</div>
                                        <div>Last login: {faculty.portal_account.last_login_at ?? "Never"}</div>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Mode</Label>
                                        <Select value={portalForm.data.mode} onValueChange={(value) => portalForm.setData("mode", value ?? "create")}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="create">Create</SelectItem>
                                                <SelectItem value="repair">Repair</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={portalForm.data.role} onValueChange={(value) => portalForm.setData("role", value ?? "instructor")}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.faculty_roles.map((role) => (
                                                    <SelectItem key={role.value} value={role.value}>
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox checked={portalForm.data.send_reset_link} onCheckedChange={(checked) => portalForm.setData("send_reset_link", checked === true)} />
                                    Send password reset link
                                </label>
                                {portalForm.errors.mode ? <p className="text-sm text-red-500">{portalForm.errors.mode}</p> : null}
                                <Button onClick={submitPortal} disabled={portalForm.processing}>
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Prepare portal access
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Notices</CardTitle>
                                <CardDescription>Latest database notifications visible to the linked portal user.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {faculty.recent_notifications.length === 0 ? (
                                    <div className="text-muted-foreground rounded-md border p-4 text-sm">No recent notices.</div>
                                ) : (
                                    faculty.recent_notifications.map((notice) => (
                                        <div key={notice.id} className="rounded-md border p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="font-medium">{notice.title}</div>
                                                <Badge variant="outline">{notice.priority}</Badge>
                                            </div>
                                            <div className="text-muted-foreground mt-1 text-sm">{notice.message}</div>
                                            <div className="text-muted-foreground mt-2 text-xs">{notice.created_at}</div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notices" className="mt-4 grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Send Admin Notice</CardTitle>
                                <CardDescription>Creates a portal notification for the linked faculty user.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={noticeForm.data.title} onChange={(event) => noticeForm.setData("title", event.target.value)} />
                                    {noticeForm.errors.title ? <p className="text-sm text-red-500">{noticeForm.errors.title}</p> : null}
                                </div>
                                <div className="space-y-2">
                                    <Label>Message</Label>
                                    <Textarea rows={4} value={noticeForm.data.message} onChange={(event) => noticeForm.setData("message", event.target.value)} />
                                    {noticeForm.errors.message ? <p className="text-sm text-red-500">{noticeForm.errors.message}</p> : null}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select value={noticeForm.data.priority} onValueChange={(value) => noticeForm.setData("priority", value ?? "normal")}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.notice_priorities.map((priority) => (
                                                    <SelectItem key={priority.value} value={priority.value}>
                                                        {priority.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Action URL</Label>
                                        <Input value={noticeForm.data.action_url} onChange={(event) => noticeForm.setData("action_url", event.target.value)} />
                                    </div>
                                </div>
                                <Button onClick={submitNotice} disabled={noticeForm.processing}>
                                    <Megaphone className="mr-2 h-4 w-4" />
                                    Send notice
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Create Faculty Deadline</CardTitle>
                                <CardDescription>Track an administrative or class-related task for this faculty member.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={deadlineForm.data.title} onChange={(event) => deadlineForm.setData("title", event.target.value)} />
                                    {deadlineForm.errors.title ? <p className="text-sm text-red-500">{deadlineForm.errors.title}</p> : null}
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea rows={3} value={deadlineForm.data.description} onChange={(event) => deadlineForm.setData("description", event.target.value)} />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Due date</Label>
                                        <Input type="datetime-local" value={deadlineForm.data.due_date} onChange={(event) => deadlineForm.setData("due_date", event.target.value)} />
                                        {deadlineForm.errors.due_date ? <p className="text-sm text-red-500">{deadlineForm.errors.due_date}</p> : null}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select value={deadlineForm.data.priority} onValueChange={(value) => deadlineForm.setData("priority", value ?? "medium")}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.deadline_priorities.map((priority) => (
                                                    <SelectItem key={priority.value} value={priority.value}>
                                                        {priority.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Input value={deadlineForm.data.type} onChange={(event) => deadlineForm.setData("type", event.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Related class</Label>
                                        <Select value={deadlineForm.data.class_id} onValueChange={(value) => deadlineForm.setData("class_id", value ?? "none")}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No class</SelectItem>
                                                {faculty.current_classes.map((classItem) => (
                                                    <SelectItem key={classItem.id} value={String(classItem.id)}>
                                                        {classItem.subject_code} {classItem.section}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button onClick={submitDeadline} disabled={deadlineForm.processing}>
                                    <CalendarClock className="mr-2 h-4 w-4" />
                                    Create deadline
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Open Deadlines</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                                {faculty.deadlines.length === 0 ? (
                                    <div className="text-muted-foreground rounded-md border p-4 text-sm md:col-span-2">No active deadlines.</div>
                                ) : (
                                    faculty.deadlines.map((deadline) => (
                                        <div key={deadline.id} className="rounded-md border p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="font-medium">{deadline.title}</div>
                                                <Badge variant="outline">{deadline.priority}</Badge>
                                            </div>
                                            <div className="text-muted-foreground mt-1 text-sm">{deadline.description ?? "No description"}</div>
                                            <div className="text-muted-foreground mt-2 text-xs">
                                                {deadline.due_date ?? "No due date"} {deadline.class_label ? `- ${deadline.class_label}` : ""}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="records" className="mt-4 grid gap-4 lg:grid-cols-3">
                        <RecordCard title="Biography" value={faculty.biography} />
                        <RecordCard title="Education" value={faculty.education} />
                        <RecordCard title="Courses Taught" value={faculty.courses_taught} />
                        <RecordCard title="Address" value={faculty.address_line1} />
                        <RecordCard title="Personal" value={[faculty.gender, faculty.age ? `${faculty.age} years old` : null, faculty.birth_date].filter(Boolean).join(" - ")} />
                        <RecordCard title="Department" value={faculty.department} />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}

function MetricCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: typeof BookOpen }) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <div className="bg-muted rounded-md p-2">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <div className="text-muted-foreground text-xs">{title}</div>
                    <div className="truncate font-semibold">{value}</div>
                    <div className="text-muted-foreground truncate text-xs">{detail}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
            </span>
            <span className="max-w-44 text-right font-medium">{value}</span>
        </div>
    );
}

function ClassTable({ classes, onUnassign }: { classes: ClassRow[]; onUnassign?: (classId: number) => void }) {
    if (classes.length === 0) {
        return <div className="text-muted-foreground rounded-md border p-6 text-center text-sm">No classes found.</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    {onUnassign ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
            </TableHeader>
            <TableBody>
                {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                        <TableCell className="font-medium">{classItem.subject_code}</TableCell>
                        <TableCell className="max-w-56 truncate">{classItem.subject_title ?? "No title"}</TableCell>
                        <TableCell>{classItem.section}</TableCell>
                        <TableCell>{formatSchedule(classItem.schedule)}</TableCell>
                        <TableCell className="text-right">{classItem.student_count ?? "-"}</TableCell>
                        {onUnassign ? (
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => onUnassign(classItem.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        ) : null}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function RecordCard({ title, value }: { title: string; value: string | null | undefined }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-line">{value || "No record provided."}</p>
            </CardContent>
        </Card>
    );
}
