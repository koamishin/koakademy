import FacultyLayout from "@/components/faculty/faculty-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/user";
import { Head, Link } from "@inertiajs/react";
import { IconBook2, IconChalkboard, IconFolderOpen } from "@tabler/icons-react";

interface FacultyResourcesPageProps {
    user: User;
}

export default function FacultyResourcesPage({ user }: FacultyResourcesPageProps) {
    return (
        <FacultyLayout user={user}>
            <Head title="Resources" />

            <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
                    <p className="text-muted-foreground text-sm">Teaching references, class materials, and shared faculty resources will be organized here.</p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    {[
                        {
                            title: "Teaching Materials",
                            description: "Collect syllabi, handouts, and reusable class files.",
                            icon: IconChalkboard,
                        },
                        {
                            title: "Library Links",
                            description: "Keep academic references and research links close to your classes.",
                            icon: IconBook2,
                        },
                        {
                            title: "Shared Files",
                            description: "Prepare common templates and department resources.",
                            icon: IconFolderOpen,
                        },
                    ].map((item) => (
                        <Card key={item.title} className="rounded-lg">
                            <CardHeader className="space-y-3">
                                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg">
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
                            <h2 className="text-base font-semibold">No resources published yet</h2>
                            <p className="text-muted-foreground text-sm">Use your class workspace for posts and attachments while this library is being prepared.</p>
                        </div>
                        <Button asChild variant="secondary">
                            <Link href="/faculty/classes">Go to My Classes</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </FacultyLayout>
    );
}
