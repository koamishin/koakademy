import PortalLayout from "@/components/portal-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@/types/user";
import { Head } from "@inertiajs/react";
import { IconAlertTriangle, IconBell, IconCalendar, IconCheck, IconInfoCircle, IconLoader2, IconSpeakerphone } from "@tabler/icons-react";
import { Megaphone } from "lucide-react";

interface Announcement {
    id: number;
    title: string;
    content: string;
    type: "info" | "success" | "warning" | "danger" | "maintenance" | "enrollment" | "update";
    priority: string;
    date: string;
    is_read: boolean;
}

interface AnnouncementsIndexProps {
    user: User;
    announcements: Announcement[];
}

const typeMeta = {
    info: { icon: IconInfoCircle, accent: "bg-primary", tone: "text-primary bg-primary/10", badge: null },
    success: { icon: IconCheck, accent: "bg-emerald-500", tone: "text-emerald-500 bg-emerald-500/10", badge: null },
    warning: { icon: IconAlertTriangle, accent: "bg-amber-500", tone: "text-amber-500 bg-amber-500/10", badge: "Warning" },
    danger: { icon: IconAlertTriangle, accent: "bg-destructive", tone: "text-destructive bg-destructive/10", badge: "Critical" },
    maintenance: { icon: IconLoader2, accent: "bg-purple-500", tone: "text-purple-500 bg-purple-500/10", badge: "Maintenance" },
    enrollment: { icon: IconCalendar, accent: "bg-cyan-500", tone: "text-cyan-500 bg-cyan-500/10", badge: "Enrollment" },
    update: { icon: IconSpeakerphone, accent: "bg-indigo-500", tone: "text-indigo-500 bg-indigo-500/10", badge: null },
} as const;

const dashboardCardClass =
    "border-border/40 bg-card/60 rounded-xl shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-md";
const dashboardPanelClass = "border-border/40 bg-card/60 rounded-xl shadow-sm backdrop-blur-sm";

export default function PublicAnnouncementIndex({ user, announcements }: AnnouncementsIndexProps) {
    return (
        <PortalLayout user={user}>
            <Head title="Announcements" />

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 pb-16 md:gap-6 md:p-6">
                <Card className={`${dashboardPanelClass} overflow-hidden`}>
                    <div className="from-primary/5 via-transparent absolute inset-0 bg-gradient-to-br to-transparent" />
                    <CardContent className="relative flex flex-col justify-between gap-5 p-5 md:flex-row md:items-end md:p-6">
                        <div className="space-y-3">
                            <div className="text-primary flex items-center gap-2 font-bold">
                                <div className="bg-primary/10 rounded-lg p-1.5">
                                    <Megaphone className="h-4 w-4" />
                                </div>
                                <span className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">Student Updates</span>
                            </div>
                            <div>
                                <h1 className="text-foreground text-3xl font-extrabold tracking-tight md:text-4xl">Announcements</h1>
                                <p className="text-muted-foreground mt-1.5 max-w-xl text-sm leading-relaxed">
                                    Stay updated with the latest news and important notices for your academic period.
                                </p>
                            </div>
                        </div>
                        <div className="group relative overflow-hidden rounded-xl border border-border/40 bg-background/40 px-6 py-4 transition-all duration-300 hover:border-primary/30">
                            <div className="absolute top-0 right-0 h-1 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
                            <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">Visible Notices</p>
                            <p className="text-foreground mt-1 text-3xl font-extrabold tabular-nums tracking-tight">{announcements.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6">
                    {announcements.length === 0 ? (
                        <Card className={`${dashboardPanelClass} mt-6 overflow-hidden border-dashed`}>
                            <CardContent className="relative flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
                                <div className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none overflow-hidden">
                                    <IconBell className="absolute -top-12 -right-12 size-64 rotate-12" />
                                    <IconBell className="absolute -bottom-12 -left-12 size-64 -rotate-12" />
                                </div>
                                
                                <div className="bg-primary/10 text-primary relative mb-6 rounded-2xl p-6 ring-8 ring-primary/5">
                                    <IconBell className="size-12" />
                                </div>
                                
                                <h3 className="text-foreground text-xl font-bold tracking-tight">No announcements found</h3>
                                <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
                                    New notices and school updates will appear here once they are published.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        announcements.map((announcement) => {
                            const meta = typeMeta[announcement.type] ?? typeMeta.info;
                            const Icon = meta.icon;

                            return (
                                <Card key={announcement.id} className={`${dashboardCardClass} group relative overflow-hidden hover:-translate-y-1`}>
                                    <div className="from-primary/5 via-transparent absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    <Icon className="text-primary pointer-events-none absolute top-6 right-8 size-24 opacity-[0.05] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.08]" />
                                    <div className={`absolute inset-y-0 left-0 w-1 ${meta.accent} opacity-70 transition-all duration-300 group-hover:w-1.5 group-hover:opacity-100`} />
                                    
                                    <CardContent className="relative p-6 pr-24 pl-8 md:p-8 md:pr-32 md:pl-10">
                                        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-5">
                                                <div className={`mt-1 shrink-0 rounded-xl p-3 shadow-sm ring-4 ring-white/5 ${meta.tone}`}>
                                                    <Icon className="size-6" />
                                                </div>
                                                <div className="min-w-0 space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-2.5">
                                                        <h3 className="text-foreground text-xl font-bold tracking-tight group-hover:text-primary transition-colors md:text-2xl">{announcement.title}</h3>
                                                        {meta.badge ? (
                                                            <Badge variant="secondary" className="bg-background/50 px-2 py-0 text-[10px] font-black uppercase tracking-widest ring-1 ring-border/50">
                                                                {meta.badge}
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <div className="text-muted-foreground/70 flex items-center gap-1.5 text-xs font-medium">
                                                        <IconCalendar className="size-4 opacity-70" />
                                                        <span className="tracking-tight">{announcement.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <p className="text-muted-foreground/90 text-sm leading-relaxed whitespace-pre-wrap md:text-base">{announcement.content}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </PortalLayout>
    );
}
