import { cn } from "@/lib/utils";
import { useBranding } from "@/lib/branding";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Building2,
    Command,
    Users,
    Zap,
    Shield,
    BarChart3,
    CalendarDays
} from "lucide-react";

// Abstract Vector Illustrations with motion
const DashboardIllustration = () => (
    <motion.svg 
        viewBox="0 0 200 200" 
        className="h-full w-full" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        initial="initial"
        animate="animate"
    >
        <motion.rect 
            x="30" y="50" width="140" height="100" rx="12" 
            className="fill-foreground/[0.03] stroke-foreground/20" 
            strokeWidth="2"
        />
        <motion.rect 
            x="45" y="65" width="40" height="40" rx="6" 
            className="fill-primary/20"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
        />
        <rect x="95" y="65" width="60" height="8" rx="4" className="fill-foreground/10"/>
        <rect x="95" y="80" width="40" height="8" rx="4" className="fill-foreground/10"/>
        <motion.rect 
            x="45" y="115" width="110" height="25" rx="6" 
            className="fill-foreground/[0.05] stroke-foreground/10" 
            strokeWidth="1"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="170" cy="40" r="30" className="fill-primary/10 blur-2xl"/>
    </motion.svg>
);

const AnalyticsIllustration = () => (
    <motion.svg 
        viewBox="0 0 200 200" 
        className="h-full w-full" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        initial="initial"
        animate="animate"
    >
        <motion.path 
            d="M40 140 L70 110 L100 120 L130 80 L160 90" 
            className="stroke-primary" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <rect x="40" y="150" width="120" height="2" className="fill-foreground/20"/>
        <motion.rect 
            x="50" y="120" width="12" height="30" rx="2" className="fill-foreground/10"
            animate={{ height: [20, 35, 20] }}
            transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.rect 
            x="80" y="130" width="12" height="20" rx="2" className="fill-foreground/10"
            animate={{ height: [15, 25, 15] }}
            transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.rect 
            x="110" y="100" width="12" height="50" rx="2" className="fill-foreground/10"
            animate={{ height: [40, 60, 40] }}
            transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.circle 
            cx="160" cy="90" r="6" 
            className="fill-primary shadow-lg"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
        />
    </motion.svg>
);

const SecurityIllustration = () => (
    <motion.svg 
        viewBox="0 0 200 200" 
        className="h-full w-full" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <motion.rect 
            x="55" y="45" width="90" height="110" rx="16" 
            className="fill-foreground/[0.03] stroke-foreground/20" 
            strokeWidth="2"
        />
        <motion.circle 
            cx="100" cy="90" r="30" 
            className="stroke-primary/30" 
            strokeWidth="2" 
            strokeDasharray="4 4"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.circle 
            cx="100" cy="90" r="18" 
            className="fill-primary/20 stroke-primary" 
            strokeWidth="2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
        />
        <rect x="80" y="130" width="40" height="6" rx="3" className="fill-foreground/10"/>
        <rect x="85" y="142" width="30" height="6" rx="3" className="fill-foreground/10"/>
        <motion.path 
            d="M145 65 L165 45" 
            className="stroke-primary/40" 
            strokeWidth="3" 
            strokeLinecap="round"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
        />
    </motion.svg>
);

const SchedulingIllustration = () => (
    <motion.svg viewBox="0 0 200 200" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="35" y="45" width="130" height="110" rx="12" className="fill-foreground/[0.03] stroke-foreground/20" strokeWidth="2"/>
        <rect x="35" y="45" width="130" height="30" rx="12" className="fill-primary/10"/>
        <circle cx="50" cy="60" r="4" className="fill-primary/40"/>
        <circle cx="70" cy="60" r="4" className="fill-primary/40"/>
        
        <motion.rect 
            x="45" y="90" width="35" height="25" rx="6" 
            className="fill-primary/20 stroke-primary/30" 
            strokeWidth="1"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
        />
        <rect x="90" y="120" width="35" height="25" rx="6" className="fill-foreground/10 stroke-foreground/20" strokeWidth="1"/>
        <motion.rect 
            x="45" y="120" width="35" height="25" rx="6" 
            className="fill-foreground/[0.03] border-dashed stroke-foreground/10" 
            strokeWidth="1" 
            strokeDasharray="3 3"
        />
        <motion.circle 
            cx="150" cy="130" r="20" 
            className="fill-primary/5 blur-xl"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
        />
    </motion.svg>
);

interface Feature {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: any;
    illustration: any;
}

