import { GlobalCommandContent } from "@/components/global-command-palette";
import { getStudentPortalNavigation, type StudentPortalClass } from "@/components/student/student-navigation";
import { Command } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { Link, usePage } from "@inertiajs/react";
import { IconCalendar, IconDashboard, IconReceipt, IconSchool, IconSpeakerphone } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";

interface StudentBottomNavPageProps {
    auth?: {
        user?: User | null;
    };
    featureFlags?: {
        enabledRoutes?: Record<string, boolean>;
    };
    studentClasses?: StudentPortalClass[];
}

/**
 * Ordered so Dashboard sits at index 2 (visual center of five items).
 * Left pair: Academics, Schedule · Center: Home · Right pair: Tuition, News
 */
const MOBILE_NAV_ORDER = [
    { id: "classes", label: "Classes", icon: IconSchool, url: "/student/classes" },
    { id: "schedule", label: "Schedule", icon: IconCalendar, url: "/student/schedule" },
    { id: "dashboard", label: "Home", icon: IconDashboard, url: "/student/dashboard", center: true },
    { id: "tuition", label: "Tuition", icon: IconReceipt, url: "/student/tuition" },
    { id: "announcements", label: "News", icon: IconSpeakerphone, url: "/student/announcements" },
] as const;

export function StudentBottomNav() {
    const { url, props } = usePage<StudentBottomNavPageProps>();
    const [searchOpen, setSearchOpen] = useState(false);
    const resolvedUser = props.auth?.user;
    const enabledRoutes = props.featureFlags?.enabledRoutes ?? {};
    const studentClasses = props.studentClasses ?? [];

    // We still call the canonical navigation to read disabled / feature-flag state
    const canonicalNav = useMemo(() => getStudentPortalNavigation(enabledRoutes, studentClasses), [enabledRoutes, studentClasses]);
    const disabledMap = useMemo(() => {
        const m: Record<string, { disabled: boolean; tooltip?: string }> = {};
        canonicalNav.forEach((item) => {
            m[item.id] = { disabled: !!item.disabled, tooltip: item.disabledTooltip };
        });
        return m;
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
                        <DrawerTitle className="sr-only">Search your academics</DrawerTitle>
                        <DrawerDescription className="sr-only">
                            Find enrolled classes, subjects, courses, and student enrollment records.
                        </DrawerDescription>
                        <div className="flex h-full flex-1 overflow-hidden p-2">
                            <Command className="h-full flex-1 border-none bg-transparent" shouldFilter={false}>
                                <GlobalCommandContent
                                    user={resolvedUser}
                                    isOpen={searchOpen}
                                    onSelect={() => setSearchOpen(false)}
                                    searchPlaceholder="Search classes, subjects, courses…"
                                    listClassName="h-full max-h-none"
                                />
                            </Command>
                        </div>
                    </DrawerContent>
                ) : null}

                {/* ── Bottom bar ── */}
                <div
                    className="safe-area-inset-bottom border-border/60 bg-background/92 border-t shadow-[0_-16px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Swipe-up grab handle */}
                    {resolvedUser ? (
                        <div className="pointer-events-none flex items-center justify-center pt-1.5 select-none">
                            <span className="bg-muted-foreground/20 block h-[3px] w-8 rounded-full" />
                        </div>
                    ) : null}

                    <div className="mx-auto flex max-w-md items-end justify-around px-2 pb-2">
                        {MOBILE_NAV_ORDER.map((item) => {
                            const active = isActive(item.url);
                            const info = disabledMap[item.id];
                            const disabled = info?.disabled ?? false;
                            const Icon = item.icon;
                            const isCenter = "center" in item && item.center;

                            if (isCenter) {
                                return (
                                    <Link key={item.id} href={item.url} className="group relative -mt-7 flex flex-col items-center" aria-label="Home">
                                        {/* Outer glow ring */}
                                        <span
                                            className={cn(
                                                "absolute -inset-2.5 rounded-full opacity-0 blur-xl transition-all duration-500 group-hover:opacity-40 group-active:opacity-60",
                                                active ? "bg-primary/40 opacity-20" : "bg-primary/20",
                                            )}
                                        />

                                        {/* Button Circle */}
                                        <div
                                            className={cn(
                                                "relative flex h-13 w-13 items-center justify-center rounded-2xl border-2 transition-all duration-300 group-active:scale-90",
                                                active
                                                    ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_20px_-6px_rgba(var(--primary),0.5)]"
                                                    : "border-border/60 bg-background/95 text-foreground/60 shadow-lg",
                                            )}
                                        >
                                            <Icon className="size-6" stroke={2.2} />
                                        </div>

                                        <span
                                            className={cn(
                                                "mt-1.5 text-[10px] font-bold tracking-tight uppercase transition-colors duration-200",
                                                active ? "text-primary" : "text-foreground/60",
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.id}
                                    href={disabled ? "#" : item.url}
                                    className={cn(
                                        "relative flex w-15 flex-col items-center justify-end rounded-xl px-1 pt-2 pb-1 transition-all duration-200 group-active:scale-95",
                                        active && "bg-primary/5",
                                        disabled && "pointer-events-none opacity-40",
                                    )}
                                    aria-disabled={disabled}
                                    title={disabled ? info?.tooltip : item.label}
                                >
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                                            active ? "text-primary" : "text-foreground/50",
                                        )}
                                    >
                                        <Icon className="size-[22px]" stroke={active ? 2.2 : 1.7} />
                                    </div>
                                    <span
                                        className={cn(
                                            "mt-1 max-w-full truncate text-[10px] leading-tight font-bold transition-colors",
                                            active ? "text-primary" : "text-foreground/50",
                                        )}
                                    >
                                        {item.label}
                                    </span>

                                    {/* Dot sits in a fixed-height slot so it never shifts siblings */}
                                    <div className="flex h-2.5 items-center justify-center">
                                        {active && (
                                            <motion.div
                                                layoutId="student-bottom-nav-dot"
                                                className="bg-primary h-1 w-1 rounded-full"
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </Drawer>
        </nav>
    );
}
