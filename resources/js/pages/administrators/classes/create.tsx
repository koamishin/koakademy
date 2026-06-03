import AdminLayout from "@/components/administrators/admin-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { route } from "ziggy-js";
import { ClassWizard } from "./forms/class-wizard";
import type { ClassFormData, ClassFormOptions } from "./lib/class-defaults";

type CreateClassProps = {
    user: User;
    filament: {
        classes: {
            index_url: string;
        };
    };
    options: ClassFormOptions;
    defaults:
        | ClassFormData
        | {
              semester: "1" | "2" | "summer";
              school_year: string;
          };
    mode?: "create" | "edit";
    class_id?: number;
    class_title?: string;
    flash: { type: string; message: string } | null;
};

export default function AdministratorClassCreate({
    user,
    options,
    defaults,
    mode = "create",
    class_id,
    class_title,
    flash,
}: CreateClassProps): ReactNode {
    const isEditing = mode === "edit";
    const semester = defaults.semester;
    const schoolYear = defaults.school_year;
    const initialData = isEditing ? (defaults as ClassFormData) : undefined;

    return (
        <AdminLayout user={user} title={isEditing ? "Edit class" : "Create class"}>
            <Head title={isEditing ? `Edit class • ${class_title ?? "Class"}` : "Create class"} />

            <div className="space-y-6">
                <div className="bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-2xl md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route("administrators.classes.index")}>
                                <ArrowLeft className="size-4" />
                                Back to classes
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{isEditing ? `Edit ${class_title ?? "class"}` : "New class"}</h1>
                            <p className="text-muted-foreground max-w-2xl">
                                {isEditing
                                    ? "Update this class using the same guided form. Nothing changes until you click Update."
                                    : "Set up a new class in three short steps. Nothing is final until you click Create."}
                            </p>
                        </div>
                    </div>
                </div>

                {flash ? (
                    <Alert>
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                ) : null}

                <ClassWizard
                    semester={semester}
                    school_year={schoolYear}
                    options={options}
                    mode={mode}
                    classId={class_id}
                    initialData={initialData}
                />
            </div>
        </AdminLayout>
    );
}