const portalFeatures: Feature[] = [
    {
        id: "dashboard",
        title: "Integrated Dashboard",
        description: "A centralized hub for all your academic activities, from class schedules to grade tracking.",
        category: "Productivity",
        icon: Zap,
        illustration: DashboardIllustration,
    },
    {
        id: "analytics",
        title: "Real-time Analytics",
        description: "Monitor academic performance with comprehensive charts and insightful data visualizations.",
        category: "Insights",
        icon: BarChart3,
        illustration: AnalyticsIllustration,
    },
    {
        id: "id-card",
        title: "Secure Digital ID",
        description: "Access your student identity instantly with our secure, QR-coded digital ID system.",
        category: "Security",
        icon: Shield,
        illustration: SecurityIllustration,
    },
    {
        id: "scheduling",
        title: "Automated Scheduling",
        description: "Never miss a class with our intelligent conflict-aware scheduling and reminders.",
        category: "Efficiency",
        icon: CalendarDays,
        illustration: SchedulingIllustration,
    }
];

interface OnboardingPanelProps {
    className?: string;
}

export function OnboardingPanel({ className }: OnboardingPanelProps) {
    const { appName, organizationShortName: orgShortName } = useBranding();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % portalFeatures.length);
        }, 8000); // Increased duration for better readability
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={cn("relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-6 lg:p-8", className)}>
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_2px_2px,var(--primary-color)_1px,transparent_0)] [background-size:40px_40px] opacity-[0.03]" />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        x: [0, -40, 0],
                        y: [0, 60, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" 
                />
            </div>

            <div className="relative z-10 flex w-full max-w-md flex-col items-start">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-4 lg:gap-6"
                    >
                        {/* Illustration Container */}
                        <div className="relative aspect-square w-full max-w-[140px] overflow-visible lg:max-w-[180px]">
                            <div className="bg-primary/5 absolute inset-0 rounded-3xl blur-3xl" />
                            <div className="relative h-full w-full drop-shadow-xl">
                                {(() => {
                                    const Illustration = portalFeatures[currentIndex].illustration;
                                    return <Illustration />;
                                })()}
                            </div>
                        </div>

                        <div className="space-y-3 lg:space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-primary uppercase ring-1 ring-primary/20">
                                    <Command className="h-2.5 w-2.5" />
                                    Platform
                                </div>
                                <div className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[9px] font-bold tracking-wider text-foreground/60 uppercase ring-1 ring-foreground/10">
                                    {(() => {
                                        const Icon = portalFeatures[currentIndex].icon;
                                        return <Icon className="h-2.5 w-2.5" />;
                                    })()}
                                    {portalFeatures[currentIndex].category}
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl leading-tight">
                                    {portalFeatures[currentIndex].title.split(' ').map((word, i) => (
                                        <span key={i} className={i === 0 ? "block" : "text-primary/90"}>
                                            {word}{' '}
                                        </span>
                                    ))}
                                </h2>
                                <p className="text-sm leading-relaxed text-muted-foreground/90 max-w-sm lg:text-base font-medium">
                                    {portalFeatures[currentIndex].description}
                                </p>
                            </div>

                            {/* Social Proof / Stats */}
                            <div className="flex items-center gap-3 pt-0.5">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-7 w-7 rounded-full border-2 border-background bg-muted ring-1 ring-foreground/5 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" />
                                        </div>
                                    ))}
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-[8px] font-bold text-primary-foreground ring-1 ring-primary/20">
                                        +2k
                                    </div>
                                </div>
                                <div className="text-[10px] font-semibold text-foreground/60">
                                    <span className="text-foreground font-bold">2,000+</span> active students
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Indicators */}
                <div className="mt-6 flex items-center gap-2 lg:mt-8">
                    {portalFeatures.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className="group relative h-2.5 w-2.5 flex items-center justify-center"
                            aria-label={`Go to feature ${index + 1}`}
                        >
                            <div className={cn(
                                "transition-all duration-500 rounded-full",
                                currentIndex === index 
                                    ? "h-1 w-5 bg-primary" 
                                    : "h-1 w-1 bg-foreground/10 group-hover:bg-foreground/20"
                            )} />
                        </button>
                    ))}
                </div>

                {/* Footer Branding */}
                <div className="mt-6 flex w-full items-center justify-between border-t border-border/40 pt-4 lg:mt-8">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-primary/20 shadow-sm backdrop-blur-sm">
                            <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-foreground lg:text-xs">Institutional Portal</div>
                            <div className="text-[9px] text-muted-foreground">Official gateway for members</div>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-foreground/[0.03] px-2 py-1 ring-1 ring-foreground/10">
                        <Users className="h-3 w-3 text-foreground/40" />
                        <span className="text-[8px] font-bold text-foreground/50 uppercase tracking-widest">Global</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

