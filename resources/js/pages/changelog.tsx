import AdminLayout from "@/components/administrators/admin-layout";
import PortalLayout from "@/components/portal-layout";
import {
    Timeline,
    TimelineContent,
    TimelineDate,
    TimelineHeader,
    TimelineIndicator,
    TimelineItem,
    TimelineSeparator,
    TimelineTitle,
} from "@/components/reui/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import { ChangelogEntry, VersionInfo } from "@/types/version";
import { Head } from "@inertiajs/react";
import {
    IconAlertCircle,
    IconBug,
    IconCalendar,
    IconCheck,
    IconChevronRight,
    IconClock,
    IconExternalLink,
    IconGitBranch,
    IconRocket,
    IconSearch,
    IconSparkles,
    IconTools,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";

interface ChangelogProps {
    user: User;
    layout?: "admin" | "portal";
    version: string;
    versionInfo?: VersionInfo;
    changelog: ChangelogEntry[];
    github_repo?: string;
}

type FilterType = "all" | "feature" | "fix" | "improvement" | "breaking" | "security";

const typeConfig = {
    feature: { label: "Feature", icon: IconRocket, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    fix: { label: "Fix", icon: IconBug, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
    improvement: { label: "Improvement", icon: IconSparkles, color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
    breaking: { label: "Breaking", icon: IconAlertCircle, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    security: { label: "Security", icon: IconTools, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
};

const versionTypeConfig = {
    major: { label: "Major", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
    minor: { label: "Minor", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
    patch: { label: "Patch", color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400" },
} as const;

export default function Changelog({ user, layout = "portal", version, versionInfo, changelog, github_repo }: ChangelogProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");

    const currentVersion = versionInfo?.version || version;
    const currentEntry = changelog.find((entry) => entry.version === currentVersion) ?? changelog[0];
    const releaseType = versionInfo?.release_type ?? currentEntry?.type ?? "patch";
    const releaseDate = versionInfo?.timestamp ?? currentEntry?.date ?? null;
    const githubReleasesUrl = `https://github.com/${github_repo || "dccp-developers/DccpAdminV3"}/releases`;

    const filteredChangelog = useMemo(() => {
        return changelog.filter((entry) => {
            const matchesSearch =
                searchQuery === "" ||
                entry.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.changes.some((change) => change.description.toLowerCase().includes(searchQuery.toLowerCase()));

            if (activeFilter === "all") return matchesSearch;

            return matchesSearch && entry.changes.some((change) => change.type === activeFilter);
        });
    }, [changelog, searchQuery, activeFilter]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatTimestamp = (timestamp: string | null) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return null;

        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const content = (
        <>
            <Head title="Changelog" />
            <main className={cn("flex flex-1 flex-col gap-6", layout === "portal" && "p-4 sm:px-6 sm:py-0")}>
                <div className="flex flex-col gap-4 border-b pb-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <h1 className="text-foreground text-2xl font-semibold tracking-tight">Changelog</h1>
                            <p className="text-muted-foreground text-sm">Release notes, fixes, and deployed build details.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            {versionInfo?.is_latest && (
                                <Badge
                                    variant="outline"
                                    className="border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                                >
                                    <IconCheck className="mr-1 size-3" />
                                    Latest
                                </Badge>
                            )}
                            <Badge variant="secondary" className="font-mono text-sm">
                                v{currentVersion}
                            </Badge>
                            <Badge className={cn("text-xs", versionTypeConfig[releaseType]?.color)}>
                                {versionTypeConfig[releaseType]?.label ?? releaseType}
                            </Badge>
                            {releaseDate && (
                                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                                    <IconClock className="size-4" />
                                    {formatTimestamp(versionInfo?.timestamp ?? null) ?? formatDate(releaseDate)}
                                </span>
                            )}
                            {versionInfo?.build_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={versionInfo.build_url} target="_blank" rel="noopener noreferrer">
                                        <IconGitBranch className="size-4" />
                                        Build
                                    </a>
                                </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                                <a href={githubReleasesUrl} target="_blank" rel="noopener noreferrer">
                                    <IconExternalLink className="size-4" />
                                    GitHub
                                </a>
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
                            <TabsList className="h-9">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="feature">Features</TabsTrigger>
                                <TabsTrigger value="fix">Fixes</TabsTrigger>
                                <TabsTrigger value="improvement">Improvements</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full sm:w-72">
                            <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                placeholder="Search releases"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="h-9 pl-9"
                            />
                        </div>
                    </div>
                </div>

                {filteredChangelog.length === 0 ? (
                    <div className="border-border bg-muted/20 flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
                        <IconCalendar className="text-muted-foreground/60 mb-3 size-9" />
                        <p className="text-foreground font-medium">No matching releases</p>
                        <p className="text-muted-foreground mt-1 max-w-md text-sm">
                            Current version v{currentVersion} is available. Clear the search or change the filter to view its release details.
                        </p>
                    </div>
                ) : (
                    <Timeline defaultValue={filteredChangelog.length} className="max-w-5xl">
                        {filteredChangelog.map((entry, index) => {
                            const isCurrentVersion = entry.version === currentVersion;
                            const visibleChanges = entry.changes.filter((change) => activeFilter === "all" || change.type === activeFilter);

                            return (
                                <TimelineItem key={entry.version} step={index + 1} className="pb-8">
                                    <TimelineHeader>
                                        <TimelineSeparator className="bg-border" />
                                        <TimelineIndicator
                                            className={cn(
                                                "border-border bg-background",
                                                isCurrentVersion && "border-primary bg-primary shadow-primary/30 shadow-sm",
                                            )}
                                        />
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0 space-y-1">
                                                <TimelineTitle className="flex flex-wrap items-center gap-2 text-base">
                                                    <span className="font-mono">v{entry.version}</span>
                                                    {isCurrentVersion && (
                                                        <Badge variant="default" className="text-xs">
                                                            Current
                                                        </Badge>
                                                    )}
                                                    <Badge className={cn("text-xs", versionTypeConfig[entry.type]?.color)}>
                                                        {versionTypeConfig[entry.type]?.label ?? entry.type}
                                                    </Badge>
                                                </TimelineTitle>
                                                <TimelineDate dateTime={entry.date}>{formatDate(entry.date)}</TimelineDate>
                                            </div>

                                            {entry.github_url && (
                                                <Button variant="ghost" size="sm" asChild className="h-8 justify-start px-2 sm:justify-center">
                                                    <a href={entry.github_url} target="_blank" rel="noopener noreferrer">
                                                        Release
                                                        <IconExternalLink className="size-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </TimelineHeader>

                                    <TimelineContent className="pt-2 text-sm">
                                        {visibleChanges.length > 0 ? (
                                            <ul className="divide-border rounded-md border">
                                                {visibleChanges.map((change, changeIndex) => {
                                                    const config = typeConfig[change.type] ?? typeConfig.improvement;
                                                    const Icon = config.icon;

                                                    return (
                                                        <li key={changeIndex} className="flex gap-3 border-b px-3 py-3 last:border-b-0">
                                                            <span
                                                                className={cn(
                                                                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md",
                                                                    config.color,
                                                                )}
                                                            >
                                                                <Icon className="size-3.5" />
                                                            </span>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-foreground text-xs font-medium">{config.label}</span>
                                                                    <IconChevronRight className="text-muted-foreground size-3" />
                                                                </div>
                                                                <p className="text-foreground/90 mt-1 leading-relaxed">{change.description}</p>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <div className="border-border bg-muted/20 rounded-md border px-3 py-3 text-sm">
                                                Release notes are not available for this version yet.
                                            </div>
                                        )}
                                    </TimelineContent>
                                </TimelineItem>
                            );
                        })}
                    </Timeline>
                )}
            </main>
        </>
    );

    if (layout === "admin") {
        return (
            <AdminLayout user={user} title="Changelog">
                {content}
            </AdminLayout>
        );
    }

    return (
        <PortalLayout
            user={{
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            }}
        >
            {content}
        </PortalLayout>
    );
}
