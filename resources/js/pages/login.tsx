import { Head, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";

import { AnnouncementBanner } from "@/components/announcement-banner";
import { resolveBranding, type Branding } from "@/lib/branding";
import { LoginForm } from "@/components/login-form";
import { OnboardingPanel } from "@/components/onboarding-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransitionWrapper } from "@/components/transition-wrapper";

export default function LoginPage() {
    const { errors, status, branding, announcements, demoMode } = usePage<{
        errors?: Record<string, string>;
        status?: string | null;
        branding?: Partial<Branding> | null;
        announcements?: unknown[];
        demoMode?: {
            enabled: boolean;
            accounts: Array<{
                role: string;
                label: string;
                description: string;
            }>;
        };
    }>().props;

    const resolvedBranding = resolveBranding(branding);
    const appName = resolvedBranding.appName;
    const organizationName = resolvedBranding.organizationName;
    const organizationShortName = resolvedBranding.organizationShortName;
    const authLayout = resolvedBranding.authLayout;
    const isSplitLayout = authLayout === "split";

    return (
        <div className={isSplitLayout ? "grid min-h-svh lg:grid-cols-2" : "min-h-svh"}>
            <Head title={`${appName} - Academic Management System`}>
                <meta
                    name="description"
                    content={`The official academic portal for ${organizationName}. Access student records, grades, schedules, and faculty resources.`}
                />
            </Head>

            {/* Background Decorative Elements */}
            <div className="bg-background pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="bg-primary/5 absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
                <div className="bg-primary/10 absolute -right-[5%] bottom-[10%] h-[30%] w-[30%] rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col gap-4 p-6 md:p-10">
                <div className="flex items-center justify-between md:justify-start">
                    <motion.a
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        href="#"
                        className="flex items-center gap-3 font-medium"
                    >
                        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ring-1 ring-primary/20 backdrop-blur-sm">
                            <img src={resolvedBranding.logo} alt={`${organizationShortName} Logo`} className="h-8 w-8 object-contain" />
                        </div>
                        <span className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">{appName}</span>
                    </motion.a>
                    <div className="md:absolute md:top-6 md:right-6">
                        <ThemeToggle />
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div
                        className={
                            authLayout === "card"
                                ? "bg-card/50 border-border w-full max-w-md space-y-6 rounded-3xl border p-8 shadow-2xl backdrop-blur-md"
                                : authLayout === "minimal"
                                  ? "w-full max-w-sm space-y-4"
                                  : "w-full max-w-sm space-y-8"
                        }
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-4 text-center"
                        >
                            <div className="mb-4 text-left">
                                <AnnouncementBanner announcements={announcements ?? []} />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                                    Academic Management <span className="text-primary">Portal</span>
                                </h1>
                                <p className="text-muted-foreground mx-auto max-w-sm text-sm text-pretty sm:text-base">
                                    Welcome back to {appName}. Sign in to manage your academic records and class requirements.
                                </p>
                            </div>
                        </motion.div>

                        <TransitionWrapper delay={0.2}>
                            <LoginForm errors={errors} status={status} demoMode={demoMode} />
                        </TransitionWrapper>
                    </div>
                </div>
            </div>

            {isSplitLayout ? (
                <div className="bg-muted/30 relative hidden lg:block overflow-hidden border-l">
                    <div className="bg-primary/5 absolute inset-0 z-0">
                        <div className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,var(--primary-color)_0%,transparent_70%)] opacity-[0.03]" />
                    </div>
                    <TransitionWrapper className="relative z-10 h-full">
                        <OnboardingPanel className="h-full" />
                    </TransitionWrapper>
                </div>
            ) : null}
        </div>
    );
}
