import AdminLayout from "@/components/administrators/admin-layout";
import { Button } from "@/components/ui/button";
import type { User } from "@/Types/user";
import { Head, Link } from "@inertiajs/react";
import { show } from "@/actions/App/Http/Controllers/AdministratorFacultyManagementController";
import { FacultyForm, type FacultyFormPayload } from "./faculty-form";

type Option = { value: string; label: string };

interface FacultyEditProps {
    user: User;
    faculty: FacultyFormPayload;
    options: {
        departments: string[];
        statuses: Option[];
        genders: Option[];
    };
}

export default function AdministratorFacultyEdit({ user, faculty, options }: FacultyEditProps) {
    return (
        <AdminLayout user={user} title="Edit Faculty">
            <Head title={`Administrators - Faculties - Edit - ${faculty.first_name} ${faculty.last_name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Edit Faculty</h2>
                        <p className="text-muted-foreground">Keep academic records, contact details, and profile readiness aligned.</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={show.url(faculty.id ?? "")}>Back</Link>
                    </Button>
                </div>

                <FacultyForm mode="edit" faculty={faculty} options={options} />
            </div>
        </AdminLayout>
    );
}
