import { GlobalCommandContent } from "@/components/global-command-palette";
import { Command } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { Link, usePage } from "@inertiajs/react";
import {
    IconCalendar,
    IconChecklist,
    IconHome,
    IconSchool,
    IconSpeakerphone,
} from "@tabler/icons-react";
import { getFacultyPortalNavigation, type FacultyPortalClass } from "@/components/faculty/faculty-navigation";
import { motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";

interface FacultyBottomNavPageProps {
    auth?: {
        user?: User | null;
    };
    featureFlags?: {
        enabledRoutes?: Record<string, boolean>;
    };
    facultyClasses?: FacultyPortalClass[];
}

/**
 * Ordered so Dashboard sits at index 2 (visual center of five items).
 * Left pair: Action Center, Classes · Center: Home · Right pair: Schedule, News
 */
const MOBILE_NAV_ORDER = [
    { id: "action-center", label: "Actions", icon: IconChecklist, url: "/faculty/action-center" },
    { id: "classes", label: "Classes", icon: IconSchool, url: "/faculty/classes" },
    { id: "dashboard", label: "Home", icon: IconHome, url: "/faculty/dashboard" },
    { id: "schedule", label: "Schedule", icon: IconCalendar, url: "/faculty/schedule" },
    { id: "announcements", label: "News", icon: IconSpeakerphone, url: "/faculty/announcements" },
] as const;

export function FacultyBottomNav() {
    const { url, props } = usePage<FacultyBottomNavPageProps>();
    const [searchOpen, setSearchOpen] = useState(false);
    const resolvedUser = props.auth?.user;
    const enabledRoutes = props.featureFlags?.enabledRoutes ?? {};
    const facultyClasses = props.facultyClasses ?? [];

    const canonicalNav = useMemo(() => getFacultyPortalNavigation(enabledRoutes, facultyClasses), [enabledRoutes, facultyClasses]);
    const disabledMap = useMemo(() => {
        const map: Record<string, { disabled: boolean; tooltip?: string }> = {};

        canonicalNav.forEach((item) => {
            if (item.id) {
                map[item.id] = { disabled: !!item.disabled, tooltip: item.disabledTooltip };
            }
        });

        return map;
    }, [canonicalNav]);

    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

    const isActive = (href: string): boolean => url === href || url.startsWith(`${href}/`);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    }, []);

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            if (!touchStart.current) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStart.current.x;
            const dy = touchStart.current.y - t.clientY;
            const dt = Date.now() - touchStart.current.time;
            if (dy > 40 && Math.abs(dx) < 60 && dt < 400 && resolvedUser) {
                setSearchOpen(true);
            }
            touchStart.current = null;
        },
        [resolvedUser],
    );

    return (
        <nav className="fixed right-0 bottom-0 left-0 z-50 md:hidden">
            {/* Search drawer — opens on swipe-up */}
            <Drawer open={searchOpen} onOpenChange={setSearchOpen}>
                {resolvedUser ? (
                    <DrawerContent className="z-[100] h-[85vh] max-h-[85vh] rounded-t-[2rem] px-0 pt-0 outline-none">
                        <DrawerTitle className="sr-only">Search faculty portal</DrawerTitle>
                        <DrawerDescription className="sr-only">
                            Search classes, students, schedules, and faculty tools.
                        </DrawerDescription>
                        <div className="flex h-full flex-1 overflow-hidden p-2">
                            <Command className="h-full flex-1 border-none bg-transparent" shouldFilter={false}>
                                <GlobalCommandContent
                                    user={resolvedUser}
                                    isOpen={searchOpen}
                                    onSelect={() => setSearchOpen(false)}
                                    searchPlaceholder="Search classes, students, schedules…"
                                    listClassName="h-full max-h-none"
                                />
                            </Command>
                        </div>
                    </DrawerContent>
                ) : null}

                {/* ── Bottom bar ── */}
                <div
                    className="border-border/50 bg-background/90 border-t shadow-[0_-8px_28px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div
                        className="mx-auto grid max-w-md grid-cols-5 items-center gap-1 px-2 pt-1.5"
                        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
                    >
                        {MOBILE_NAV_ORDER.map((item) => {
                            const active = isActive(item.url);
                            const disabledInfo = disabledMap[item.id];
                            const disabled = disabledInfo?.disabled ?? false;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.id}
                                    href={disabled ? "#" : item.url}
                                    className={cn(
                                        "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition-colors duration-200",
                                        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                        disabled && "pointer-events-none opacity-40",
                                    )}
                                    aria-disabled={disabled}
                                    title={disabled ? disabledInfo?.tooltip : item.label}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="faculty-bottom-nav-active"
                                            className="bg-primary/10 absolute inset-x-1 inset-y-0 rounded-2xl"
                                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <motion.div
                                        animate={{ scale: active ? 1.06 : 1, y: active ? -1 : 0 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="relative z-10 flex h-7 w-7 items-center justify-center"
                                    >
                                        <Icon className="size-5" stroke={active ? 2.3 : 1.7} />
                                    </motion.div>
                                    <span
                                        className={cn(
                                            "relative z-10 max-w-full truncate text-[10px] leading-none font-semibold transition-colors",
                                            active ? "text-primary" : "text-muted-foreground/75",
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </Drawer>
        </nav>
    );
}
