import FacultyLayout from "@/components/faculty/faculty-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/user";
import { Head, Link } from "@inertiajs/react";
import { IconClipboardList, IconFileDescription, IconSignature } from "@tabler/icons-react";

interface FacultyFormsPageProps {
    user: User;
}

export default function FacultyFormsPage({ user }: FacultyFormsPageProps) {
    return (
        <FacultyLayout user={user}>
            <Head title="Faculty Forms" />

            <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Faculty Forms</h1>
                    <p className="text-muted-foreground text-sm">Leave requests, requisitions, and faculty approvals will be managed from this workspace.</p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    {[
                        {
                            title: "Leave Requests",
                            description: "Prepare absence and leave request workflows.",
                            icon: IconFileDescription,
                        },
                        {
                            title: "Requisitions",
                            description: "Track department requests and needed approvals.",
                            icon: IconClipboardList,
                        },
                        {
                            title: "Signatures",
                            description: "Route forms for review and confirmation.",
                            icon: IconSignature,
                        },
                    ].map((item) => (
                        <Card key={item.title} className="rounded-lg">
                            <CardHeader className="space-y-3">
                                <div className="bg-rose-500/10 flex size-11 items-center justify-center rounded-lg text-rose-500">
                                    <item.icon className="size-5" />
                                </div>
                                <CardTitle className="text-base">{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <Card className="rounded-lg">
                    <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold">No forms available yet</h2>
                            <p className="text-muted-foreground text-sm">For now, continue using your existing faculty request process.</p>
                        </div>
                        <Button asChild variant="secondary">
                            <Link href="/faculty/dashboard">Back to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </FacultyLayout>
    );
}
