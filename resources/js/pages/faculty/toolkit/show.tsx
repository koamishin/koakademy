import FacultyLayout from "@/components/faculty/faculty-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { Head, Link } from "@inertiajs/react";
import { IconArrowRight, IconBriefcase, IconCircleCheck, IconSparkles } from "@tabler/icons-react";

interface FacultyToolkitPageProps {
    user: User;
    toolkit: {
        title: string;
        summary: string;
        highlights: string[];
        accent: "amber" | "emerald" | "indigo" | "rose" | "sky" | "violet";
    };
}

const accentStyles = {
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    sky: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    violet: "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

export default function FacultyToolkitPage({ user, toolkit }: FacultyToolkitPageProps) {
    const accentClass = accentStyles[toolkit.accent] ?? accentStyles.amber;

    return (
        <FacultyLayout user={user}>
            <Head title={toolkit.title} />

            <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="space-y-3">
                    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", accentClass)}>
                        <IconSparkles className="size-3.5" />
                        Faculty Toolkit
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">{toolkit.title}</h1>
                        <p className="text-muted-foreground max-w-2xl text-sm">{toolkit.summary}</p>
                    </div>
                </header>

                <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card className="rounded-lg">
                        <CardHeader className="space-y-3">
                            <div className={cn("flex size-12 items-center justify-center rounded-lg border", accentClass)}>
                                <IconBriefcase className="size-5" />
                            </div>
                            <CardTitle>Workspace preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground text-sm">
                                This toolkit area is ready as a route and can now be expanded without breaking the faculty sidebar navigation.
                            </p>
                            <Button asChild variant="secondary">
                                <Link href="/faculty/dashboard" className="inline-flex items-center gap-2">
                                    Back to Dashboard
                                    <IconArrowRight className="size-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg">
                        <CardHeader>
                            <CardTitle className="text-base">Planned tools</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {toolkit.highlights.map((highlight) => (
                                    <li key={highlight} className="flex items-start gap-3 text-sm">
                                        <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", accentClass)}>
                                            <IconCircleCheck className="size-3.5" />
                                        </span>
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </FacultyLayout>
    );
}
