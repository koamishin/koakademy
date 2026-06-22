import AdminLayout from "@/components/administrators/admin-layout";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { Head, Link } from "@inertiajs/react";
import { route } from "ziggy-js";
import { FacultyForm } from "./faculty-form";

type Option = { value: string; label: string };

interface FacultyCreateProps {
    user: User;
    defaults: {
        faculty_id_number: string;
        status: string;
    };
    options: {
        departments: string[];
        statuses: Option[];
        genders: Option[];
    };
}

export default function AdministratorFacultyCreate({ user, defaults, options }: FacultyCreateProps) {
    return (
        <AdminLayout user={user} title="Create Faculty">
            <Head title="Administrators - Faculties - Create" />

            <div className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Add Faculty</h2>
                        <p className="text-muted-foreground">Create the academic profile first, then manage classes and portal access.</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={route("administrators.faculties.index")}>Back</Link>
                    </Button>
                </div>

                <FacultyForm mode="create" defaults={{ ...defaults, photo_url: null }} options={options} />
            </div>
        </AdminLayout>
    );
}
