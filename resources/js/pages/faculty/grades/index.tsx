import FacultyLayout from "@/components/faculty/faculty-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User } from "@/types/user";
import { Head, Link } from "@inertiajs/react";

interface GradeClassRow {
    id: number;
    subject_code: string;
    subject_title: string;
    section: string;
    classification: string;
    students_count: number;
    room: string;
    schedule_summary: string[];
    manage_grades_url: string;
}

interface FacultyGradesPageProps {
    user: User;
    faculty_data: {
        classes: GradeClassRow[];
    };
    current_semester: string;
    current_school_year: string;
}

export default function FacultyGradesPage({ user, faculty_data, current_semester, current_school_year }: FacultyGradesPageProps) {
    const classes = faculty_data.classes ?? [];
    const periodLabel = `Semester ${current_semester} • ${current_school_year}`;

    return (
        <FacultyLayout user={user}>
            <Head title="Grades & Reports" />

            <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Grades &amp; Reports</h1>
                    <p className="text-muted-foreground text-sm">Manage student grades per class for the active academic period.</p>
                    <p className="text-muted-foreground text-sm">{periodLabel}</p>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {classes.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No active classes found for the current term.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Section</TableHead>
                                        <TableHead>Students</TableHead>
                                        <TableHead className="hidden md:table-cell">Schedule</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classes.map((classRow) => (
                                        <TableRow key={classRow.id}>
                                            <TableCell>
                                                <div className="font-medium">{classRow.subject_title}</div>
                                                <div className="text-muted-foreground text-xs">{classRow.subject_code}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{classRow.section}</Badge>
                                                    <span className="text-muted-foreground hidden text-xs capitalize lg:inline">{classRow.classification}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{classRow.students_count}</TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="text-muted-foreground text-xs">
                                                    {classRow.schedule_summary.length > 0 ? classRow.schedule_summary.join(" • ") : "TBA"}
                                                </div>
                                                <div className="text-muted-foreground text-xs">Room: {classRow.room}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild size="sm">
                                                    <Link href={classRow.manage_grades_url}>Manage Grades</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </FacultyLayout>
    );
}
