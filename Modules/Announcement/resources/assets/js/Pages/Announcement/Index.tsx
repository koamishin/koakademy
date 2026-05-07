import AdminLayout from "@/components/administrators/admin-layout";
import { AnnouncementBanner, type AnnouncementDisplayMode, type AnnouncementPriority, type AnnouncementType } from "@/components/announcement-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/types/user";
import { useForm } from "@inertiajs/react";
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconArrowRight,
    IconBell,
    IconCalendar,
    IconCheck,
    IconClock,
    IconEdit,
    IconEye,
    IconInfoCircle,
    IconLoader2,
    IconNews,
    IconPlus,
    IconSpeakerphone,
    IconTrash,
    IconTrendingUp,
    IconUser,
    IconUsers,
    IconWorld,
    IconLock,
    IconSchool,
    IconLogin,
    IconUserPlus,
    IconLayoutDashboard,
    IconNotebook,
    IconHome,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    type: AnnouncementType;
    priority?: AnnouncementPriority;
    display_mode?: AnnouncementDisplayMode;
    requires_acknowledgment?: boolean;
    link?: string | null;
    action_label?: string | null;
    is_active: boolean;
    visibility_scope?: "global" | "authenticated_only" | "guest_only" | "role_based";
    audience_roles?: string[];
    display_locations?: string[];
    starts_at: string | null;
    ends_at: string | null;
    creator?: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface AnnouncementFormData {
    title: string;
    content: string;
    type: AnnouncementType;
    priority: AnnouncementPriority;
    display_mode: AnnouncementDisplayMode;
    requires_acknowledgment: boolean;
    link: string;
    action_label: string;
    is_active: boolean;
    visibility_scope: "global" | "authenticated_only" | "guest_only" | "role_based";
    audience_roles: string[];
    display_locations: string[];
    starts_at: string;
    ends_at: string;
}

interface AnnouncementTemplate {
    key: string;
    title: string;
    content: string;
    type: AnnouncementType;
    priority: AnnouncementPriority;
    display_mode: AnnouncementDisplayMode;
    link?: string | null;
    action_label?: string | null;
    visibility_scope: "global" | "authenticated_only" | "guest_only" | "role_based";
    audience_roles: string[];
    display_locations: string[];
}

