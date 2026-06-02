import AdminLayout from "@/components/administrators/admin-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { route } from "ziggy-js";
import { ClassWizard } from "./forms/class-wizard";
import type { ClassFormOptions } from "./lib/class-defaults";

type CreateClassProps = {
    user: User;
    filament: {
        classes: {
            index_url: string;
        };
    };
    options: ClassFormOptions;
    defaults: {
        semester: "1" | "2" | "summer";
        school_year: string;
    };
    flash: { type: string; message: string } | null;
};

export default function AdministratorClassCreate({ user, options, defaults, flash }: CreateClassProps): ReactNode {
    return (
        <AdminLayout user={user} title="Create class">
            <Head title="Create class" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-2xl md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route("administrators.classes.index")}>
                                <ArrowLeft className="size-4" />
                                Back to classes
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">New class</h1>
                            <p className="max-w-2xl text-muted-foreground">
                                Set up a new class in three short steps. Nothing is final until you click Create.
                            </p>
                        </div>
                    </div>
                </div>

                {flash ? (
                    <Alert>
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                ) : null}

                <ClassWizard semester={defaults.semester} school_year={defaults.school_year} options={options} />
            </div>
        </AdminLayout>
    );
}
