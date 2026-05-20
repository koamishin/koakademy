import { cn } from "@/lib/utils";
import { useBranding } from "@/lib/branding";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Building2,
    Command
} from "lucide-react";

// Abstract Vector Illustrations
const DashboardIllustration = () => (
    <svg viewBox="0 0 200 200" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="60" width="120" height="80" rx="8" className="fill-foreground/5 stroke-foreground/20" strokeWidth="2"/>
        <rect x="50" y="70" width="30" height="30" rx="4" className="fill-primary/20"/>
        <rect x="90" y="70" width="60" height="10" rx="2" className="fill-foreground/10"/>
        <rect x="90" y="85" width="40" height="10" rx="2" className="fill-foreground/10"/>
        <rect x="50" y="110" width="100" height="20" rx="4" className="fill-foreground/5 stroke-foreground/10" strokeWidth="1"/>
        <circle cx="160" cy="60" r="20" className="fill-primary/10 blur-xl"/>
    </svg>
);

const AnalyticsIllustration = () => (
    <svg viewBox="0 0 200 200" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 140 L70 110 L100 120 L130 80 L160 90" className="stroke-primary" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="40" y="150" width="120" height="2" className="fill-foreground/20"/>
        <rect x="50" y="120" width="10" height="30" rx="2" className="fill-foreground/10"/>
        <rect x="80" y="130" width="10" height="20" rx="2" className="fill-foreground/10"/>
        <rect x="110" y="100" width="10" height="50" rx="2" className="fill-foreground/10"/>
        <rect x="140" y="110" width="10" height="40" rx="2" className="fill-foreground/10"/>
        <circle cx="160" cy="90" r="4" className="fill-primary shadow-lg"/>
    </svg>
);

const SecurityIllustration = () => (
    <svg viewBox="0 0 200 200" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="60" y="50" width="80" height="100" rx="12" className="fill-foreground/5 stroke-foreground/20" strokeWidth="2"/>
        <circle cx="100" cy="90" r="25" className="stroke-primary/30" strokeWidth="2" strokeDasharray="4 4"/>
        <circle cx="100" cy="90" r="15" className="fill-primary/20 stroke-primary" strokeWidth="2"/>
        <rect x="80" y="125" width="40" height="4" rx="2" className="fill-foreground/10"/>
        <rect x="85" y="135" width="30" height="4" rx="2" className="fill-foreground/10"/>
        <path d="M140 70 L160 50" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const SchedulingIllustration = () => (
    <svg viewBox="0 0 200 200" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="50" width="120" height="100" rx="8" className="fill-foreground/5 stroke-foreground/20" strokeWidth="2"/>
        <rect x="40" y="50" width="120" height="25" rx="8" className="fill-primary/10"/>
        <circle cx="55" cy="62.5" r="3" className="fill-primary/40"/>
        <circle cx="70" cy="62.5" r="3" className="fill-primary/40"/>
        <rect x="50" y="85" width="30" height="20" rx="4" className="fill-primary/20 stroke-primary/30" strokeWidth="1"/>
        <rect x="90" y="115" width="30" height="20" rx="4" className="fill-foreground/10 stroke-foreground/20" strokeWidth="1"/>
        <rect x="50" y="115" width="30" height="20" rx="4" className="fill-foreground/5 border-dashed stroke-foreground/10" strokeWidth="1" strokeDasharray="2 2"/>
    </svg>
);

interface Feature {
    id: string;
    title: string;
    description: string;
    illustration: any;
}

const portalFeatures: Feature[] = [
    {
        id: "dashboard",
        title: "Integrated Dashboard",
        description: "A centralized hub for all your academic activities, from class schedules to grade tracking.",
        illustration: DashboardIllustration,
    },
    {
        id: "analytics",
        title: "Real-time Analytics",
        description: "Monitor academic performance with comprehensive charts and insightful data visualizations.",
        illustration: AnalyticsIllustration,
    },
    {
        id: "id-card",
        title: "Secure Digital ID",
        description: "Access your student identity instantly with our secure, QR-coded digital ID system.",
        illustration: SecurityIllustration,
    },
    {
        id: "scheduling",
        title: "Automated Scheduling",
        description: "Never miss a class with our intelligent conflict-aware scheduling and reminders.",
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
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={cn("relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-8 lg:p-12", className)}>
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_2px_2px,var(--primary-color)_1px,transparent_0)] [background-size:32px_32px]" />
            </div>

            <div className="relative z-10 flex w-full max-w-lg flex-col items-start">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-8 lg:gap-10"
                    >
                        {/* Illustration Container */}
                        <div className="relative aspect-square w-full max-w-[200px] overflow-visible lg:max-w-[260px]">
                            <div className="bg-foreground/5 absolute inset-0 rounded-full blur-3xl" />
                            <div className="relative h-full w-full">
                                {(() => {
                                    const Illustration = portalFeatures[currentIndex].illustration;
                                    return <Illustration />;
                                })()}
                            </div>
                        </div>

                        <div className="space-y-3 lg:space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-3 py-1 text-[10px] font-bold tracking-widest text-foreground/60 uppercase ring-1 ring-foreground/10">
                                <Command className="h-3 w-3" />
                                Platform Feature
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                                {portalFeatures[currentIndex].title}
                            </h2>
                            <p className="text-lg leading-relaxed text-muted-foreground/80 lg:text-xl">
                                {portalFeatures[currentIndex].description}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Indicators */}
                <div className="mt-8 flex gap-2 lg:mt-10">
                    {portalFeatures.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-1.5 transition-all duration-500 rounded-full",
                                currentIndex === index 
                                    ? "w-8 bg-foreground" 
                                    : "w-2 bg-foreground/10 hover:bg-foreground/20"
                            )}
                            aria-label={`Go to feature ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Footer Branding */}
                <div className="mt-10 flex items-center gap-4 border-t border-border/40 pt-6 lg:mt-12 lg:pt-8">
                    <div className="bg-foreground/5 flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-foreground/10 lg:h-10 lg:w-10">
                        <Building2 className="h-4 w-4 text-foreground/60 lg:h-5 lg:w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-foreground lg:text-sm">Institutional Portal</div>
                        <div className="text-[10px] text-muted-foreground lg:text-xs">Official gateway for {orgShortName} members</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