const typeConfig = {
    info: { icon: IconInfoCircle, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", gradient: "from-blue-600 to-blue-700" },
    success: { icon: IconCheck, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", gradient: "from-emerald-600 to-emerald-700" },
    warning: { icon: IconAlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", gradient: "from-amber-500 to-amber-600" },
    danger: { icon: IconAlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", gradient: "from-red-600 to-red-700" },
    maintenance: { icon: IconLoader2, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", gradient: "from-purple-600 to-purple-700" },
    enrollment: { icon: IconCalendar, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-800", gradient: "from-cyan-600 to-cyan-700" },
    update: { icon: IconSpeakerphone, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-800", gradient: "from-indigo-600 to-indigo-700" },
};

const typeLabels: Record<string, string> = {
    info: "Info",
    success: "Success",
    warning: "Warning",
    danger: "Critical",
    maintenance: "Maintenance",
    enrollment: "Enrollment",
    update: "Update",
};

const priorityConfig = {
    urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" },
    high: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800" },
    medium: { label: "Medium", color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
    low: { label: "Low", color: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
};

const displayModeConfig = {
    banner: { label: "Banner", description: "Top of page", icon: "📋" },
    toast: { label: "Toast", description: "Bottom-right", icon: "🔔" },
    modal: { label: "Modal", description: "Center popup", icon: "💬" },
};

const visibilityConfig = {
    global: { label: "Everyone", description: "All visitors", icon: IconWorld },
    authenticated_only: { label: "Logged-in only", description: "Authenticated users", icon: IconLock },
    guest_only: { label: "Guests only", description: "Not logged in", icon: IconUser },
    role_based: { label: "Specific roles", description: "Choose roles below", icon: IconUsers },
};

const roleConfig: Record<string, { label: string; icon: typeof IconUser }> = {
    guest: { label: "Guest", icon: IconUser },
    authenticated: { label: "Any logged-in", icon: IconUsers },
    admin: { label: "Admin", icon: IconLayoutDashboard },
    student: { label: "Student", icon: IconSchool },
    faculty: { label: "Faculty", icon: IconNotebook },
};

const locationConfig: Record<string, { label: string; icon: typeof IconHome }> = {
    all: { label: "All pages", icon: IconWorld },
    login: { label: "Login", icon: IconLogin },
    signup: { label: "Signup", icon: IconUserPlus },
    enrollment: { label: "Enrollment", icon: IconNotebook },
    home: { label: "Home", icon: IconHome },
    admin_layout: { label: "Admin layout", icon: IconLayoutDashboard },
    student_layout: { label: "Student layout", icon: IconSchool },
    faculty_layout: { label: "Faculty layout", icon: IconNotebook },
};

const STEPS = [
    { id: 1, label: "Content", description: "Title, message & template" },
    { id: 2, label: "Style", description: "Type, priority & display" },
    { id: 3, label: "Targeting", description: "Who & where" },
    { id: 4, label: "Schedule", description: "Timing & publish" },
] as const;

export default function AnnouncementIndex({
    auth,
    announcements,
    templates,
    options,
}: {
    auth: { user: User };
    announcements: PaginatedData<Announcement>;
    templates: AnnouncementTemplate[];
    options: {
        visibilityScopes: Record<string, string>;
        audienceRoles: string[];
        displayLocations: string[];
    };
}) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm<AnnouncementFormData>({
        title: "",
        content: "",
        type: "info",
        priority: "medium",
        display_mode: "banner",
        requires_acknowledgment: false,
        link: "",
        action_label: "",
        is_active: true,
        visibility_scope: "global",
        audience_roles: [],
        display_locations: ["all"],
        starts_at: "",
        ends_at: "",
    });

    const stats = {
        total: announcements.data.length,
        active: announcements.data.filter((a: Announcement) => a.is_active).length,
        scheduled: announcements.data.filter((a: Announcement) => a.starts_at && new Date(a.starts_at) > new Date()).length,
        requiresAck: announcements.data.filter((a: Announcement) => a.requires_acknowledgment).length,
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        setEditingId(null);
        setCurrentStep(1);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (announcement: Announcement) => {
        clearErrors();
        setData({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type,
            priority: announcement.priority || "medium",
            display_mode: announcement.display_mode || "banner",
            requires_acknowledgment: announcement.requires_acknowledgment || false,
            link: announcement.link || "",
            action_label: announcement.action_label || "",
            is_active: announcement.is_active,
            visibility_scope: announcement.visibility_scope || "global",
            audience_roles: announcement.audience_roles || [],
            display_locations: announcement.display_locations || ["all"],
            starts_at: announcement.starts_at ? new Date(announcement.starts_at).toISOString().slice(0, 16) : "",
            ends_at: announcement.ends_at ? new Date(announcement.ends_at).toISOString().slice(0, 16) : "",
        });
        setEditingId(announcement.id);
        setCurrentStep(1);
        setIsCreateModalOpen(true);
    };

    const handlePreview = (announcement: Announcement) => {
        setPreviewAnnouncement(announcement);
        setShowPreview(true);
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this announcement?")) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            destroy(route("administrators.announcements.destroy", id) as any, {
                onSuccess: () => toast.success("Announcement deleted successfully"),
                onError: () => toast.error("Failed to delete announcement"),
            });
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editingId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            put(route("administrators.announcements.update", [editingId]) as any, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Announcement updated successfully");
                    setIsCreateModalOpen(false);
                    reset();
                },
                onError: (errors: Record<string, string>) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError || "Failed to update announcement");
                },
            });
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            post(route("administrators.announcements.store") as any, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Announcement created successfully");
                    setIsCreateModalOpen(false);
                    reset();
                },
                onError: (errors: Record<string, string>) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError || "Failed to create announcement");
                },
            });
        }
    };

    const getTypeColor = (type: string) => {
        const config = typeConfig[type as keyof typeof typeConfig];
        return config ? config.color : "text-gray-500";
    };

    const isScheduled = (startsAt: string | null): boolean => {
        return startsAt !== null && new Date(startsAt) > new Date();
    };

    const isExpired = (endsAt: string | null): boolean => {
        return endsAt !== null && new Date(endsAt) < new Date();
    };

    const applyTemplate = (templateKey: string) => {
        const template = templates.find((item) => item.key === templateKey);
        if (!template) {
            return;
        }

        setData((current) => ({
            ...current,
            title: template.title,
            content: template.content,
            type: template.type,
            priority: template.priority,
            display_mode: template.display_mode,
            link: template.link || "",
            action_label: template.action_label || "",
            visibility_scope: template.visibility_scope,
            audience_roles: template.audience_roles,
            display_locations: template.display_locations,
        }));
        setCurrentStep(2);
    };

    const toggleRole = (role: string, checked: boolean) => {
        const roles = new Set(data.audience_roles);
        if (checked) {
            roles.add(role);
        } else {
            roles.delete(role);
        }
        setData("audience_roles", Array.from(roles));
    };

    const toggleLocation = (location: string, checked: boolean) => {
        const locations = new Set(data.display_locations);
        if (checked) {
            locations.add(location);
        } else {
            locations.delete(location);
        }
        setData("display_locations", Array.from(locations));
    };

    const canProceed = (): boolean => {
        if (currentStep === 1) {
            return data.title.trim().length > 0 && data.content.trim().length > 0;
        }
        return true;
    };

    // ─── Step 1: Content ────────────────────────────────────────────────────
    const renderStep1 = () => (
        <div className="space-y-5">
            {/* Template picker */}
            {!editingId && templates.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Start from a template</Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {templates.map((template) => {
                            const tc = typeConfig[template.type as keyof typeof typeConfig];
                            const Icon = tc?.icon || IconInfoCircle;

                            return (
                                <button
                                    key={template.key}
                                    type="button"
                                    onClick={() => applyTemplate(template.key)}
                                    className="hover:bg-muted/80 flex items-start gap-3 rounded-lg border p-3 text-left transition-colors"
                                >
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tc?.bg || "bg-gray-50"}`}>
                                        <Icon className={`h-4 w-4 ${tc?.color || "text-gray-500"}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-foreground text-sm font-medium">{template.title}</p>
                                        <p className="text-muted-foreground line-clamp-1 text-xs">{template.content}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background text-muted-foreground px-2">or write your own</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData("title", e.target.value)}
                    placeholder="e.g. Enrollment Period Now Open"
                    className="text-base"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium">
                    Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="content"
                    value={data.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData("content", e.target.value)}
                    placeholder="Write your announcement message here..."
                    rows={4}
                    className="text-base"
                />
                <div className="flex justify-between">
                    <p className="text-muted-foreground text-xs">{data.content.length}/500 characters</p>
                    {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="link" className="text-sm font-medium">
                        Link <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input
                        id="link"
                        value={data.link}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData("link", e.target.value)}
                        placeholder="/enrollment or https://example.com/details"
                    />
                    {errors.link && <p className="text-sm text-red-500">{errors.link}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="action_label" className="text-sm font-medium">
                        Action button text <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input
                        id="action_label"
                        value={data.action_label}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData("action_label", e.target.value)}
                        placeholder="Enroll now"
                        disabled={!data.link.trim()}
                    />
                    <p className="text-muted-foreground text-[11px]">Shown only when a link is set.</p>
                    {errors.action_label && <p className="text-sm text-red-500">{errors.action_label}</p>}
                </div>
            </div>
        </div>
    );

    // ─── Step 2: Style ──────────────────────────────────────────────────────
    const renderStep2 = () => (
        <div className="space-y-6">
            {/* Type selector */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(typeConfig).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const isSelected = data.type === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setData("type", key as AnnouncementType)}
                                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                                    isSelected
                                        ? `${cfg.border} ${cfg.bg} ring-2 ring-offset-1 ring-blue-500`
                                        : "border-border hover:border-muted-foreground/30"
                                }`}
                            >
                                <Icon className={`h-5 w-5 ${cfg.color}`} />
                                <span className="text-xs font-medium">{typeLabels[key]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Priority selector */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(priorityConfig).map(([key, cfg]) => {
                        const isSelected = data.priority === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setData("priority", key as AnnouncementPriority)}
                                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                                    isSelected
                                        ? cfg.color + " ring-2 ring-offset-1 ring-blue-500"
                                        : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
                                }`}
                            >
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Display mode selector */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Display Mode</Label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(displayModeConfig).map(([key, cfg]) => {
                        const isSelected = data.display_mode === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setData("display_mode", key as AnnouncementDisplayMode)}
                                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                                    isSelected
                                        ? "border-blue-300 bg-blue-50 ring-2 ring-offset-1 ring-blue-500 dark:border-blue-700 dark:bg-blue-950/30"
                                        : "border-border hover:border-muted-foreground/30"
                                }`}
                            >
                                <span className="text-xl">{cfg.icon}</span>
                                <span className="text-xs font-semibold">{cfg.label}</span>
                                <span className="text-muted-foreground text-[10px]">{cfg.description}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Acknowledgment toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                    <p className="text-sm font-medium">Require acknowledgment</p>
                    <p className="text-muted-foreground text-xs">Users must confirm they have read this announcement</p>
                </div>
                <button
                    type="button"
                    onClick={() => setData("requires_acknowledgment", !data.requires_acknowledgment)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                        data.requires_acknowledgment ? "border-blue-600 bg-blue-600" : "border-border bg-background"
                    }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            data.requires_acknowledgment ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                </button>
            </div>
        </div>
    );

    // ─── Step 3: Targeting ──────────────────────────────────────────────────
    const renderStep3 = () => (
        <div className="space-y-6">
            {/* Visibility scope */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Who should see this?</Label>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(visibilityConfig).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const isSelected = data.visibility_scope === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setData("visibility_scope", key as AnnouncementFormData["visibility_scope"]);
                                    if (key !== "role_based") {
                                        setData("audience_roles", []);
                                    }
                                }}
                                className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                                    isSelected
                                        ? "border-blue-300 bg-blue-50 ring-2 ring-offset-1 ring-blue-500 dark:border-blue-700 dark:bg-blue-950/30"
                                        : "border-border hover:border-muted-foreground/30"
                                }`}
                            >
                                <Icon className={`h-5 w-5 shrink-0 ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                                <div className="min-w-0">
                                    <p className={`text-sm font-medium ${isSelected ? "text-blue-700 dark:text-blue-300" : ""}`}>{cfg.label}</p>
                                    <p className="text-muted-foreground text-xs">{cfg.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Audience roles (only when role_based) */}
            {data.visibility_scope === "role_based" && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                >
                    <Label className="text-sm font-medium">Select roles</Label>
                    <div className="flex flex-wrap gap-2">
                        {options.audienceRoles.map((role) => {
                            const cfg = roleConfig[role];
                            const Icon = cfg?.icon || IconUser;
                            const isSelected = data.audience_roles.includes(role);

                            return (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRole(role, !isSelected)}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                                        isSelected
                                            ? "border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                                            : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {cfg?.label || role}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Display locations */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Where should this appear?</Label>
                <div className="flex flex-wrap gap-2">
                    {options.displayLocations.map((location) => {
                        const cfg = locationConfig[location];
                        const Icon = cfg?.icon || IconHome;
                        const isSelected = data.display_locations.includes(location);

                        return (
                            <button
                                key={location}
                                type="button"
                                onClick={() => toggleLocation(location, !isSelected)}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                                    isSelected
                                        ? "border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {cfg?.label || location.replace(/_/g, " ")}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    // ─── Step 4: Schedule ───────────────────────────────────────────────────
    const renderStep4 = () => (
        <div className="space-y-6">
            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <p className="text-sm font-medium">Publish immediately</p>
                    <p className="text-muted-foreground text-xs">Turn off to save as draft</p>
                </div>
                <button
                    type="button"
                    onClick={() => setData("is_active", !data.is_active)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                        data.is_active ? "border-emerald-600 bg-emerald-600" : "border-border bg-background"
                    }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            data.is_active ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                </button>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="starts_at" className="text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                            <IconClock className="h-3.5 w-3.5" />
                            Start time
                        </span>
                    </Label>
                    <Input
                        id="starts_at"
                        type="datetime-local"
                        value={data.starts_at}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData("starts_at", e.target.value)}
                    />
                    <p className="text-muted-foreground text-[11px]">Leave empty to start immediately</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ends_at" className="text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                            <IconCalendar className="h-3.5 w-3.5" />
                            End time
                        </span>
                    </Label>
                    <Input
                        id="ends_at"
                        type="datetime-local"
                        value={data.ends_at}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData("ends_at", e.target.value)}
                    />
                    <p className="text-muted-foreground text-[11px]">Leave empty for no expiration</p>
                </div>
            </div>

            {/* Live preview */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">
                    <span className="flex items-center gap-1.5">
                        <IconEye className="h-3.5 w-3.5" />
                        Preview
                    </span>
                </Label>
                <div className="rounded-lg border bg-muted/30 p-4">
                    {data.title ? (
                        <AnnouncementBanner
                            announcements={[
                                {
                                    id: 0,
                                    title: data.title,
                                    content: data.content,
                                    type: data.type,
                                    priority: data.priority,
                                    display_mode: data.display_mode,
                                    requires_acknowledgment: data.requires_acknowledgment,
                                    link: data.link || null,
                                    action_label: data.action_label || null,
                                    is_active: true,
                                    starts_at: data.starts_at || null,
                                    ends_at: data.ends_at || null,
                                },
                            ]}
                            displayMode={data.display_mode}
                        />
                    ) : (
                        <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
                            <IconNews className="mr-2 h-4 w-4" />
                            Fill in the title to see a preview
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout user={auth.user} title="Announcements">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
                        <p className="text-muted-foreground">Manage and broadcast announcements to all users</p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <IconPlus className="mr-2 size-4" />
                        Create Announcement
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
                            <IconNews className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-muted-foreground text-xs">All time</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                            <IconBell className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                            <p className="text-muted-foreground text-xs">Currently displayed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                            <IconClock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.scheduled}</div>
                            <p className="text-muted-foreground text-xs">Upcoming</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Require Ack.</CardTitle>
                            <IconCheck className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.requiresAck}</div>
                            <p className="text-muted-foreground text-xs">Must be acknowledged</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="all" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                        <TabsTrigger value="expired">Expired</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                        <AnnouncementTable
                            announcements={announcements.data}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onPreview={handlePreview}
                            getTypeColor={getTypeColor}
                            isScheduled={isScheduled}
                            isExpired={isExpired}
                        />
                    </TabsContent>
                    <TabsContent value="active" className="space-y-4">
                        <AnnouncementTable
                            announcements={announcements.data.filter(
                                (a: Announcement) => a.is_active && !isScheduled(a.starts_at) && !isExpired(a.ends_at),
                            )}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onPreview={handlePreview}
                            getTypeColor={getTypeColor}
                            isScheduled={isScheduled}
                            isExpired={isExpired}
                        />
                    </TabsContent>
                    <TabsContent value="scheduled" className="space-y-4">
                        <AnnouncementTable
                            announcements={announcements.data.filter((a: Announcement) => isScheduled(a.starts_at))}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onPreview={handlePreview}
                            getTypeColor={getTypeColor}
                            isScheduled={isScheduled}
                            isExpired={isExpired}
                        />
                    </TabsContent>
                    <TabsContent value="expired" className="space-y-4">
                        <AnnouncementTable
                            announcements={announcements.data.filter(
                                (a: Announcement) => isExpired(a.ends_at) || (!a.is_active && !isScheduled(a.starts_at)),
                            )}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onPreview={handlePreview}
                            getTypeColor={getTypeColor}
                            isScheduled={isScheduled}
                            isExpired={isExpired}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* ─── Redesigned Step-Based Modal ────────────────────────────────── */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-[720px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Update the details of this announcement." : "Create a new announcement to broadcast to users."}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step indicator */}
                    <div className="flex items-center gap-1 border-b pb-4">
                        {STEPS.map((step, idx) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex items-center gap-1">
                                    {idx > 0 && (
                                        <div
                                            className={`h-0.5 w-6 transition-colors ${
                                                isCompleted ? "bg-blue-600" : "bg-border"
                                            }`}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                            isActive
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                                : isCompleted
                                                  ? "text-emerald-600 dark:text-emerald-400"
                                                  : "text-muted-foreground"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                isCompleted
                                                    ? "bg-emerald-600 text-white"
                                                    : isActive
                                                      ? "bg-blue-600 text-white"
                                                      : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {isCompleted ? "✓" : step.id}
                                        </span>
                                        <span className="hidden sm:inline">{step.label}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Error summary */}
                    {Object.keys(errors).length > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
                            <p className="text-sm font-medium text-red-600">Please fix the following errors:</p>
                            <ul className="mt-1 list-inside list-disc text-sm text-red-600">
                                {Object.entries(errors).map(([field, message]) => (
                                    <li key={field}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.15 }}
                                className="min-h-[320px] py-2"
                            >
                                {currentStep === 1 && renderStep1()}
                                {currentStep === 2 && renderStep2()}
                                {currentStep === 3 && renderStep3()}
                                {currentStep === 4 && renderStep4()}
                            </motion.div>
                        </AnimatePresence>
                    </form>

                    <DialogFooter className="flex items-center justify-between border-t pt-4">
                        <div>
                            {currentStep > 1 && (
                                <Button type="button" variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>
                                    <IconArrowLeft className="mr-1 h-4 w-4" />
                                    Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            {currentStep < 4 ? (
                                <Button type="button" onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
                                    Next
                                    <IconArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={processing} onClick={handleSubmit}>
                                    {processing ? (
                                        <>
                                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : editingId ? (
                                        "Update Announcement"
                                    ) : (
                                        "Create Announcement"
                                    )}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Preview Announcement</DialogTitle>
                        <DialogDescription>This is how your announcement will appear to users</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {previewAnnouncement && (
                            <div className="rounded-lg border p-4">
                                <AnnouncementBanner
                                    announcements={[{ ...previewAnnouncement, is_active: true }]}
                                    displayMode={previewAnnouncement.display_mode || "banner"}
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPreview(false)}>
                            Close Preview
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

function AnnouncementTable({
    announcements,
    onEdit,
    onDelete,
    onPreview,
    getTypeColor,
    isScheduled,
    isExpired,
}: {
    announcements: Announcement[];
    onEdit: (announcement: Announcement) => void;
    onDelete: (id: number) => void;
    onPreview: (announcement: Announcement) => void;
    getTypeColor: (type: string) => string;
    isScheduled: (startsAt: string | null) => boolean;
    isExpired: (endsAt: string | null) => boolean;
}) {
    if (announcements.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <IconNews className="text-muted-foreground mb-4 size-12 opacity-50" />
                    <p className="text-muted-foreground">No announcements found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4">
            {announcements.map((announcement) => {
                const TypeIcon = typeConfig[announcement.type as keyof typeof typeConfig]?.icon || IconInfoCircle;
                const scheduled = isScheduled(announcement.starts_at);
                const expired = isExpired(announcement.ends_at);

                return (
                    <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                                    typeConfig[announcement.type as keyof typeof typeConfig]?.bg || "bg-gray-50"
                                }`}
                            >
                                <TypeIcon className={`h-6 w-6 ${getTypeColor(announcement.type) || "text-gray-500"}`} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold">{announcement.title}</h3>
                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{announcement.content}</p>
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        {announcement.priority === "urgent" && (
                                            <Badge variant="outline" className="border-red-500 bg-red-50 text-red-600 dark:bg-red-950/30">
                                                Urgent
                                            </Badge>
                                        )}
                                        {announcement.requires_acknowledgment && (
                                            <Badge variant="outline" className="border-purple-500 bg-purple-50 text-purple-600 dark:bg-purple-950/30">
                                                Requires Ack.
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1">
                                        <IconBell className="h-3 w-3" />
                                        {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <IconTrendingUp className="h-3 w-3" />
                                        {announcement.priority?.charAt(0).toUpperCase() + (announcement.priority?.slice(1) || "Medium")}
                                    </span>
                                    {scheduled ? (
                                        <span className="flex items-center gap-1 text-blue-600">
                                            <IconClock className="h-3 w-3" />
                                            Starts: {format(new Date(announcement.starts_at!), "MMM d, yyyy h:mm a")}
                                        </span>
                                    ) : expired ? (
                                        <span className="flex items-center gap-1 text-red-600">
                                            <IconClock className="h-3 w-3" />
                                            Expired
                                        </span>
                                    ) : announcement.is_active ? (
                                        <span className="flex items-center gap-1 text-green-600">
                                            <IconCheck className="h-3 w-3" />
                                            Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <IconClock className="h-3 w-3" />
                                            Inactive
                                        </span>
                                    )}
                                    {announcement.starts_at || announcement.ends_at ? (
                                        <span className="flex items-center gap-1">
                                            <IconCalendar className="h-3 w-3" />
                                            {announcement.starts_at ? format(new Date(announcement.starts_at), "MMM d") : "Now"} -{" "}
                                            {announcement.ends_at ? format(new Date(announcement.ends_at), "MMM d") : "Forever"}
                                        </span>
                                    ) : null}
                                    <span className="text-muted-foreground">By {announcement.creator?.name || "System"}</span>
                                </div>
                            </div>

                            <div className="flex shrink-0 gap-1">
                                <Button variant="ghost" size="icon" onClick={() => onPreview(announcement)} className="h-8 w-8">
                                    <IconEye className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onEdit(announcement)} className="h-8 w-8">
                                    <IconEdit className="size-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(announcement.id)}
                                    className="text-destructive hover:text-destructive h-8 w-8"
                                >
                                    <IconTrash className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
