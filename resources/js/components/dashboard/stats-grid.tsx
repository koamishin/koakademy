import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconBooks, IconClock, IconHeart, IconMinus, IconSchool, IconStar, IconTrendingDown, IconTrendingUp, IconUsers } from "@tabler/icons-react";
import { motion } from "framer-motion";

export interface Stat {
    label: string;
    value: string | number;
    icon?: string;
    trend?: string;
    trendDirection?: "up" | "down" | "neutral";
}

interface StatsGridProps {
    stats?: Stat[];
}

const iconMap: Record<string, React.ElementType> = {
    book: IconBooks,
    books: IconBooks,
    users: IconUsers,
    clock: IconClock,
    activity: IconStar,
    school: IconSchool,
    heart: IconHeart,
};

const colorSchemes = [
    {
        accentBg: "bg-rose-500",
        accentSoft: "bg-rose-500/10",
        accentText: "text-rose-500",
        border: "border-rose-500/30",
    },
    {
        accentBg: "bg-amber-500",
        accentSoft: "bg-amber-500/10",
        accentText: "text-amber-500",
        border: "border-amber-500/30",
    },
    {
        accentBg: "bg-emerald-500",
        accentSoft: "bg-emerald-500/10",
        accentText: "text-emerald-500",
        border: "border-emerald-500/30",
    },
    {
        accentBg: "bg-sky-500",
        accentSoft: "bg-sky-500/10",
        accentText: "text-sky-500",
        border: "border-sky-500/30",
    },
];

function CornerAccent({ accentBg, accentSoft, delay = 0 }: { accentBg: string; accentSoft: string; delay?: number }) {
    return (
        <div className="pointer-events-none absolute right-6 bottom-12 h-12 w-16 overflow-hidden opacity-25 transition-opacity duration-300 group-hover:opacity-40">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay, ease: "easeOut" }}
                className={cn("absolute right-0 top-0 h-10 w-10 rounded-lg", accentSoft)}
            />
            {[0, 1, 2].map((line) => (
                <motion.span
                    key={line}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: delay + line * 0.08, ease: "easeOut" }}
                    className={cn("absolute right-0 h-1.5 rounded-full", accentBg)}
                    style={{
                        top: `${8 + line * 11}px`,
                        width: `${42 - line * 9}px`,
                    }}
                />
            ))}
            <motion.span
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 34 }}
                transition={{ duration: 0.5, delay: delay + 0.18, ease: "easeOut" }}
                className={cn("absolute top-1 right-13 w-1 rounded-full", accentBg)}
            />
        </div>
    );
}

function ProgressFill({ progress, accentBg, delay = 0 }: { progress: number; accentBg: string; delay?: number }) {
    return (
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay, ease: "easeOut" }}
            className={cn("h-full rounded-full", accentBg)}
        >
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ duration: 0.4, delay: delay + 0.4 }}
                className="block h-full w-full rounded-full bg-white"
            />
        </motion.div>
    );
}

export function StatsGrid({ stats = [] }: StatsGridProps) {
    if (!stats.length) return null;

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const scheme = colorSchemes[index % colorSchemes.length];
                const IconComponent = stat.icon ? (iconMap[stat.icon] ?? IconBooks) : IconBooks;
                const numericValue = typeof stat.value === "number" ? stat.value : parseInt(String(stat.value).replace(/[^0-9]/g, ""), 10) || 0;
                const progress = Math.min(numericValue > 100 ? 100 : numericValue, 100);

                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                        <Card
                            className={cn(
                                "group relative overflow-hidden rounded-lg border bg-card/80 shadow-sm transition-all duration-300",
                                scheme.border,
                                "hover:border-primary/30 hover:bg-card hover:shadow-lg hover:shadow-black/5",
                            )}
                        >
                            <div className={cn("absolute inset-x-0 top-0 h-1", scheme.accentBg)} />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

                            <CardContent className="relative p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: index * 0.1 + 0.2 }}
                                            className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", scheme.accentSoft)}
                                        >
                                            <IconComponent className={cn("h-5 w-5", scheme.accentText)} />
                                        </motion.div>

                                        <div className="min-w-0 space-y-1">
                                            <p className="text-muted-foreground truncate text-xs font-semibold tracking-wide uppercase">{stat.label}</p>
                                            <motion.p
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.3 }}
                                                className="text-foreground text-3xl leading-none font-bold tracking-tight"
                                            >
                                                {stat.value}
                                            </motion.p>
                                        </div>
                                    </div>

                                    {stat.trend && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 + 0.4 }}
                                            className={cn(
                                                "relative z-10 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                stat.trendDirection === "up" && "bg-emerald-500/15 text-emerald-600",
                                                stat.trendDirection === "down" && "bg-rose-500/15 text-rose-600",
                                                stat.trendDirection === "neutral" && "bg-slate-500/15 text-slate-600",
                                            )}
                                        >
                                            {stat.trendDirection === "up" && <IconTrendingUp className="h-3 w-3" />}
                                            {stat.trendDirection === "down" && <IconTrendingDown className="h-3 w-3" />}
                                            {stat.trendDirection === "neutral" && <IconMinus className="h-3 w-3" />}
                                            {stat.trend}
                                        </motion.div>
                                    )}
                                </div>

                                <div className="mt-6 flex items-center gap-3">
                                    <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                                        <ProgressFill progress={progress} accentBg={scheme.accentBg} delay={index * 0.1 + 0.5} />
                                    </div>
                                    <span className="text-muted-foreground min-w-8 text-right text-[11px] font-medium tabular-nums">{progress}%</span>
                                </div>

                                <CornerAccent accentBg={scheme.accentBg} accentSoft={scheme.accentSoft} delay={index * 0.1} />
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}
