import AdminLayout from "@/components/administrators/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    Banknote,
    BookOpen,
    Briefcase,
    Calendar,
    Check,
    GraduationCap,
    Hash,
    LayoutGrid,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Plus,
    RefreshCw,
    Save,
    School,
    Trash2,
    User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

declare const route: (name: string, params?: unknown) => string;

interface Option {
    value: string | number;
    label: string;
    is_active?: boolean;
}

interface Student {
    id: number;
    student_type: string | null;
    student_id: string | number | null;
    lrn: string | null;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    suffix: string | null;
    gender: string;
    birth_date: string | null;
    age: number | null;
    email: string | null;
    phone: string | null;
    course_id: number | null;
    academic_year: number | null;
    shs_strand_id: number | null;
    remarks: string | null;
    civil_status: string | null;
    nationality: string | null;
    religion: string | null;
    ethnicity: string | null;
    city_of_origin: string | null;
    province_of_origin: string | null;
    region_of_origin: string | null;
    is_indigenous_person: boolean;
    indigenous_group: string | null;
    status: string | null;
    withdrawal_date: string | null;
    withdrawal_reason: string | null;
    attrition_category: string | null;
    dropout_date: string | null;
    scholarship_type: string | null;
    scholarship_details: string | null;
    employment_status: string | null;
    employer_name: string | null;
    job_position: string | null;
    employment_date: string | null;
    employed_by_institution: boolean;
    Course: { code: string; title: string } | null;
    shsStrand: { strand_name: string } | null;
    studentContactsInfo: Record<string, unknown> | null;
    studentParentInfo: Record<string, unknown> | null;
    studentEducationInfo: Record<string, unknown> | null;
    personalInfo: Record<string, unknown> | null;
}

interface EditStudentForm {
    student_type: string;
    student_id: string;
    lrn: string;
    status: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    suffix: string;
    gender: string;
    birth_date: string;
    age: string;
    email: string;
    phone: string;
    civil_status: string;
    nationality: string;
    citizenship: string;
    religion: string;
    course_id: string;
    shs_strand_id: string;
    academic_year: string;
    remarks: string;
    personal_contact: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_address: string;
    fathers_name: string;
    mothers_name: string;
    current_address: string;
    permanent_address: string;
    birthplace: string;
    elementary_school: string;
    elementary_graduate_year: string;
    elementary_school_address: string;
    junior_high_school_name: string;
    junior_high_graduation_year: string;
    junior_high_school_address: string;
    senior_high_name: string;
    senior_high_graduate_year: string;
    senior_high_address: string;
    ethnicity: string;
    region_of_origin: string;
    province_of_origin: string;
    city_of_origin: string;
    is_indigenous_person: boolean;
    indigenous_group: string;
    scholarship_type: string;
    scholarship_details: string;
    employment_status: string;
    employer_name: string;
    job_position: string;
    employment_date: string;
    employed_by_institution: boolean;
    withdrawal_date: string;
    withdrawal_reason: string;
    attrition_category: string;
    dropout_date: string;
    weight: string;
    height: string;
}

interface CurrentEnrollment {
    id: number;
    subject: {
        code: string;
        title: string;
        units: number;
    };
}

interface CurrentClass {
    id: number;
    class?: {
        subject?: {
            code?: string;
            title?: string;
        };
        section?: string | null;
        faculty?: {
            full_name?: string | null;
        };
    };
}

interface EditStudentProps {
    user: User;
    student: Student;
    options: {
        types: Option[];
        statuses: Option[];
        courses: Option[];
        shs_strands: Option[];
        scholarship_types: Option[];
        employment_statuses: Option[];
        attrition_categories: Option[];
        regions: Option[];
        subjects: Option[];
    };
    current_enrollments: CurrentEnrollment[];
    current_classes: CurrentClass[];
}

const CIVIL_STATUS_OPTIONS = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "widowed", label: "Widowed" },
    { value: "separated", label: "Separated" },
    { value: "annulled", label: "Annulled" },
];

const NATIONALITY_OPTIONS = [
    { value: "filipino", label: "Filipino" },
    { value: "american", label: "American" },
    { value: "chinese", label: "Chinese" },
    { value: "indian", label: "Indian" },
    { value: "korean", label: "Korean" },
    { value: "japanese", label: "Japanese" },
    { value: "other", label: "Other" },
];

function requiredLabel(label: string) {
    return (
        <>
            {label} <span className="text-destructive">*</span>
        </>
    );
}

function asString(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value);
}

function dateValue(value: string | null): string {
    return value ? value.split("T")[0] : "";
}

function relationValue(relation: Record<string, unknown> | null, ...keys: string[]): string {
    if (!relation) {
        return "";
    }

    for (const key of keys) {
        const value = relation[key];

        if (value !== null && value !== undefined && value !== "") {
            return String(value);
        }
    }

    return "";
}

export default function AdministratorStudentEdit({ user, student, options, current_enrollments = [], current_classes = [] }: EditStudentProps) {
    const [addSubjectOpen, setAddSubjectOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [isGeneratingId, setIsGeneratingId] = useState(false);

    const { data, setData, put, processing, errors } = useForm<EditStudentForm>({
        student_type: student.student_type || "college",
        student_id: asString(student.student_id),
        lrn: student.lrn || "",
        status: student.status || "enrolled",
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        middle_name: student.middle_name || "",
        suffix: student.suffix || "",
        gender: student.gender || "male",
        birth_date: dateValue(student.birth_date),
        age: asString(student.age),
        email: student.email || "",
        phone: student.phone || "",
        civil_status: student.civil_status || relationValue(student.personalInfo, "civil_status") || "single",
        nationality: student.nationality || relationValue(student.personalInfo, "citizenship") || "filipino",
        citizenship: student.nationality || relationValue(student.personalInfo, "citizenship") || "filipino",
        religion: student.religion || relationValue(student.personalInfo, "religion"),
        course_id: student.course_id ? student.course_id.toString() : "",
        academic_year: student.academic_year ? student.academic_year.toString() : "1",
        shs_strand_id: student.shs_strand_id ? student.shs_strand_id.toString() : "",
        remarks: student.remarks || "",
        personal_contact: relationValue(student.studentContactsInfo, "personal_contact") || student.phone || "",
        emergency_contact_name: relationValue(student.studentContactsInfo, "emergency_contact_name"),
        emergency_contact_phone: relationValue(student.studentContactsInfo, "emergency_contact_phone"),
        emergency_contact_address: relationValue(student.studentContactsInfo, "emergency_contact_address"),
        fathers_name: relationValue(student.studentParentInfo, "fathers_name", "father_name"),
        mothers_name: relationValue(student.studentParentInfo, "mothers_name", "mother_name"),
        elementary_school: relationValue(student.studentEducationInfo, "elementary_school"),
        elementary_graduate_year: relationValue(student.studentEducationInfo, "elementary_graduate_year", "elementary_year_graduated"),
        elementary_school_address: relationValue(student.studentEducationInfo, "elementary_school_address"),
        junior_high_school_name: relationValue(student.studentEducationInfo, "junior_high_school_name", "high_school"),
        junior_high_graduation_year: relationValue(student.studentEducationInfo, "junior_high_graduation_year", "high_school_year_graduated"),
        junior_high_school_address: relationValue(student.studentEducationInfo, "junior_high_school_address"),
        senior_high_name: relationValue(student.studentEducationInfo, "senior_high_name", "senior_high_school"),
        senior_high_graduate_year: relationValue(student.studentEducationInfo, "senior_high_graduate_year", "senior_high_year_graduated"),
        senior_high_address: relationValue(student.studentEducationInfo, "senior_high_address"),
        current_address: relationValue(student.personalInfo, "current_adress"),
        permanent_address: relationValue(student.personalInfo, "permanent_address"),
        birthplace: relationValue(student.personalInfo, "birthplace", "place_of_birth"),
        ethnicity: student.ethnicity || "",
        city_of_origin: student.city_of_origin || "",
        province_of_origin: student.province_of_origin || "",
        region_of_origin: student.region_of_origin || "",
        is_indigenous_person: student.is_indigenous_person || false,
        indigenous_group: student.indigenous_group || "",
        withdrawal_date: dateValue(student.withdrawal_date),
        withdrawal_reason: student.withdrawal_reason || "",
        attrition_category: student.attrition_category || "",
        dropout_date: dateValue(student.dropout_date),
        scholarship_type: student.scholarship_type || "none",
        scholarship_details: student.scholarship_details || "",
        employment_status: student.employment_status || "not_applicable",
        employer_name: student.employer_name || "",
        job_position: student.job_position || "",
        employment_date: dateValue(student.employment_date),
        employed_by_institution: student.employed_by_institution || false,
        weight: relationValue(student.personalInfo, "weight"),
        height: relationValue(student.personalInfo, "height"),
    });

    const isSHS = data.student_type === "shs";
    const isGraduated = data.status === "graduated";
    const isWithdrawn = data.status === "withdrawn" || data.status === "dropped";
    const showEmployment =
        isGraduated &&
        data.employment_status !== "not_applicable" &&
        data.employment_status !== "unemployed" &&
        data.employment_status !== "further_study";

    const fieldError = (field: keyof EditStudentForm) => (errors[field] ? <p className="text-destructive text-sm">{errors[field]}</p> : null);

    const yearLevelOptions = isSHS
        ? [
              { value: "11", label: "Grade 11" },
              { value: "12", label: "Grade 12" },
          ]
        : [
              { value: "1", label: "1st Year" },
              { value: "2", label: "2nd Year" },
              { value: "3", label: "3rd Year" },
              { value: "4", label: "4th Year" },
              { value: "5", label: "Graduate" },
          ];

    useEffect(() => {
        if (!data.birth_date) {
            setData("age", "");
            return;
        }

        const birthDate = new Date(data.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        setData("age", age.toString());
    }, [data.birth_date]);

    useEffect(() => {
        if (isSHS) {
            setData("course_id", "");

            if (data.academic_year !== "11" && data.academic_year !== "12") {
                setData("academic_year", "11");
            }

            return;
        }

        setData("shs_strand_id", "");

        if (data.academic_year === "11" || data.academic_year === "12") {
            setData("academic_year", "1");
        }
    }, [data.student_type]);

    const handleGenerateId = async () => {
        if (!data.student_type || isSHS) {
            return;
        }

        setIsGeneratingId(true);

        try {
            const response = await fetch(route("administrators.students.generate-id", { type: data.student_type }));

            if (response.ok) {
                const result = (await response.json()) as { id?: number };

                if (result.id) {
                    setData("student_id", result.id.toString());
                }
            }
        } finally {
            setIsGeneratingId(false);
        }
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        put(route("administrators.students.update", student.id), {
            onSuccess: () => {
                toast.success("Student updated successfully");
            },
            onError: (formErrors) => {
                toast.error("Failed to update student", {
                    description: Object.values(formErrors)[0] || "Please check the form for errors.",
                });
            },
        });
    };

    const handleAddSubject = () => {
        if (!selectedSubject) {
            return;
        }

        router.post(
            route("administrators.students.subjects.add", student.id),
            { subject_id: selectedSubject },
            {
                onSuccess: () => {
                    setAddSubjectOpen(false);
                    setSelectedSubject(null);
                    toast.success("Subject added successfully");
                },
                onError: (formErrors) => {
                    toast.error("Failed to add subject", {
                        description: Object.values(formErrors)[0] || "Please check for errors.",
                    });
                },
            },
        );
    };

    const handleRemoveSubject = (id: number) => {
        if (confirm("Remove this subject from the student's current load?")) {
            router.delete(route("administrators.students.subjects.remove", [student.id, id]));
        }
    };

    return (
        <AdminLayout user={user} title="Edit Student">
            <Head title={`Edit Student - ${student.first_name} ${student.last_name}`} />

            <form onSubmit={submit} className="mx-auto max-w-6xl space-y-6 pb-10">
                <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {data.first_name} {data.last_name}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="outline" className="font-mono">
                                {isSHS ? data.lrn || "No LRN" : data.student_id || "No ID"}
                            </Badge>
                            <Badge variant="secondary">
                                {options.types.find((type) => type.value === data.student_type)?.label ?? data.student_type}
                            </Badge>
                            <Badge variant={data.status === "enrolled" ? "default" : "secondary"} className="capitalize">
                                {data.status.replace("_", " ")}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route("administrators.students.show", student.id)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Profile
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {processing ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserIcon className="text-primary h-5 w-5" />
                            Student Record
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
                        <div className="space-y-2">
                            <Label>{requiredLabel("Student Type")}</Label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                                {options.types.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setData("student_type", type.value.toString())}
                                        className={cn(
                                            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                                            data.student_type === type.value
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background hover:bg-muted",
                                        )}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                            {fieldError("student_type")}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">{requiredLabel("Status")}</Label>
                            <Select value={data.status} onValueChange={(value) => setData("status", value)}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.statuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value.toString()}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldError("status")}
                        </div>

                        {!isSHS ? (
                            <div className="space-y-2">
                                <Label htmlFor="student_id" className="flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5" />
                                    {requiredLabel("Student ID")}
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="student_id"
                                        value={data.student_id}
                                        onChange={(event) => setData("student_id", event.target.value)}
                                        placeholder="6-digit ID"
                                        className="font-mono"
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={handleGenerateId} disabled={isGeneratingId}>
                                        <RefreshCw className={cn("h-4 w-4", isGeneratingId && "animate-spin")} />
                                    </Button>
                                </div>
                                {fieldError("student_id")}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="lrn" className="flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5" />
                                    {requiredLabel("LRN")}
                                </Label>
                                <Input
                                    id="lrn"
                                    value={data.lrn}
                                    onChange={(event) => setData("lrn", event.target.value)}
                                    placeholder="Learner Reference Number"
                                    className="font-mono"
                                />
                                {fieldError("lrn")}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <GraduationCap className="text-primary h-5 w-5" />
                                    Required Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-5 md:grid-cols-2">
                                <div className="grid gap-4 md:col-span-2 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">{requiredLabel("First Name")}</Label>
                                        <Input
                                            id="first_name"
                                            value={data.first_name}
                                            onChange={(event) => setData("first_name", event.target.value)}
                                        />
                                        {fieldError("first_name")}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="middle_name">Middle Name</Label>
                                        <Input
                                            id="middle_name"
                                            value={data.middle_name}
                                            onChange={(event) => setData("middle_name", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">{requiredLabel("Last Name")}</Label>
                                        <Input id="last_name" value={data.last_name} onChange={(event) => setData("last_name", event.target.value)} />
                                        {fieldError("last_name")}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="suffix">Suffix</Label>
                                        <Input id="suffix" value={data.suffix} onChange={(event) => setData("suffix", event.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gender">{requiredLabel("Gender")}</Label>
                                    <Select value={data.gender} onValueChange={(value) => setData("gender", value)}>
                                        <SelectTrigger id="gender">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldError("gender")}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birth_date" className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {requiredLabel("Birth Date")}
                                    </Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={data.birth_date}
                                        onChange={(event) => setData("birth_date", event.target.value)}
                                        max={new Date().toISOString().split("T")[0]}
                                    />
                                    {fieldError("birth_date")}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input id="age" value={data.age} readOnly className="bg-muted" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" />
                                        Email
                                    </Label>
                                    <Input id="email" type="email" value={data.email} onChange={(event) => setData("email", event.target.value)} />
                                    {fieldError("email")}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5" />
                                        Phone
                                    </Label>
                                    <Input id="phone" value={data.phone} onChange={(event) => setData("phone", event.target.value)} />
                                </div>

                                {!isSHS ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="course_id" className="flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            {requiredLabel("Course")}
                                        </Label>
                                        <Select value={data.course_id} onValueChange={(value) => setData("course_id", value)}>
                                            <SelectTrigger id="course_id">
                                                <SelectValue placeholder="Select course" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.courses.map((course) => (
                                                    <SelectItem
                                                        key={course.value}
                                                        value={course.value.toString()}
                                                        disabled={course.is_active === false && course.value.toString() !== data.course_id}
                                                    >
                                                        {course.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldError("course_id")}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="shs_strand_id" className="flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            {requiredLabel("SHS Strand")}
                                        </Label>
                                        <Select value={data.shs_strand_id} onValueChange={(value) => setData("shs_strand_id", value)}>
                                            <SelectTrigger id="shs_strand_id">
                                                <SelectValue placeholder="Select strand" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.shs_strands.map((strand) => (
                                                    <SelectItem key={strand.value} value={strand.value.toString()}>
                                                        {strand.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldError("shs_strand_id")}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="academic_year">{requiredLabel(isSHS ? "Grade Level" : "Year Level")}</Label>
                                    <Select value={data.academic_year} onValueChange={(value) => setData("academic_year", value)}>
                                        <SelectTrigger id="academic_year">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearLevelOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldError("academic_year")}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <School className="text-primary h-5 w-5" />
                                    Family, Personal, and Education
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fathers_name">Father's Name</Label>
                                    <Input
                                        id="fathers_name"
                                        value={data.fathers_name}
                                        onChange={(event) => setData("fathers_name", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mothers_name">Mother's Name</Label>
                                    <Input
                                        id="mothers_name"
                                        value={data.mothers_name}
                                        onChange={(event) => setData("mothers_name", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birthplace">Birthplace</Label>
                                    <Input id="birthplace" value={data.birthplace} onChange={(event) => setData("birthplace", event.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="civil_status">Civil Status</Label>
                                    <Select value={data.civil_status} onValueChange={(value) => setData("civil_status", value)}>
                                        <SelectTrigger id="civil_status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CIVIL_STATUS_OPTIONS.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nationality">Nationality</Label>
                                    <Select
                                        value={data.nationality}
                                        onValueChange={(value) => {
                                            setData("nationality", value);
                                            setData("citizenship", value);
                                        }}
                                    >
                                        <SelectTrigger id="nationality">
                                            <SelectValue placeholder="Select nationality" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {NATIONALITY_OPTIONS.map((nationality) => (
                                                <SelectItem key={nationality.value} value={nationality.value}>
                                                    {nationality.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="religion">Religion</Label>
                                    <Input id="religion" value={data.religion} onChange={(event) => setData("religion", event.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height</Label>
                                    <Input id="height" value={data.height} onChange={(event) => setData("height", event.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Weight</Label>
                                    <Input id="weight" value={data.weight} onChange={(event) => setData("weight", event.target.value)} />
                                </div>

                                <div className="grid gap-4 border-t pt-5 md:col-span-2 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="elementary_school">Elementary School</Label>
                                        <Input
                                            id="elementary_school"
                                            value={data.elementary_school}
                                            onChange={(event) => setData("elementary_school", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="elementary_graduate_year">Elementary Year</Label>
                                        <Input
                                            id="elementary_graduate_year"
                                            value={data.elementary_graduate_year}
                                            onChange={(event) => setData("elementary_graduate_year", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="elementary_school_address">Elementary Address</Label>
                                        <Input
                                            id="elementary_school_address"
                                            value={data.elementary_school_address}
                                            onChange={(event) => setData("elementary_school_address", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="junior_high_school_name">Junior High School</Label>
                                        <Input
                                            id="junior_high_school_name"
                                            value={data.junior_high_school_name}
                                            onChange={(event) => setData("junior_high_school_name", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="junior_high_graduation_year">Junior High Year</Label>
                                        <Input
                                            id="junior_high_graduation_year"
                                            value={data.junior_high_graduation_year}
                                            onChange={(event) => setData("junior_high_graduation_year", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="junior_high_school_address">Junior High Address</Label>
                                        <Input
                                            id="junior_high_school_address"
                                            value={data.junior_high_school_address}
                                            onChange={(event) => setData("junior_high_school_address", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="senior_high_name">Senior High School</Label>
                                        <Input
                                            id="senior_high_name"
                                            value={data.senior_high_name}
                                            onChange={(event) => setData("senior_high_name", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="senior_high_graduate_year">Senior High Year</Label>
                                        <Input
                                            id="senior_high_graduate_year"
                                            value={data.senior_high_graduate_year}
                                            onChange={(event) => setData("senior_high_graduate_year", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="senior_high_address">Senior High Address</Label>
                                        <Input
                                            id="senior_high_address"
                                            value={data.senior_high_address}
                                            onChange={(event) => setData("senior_high_address", event.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Banknote className="text-primary h-5 w-5" />
                                    Reporting Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="region_of_origin">Region of Origin</Label>
                                    <Select value={data.region_of_origin} onValueChange={(value) => setData("region_of_origin", value)}>
                                        <SelectTrigger id="region_of_origin">
                                            <SelectValue placeholder="Select region" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.regions.map((region) => (
                                                <SelectItem key={region.value} value={region.value.toString()}>
                                                    {region.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ethnicity">Ethnicity</Label>
                                    <Input id="ethnicity" value={data.ethnicity} onChange={(event) => setData("ethnicity", event.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="province_of_origin">Province of Origin</Label>
                                    <Input
                                        id="province_of_origin"
                                        value={data.province_of_origin}
                                        onChange={(event) => setData("province_of_origin", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city_of_origin">City of Origin</Label>
                                    <Input
                                        id="city_of_origin"
                                        value={data.city_of_origin}
                                        onChange={(event) => setData("city_of_origin", event.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3 rounded-md border p-3 md:col-span-2">
                                    <Checkbox
                                        id="is_indigenous_person"
                                        checked={data.is_indigenous_person}
                                        onCheckedChange={(checked) => setData("is_indigenous_person", checked === true)}
                                    />
                                    <Label htmlFor="is_indigenous_person" className="cursor-pointer">
                                        Indigenous Person
                                    </Label>
                                </div>
                                {data.is_indigenous_person && (
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="indigenous_group">Indigenous Group</Label>
                                        <Input
                                            id="indigenous_group"
                                            value={data.indigenous_group}
                                            onChange={(event) => setData("indigenous_group", event.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="scholarship_type">Scholarship</Label>
                                    <Select value={data.scholarship_type} onValueChange={(value) => setData("scholarship_type", value)}>
                                        <SelectTrigger id="scholarship_type">
                                            <SelectValue placeholder="Select scholarship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.scholarship_types.map((type) => (
                                                <SelectItem key={type.value} value={type.value.toString()}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {data.scholarship_type !== "none" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="scholarship_details">Scholarship Details</Label>
                                        <Textarea
                                            id="scholarship_details"
                                            value={data.scholarship_details}
                                            onChange={(event) => setData("scholarship_details", event.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                )}

                                {isGraduated && (
                                    <div className="grid gap-5 border-t pt-5 md:col-span-2 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="employment_status" className="flex items-center gap-1.5">
                                                <Briefcase className="h-3.5 w-3.5" />
                                                Employment Status
                                            </Label>
                                            <Select value={data.employment_status} onValueChange={(value) => setData("employment_status", value)}>
                                                <SelectTrigger id="employment_status">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.employment_statuses.map((status) => (
                                                        <SelectItem key={status.value} value={status.value.toString()}>
                                                            {status.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {showEmployment && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="employer_name">Employer</Label>
                                                    <Input
                                                        id="employer_name"
                                                        value={data.employer_name}
                                                        onChange={(event) => setData("employer_name", event.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="job_position">Position</Label>
                                                    <Input
                                                        id="job_position"
                                                        value={data.job_position}
                                                        onChange={(event) => setData("job_position", event.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="employment_date">Employment Date</Label>
                                                    <Input
                                                        id="employment_date"
                                                        type="date"
                                                        value={data.employment_date}
                                                        onChange={(event) => setData("employment_date", event.target.value)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 rounded-md border p-3">
                                                    <Checkbox
                                                        id="employed_by_institution"
                                                        checked={data.employed_by_institution}
                                                        onCheckedChange={(checked) => setData("employed_by_institution", checked === true)}
                                                    />
                                                    <Label htmlFor="employed_by_institution" className="cursor-pointer">
                                                        Employed by this institution
                                                    </Label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {isWithdrawn && (
                                    <div className="grid gap-5 border-t pt-5 md:col-span-2 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="attrition_category">Attrition Category</Label>
                                            <Select value={data.attrition_category} onValueChange={(value) => setData("attrition_category", value)}>
                                                <SelectTrigger id="attrition_category">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.attrition_categories.map((category) => (
                                                        <SelectItem key={category.value} value={category.value.toString()}>
                                                            {category.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="withdrawal_date">Withdrawal Date</Label>
                                            <Input
                                                id="withdrawal_date"
                                                type="date"
                                                value={data.withdrawal_date}
                                                onChange={(event) => setData("withdrawal_date", event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dropout_date">Dropout Date</Label>
                                            <Input
                                                id="dropout_date"
                                                type="date"
                                                value={data.dropout_date}
                                                onChange={(event) => setData("dropout_date", event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="withdrawal_reason">Withdrawal Reason</Label>
                                            <Textarea
                                                id="withdrawal_reason"
                                                value={data.withdrawal_reason}
                                                onChange={(event) => setData("withdrawal_reason", event.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Textarea
                                        id="remarks"
                                        value={data.remarks}
                                        onChange={(event) => setData("remarks", event.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Phone className="text-primary h-5 w-5" />
                                    Contact and Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="personal_contact">Student Contact</Label>
                                    <Input
                                        id="personal_contact"
                                        value={data.personal_contact}
                                        onChange={(event) => setData("personal_contact", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact_name">Guardian Name</Label>
                                    <Input
                                        id="emergency_contact_name"
                                        value={data.emergency_contact_name}
                                        onChange={(event) => setData("emergency_contact_name", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact_phone">Guardian Phone</Label>
                                    <Input
                                        id="emergency_contact_phone"
                                        value={data.emergency_contact_phone}
                                        onChange={(event) => setData("emergency_contact_phone", event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact_address">Guardian Address</Label>
                                    <Textarea
                                        id="emergency_contact_address"
                                        value={data.emergency_contact_address}
                                        onChange={(event) => setData("emergency_contact_address", event.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2 border-t pt-5">
                                    <Label htmlFor="current_address" className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" />
                                        Current Address
                                    </Label>
                                    <Textarea
                                        id="current_address"
                                        value={data.current_address}
                                        onChange={(event) => setData("current_address", event.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="permanent_address">Permanent Address</Label>
                                    <Textarea
                                        id="permanent_address"
                                        value={data.permanent_address}
                                        onChange={(event) => setData("permanent_address", event.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BookOpen className="text-primary h-5 w-5" />
                                    Current Subjects
                                </CardTitle>
                                <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" size="sm" variant="outline">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md overflow-hidden p-0">
                                        <DialogHeader className="px-4 pt-4 pb-2">
                                            <DialogTitle>Add Subject</DialogTitle>
                                            <DialogDescription>Search for a subject to add to this student's current load.</DialogDescription>
                                        </DialogHeader>
                                        <Command className="border-t">
                                            <CommandInput placeholder="Search subjects..." />
                                            <CommandList>
                                                <CommandEmpty>No subject found.</CommandEmpty>
                                                <CommandGroup heading="Available Subjects">
                                                    {options.subjects.map((subject) => (
                                                        <CommandItem
                                                            key={subject.value}
                                                            onSelect={() => setSelectedSubject(subject.value.toString())}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <span>{subject.label}</span>
                                                            {selectedSubject === subject.value.toString() && <Check className="h-4 w-4" />}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                        <DialogFooter className="bg-muted/50 p-4">
                                            <Button type="button" onClick={handleAddSubject} disabled={!selectedSubject}>
                                                Add Subject
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {current_enrollments.length === 0 ? (
                                    <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                                        No subjects enrolled for the current period.
                                    </div>
                                ) : (
                                    current_enrollments.map((enrollment) => (
                                        <div key={enrollment.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                                            <div className="min-w-0">
                                                <p className="font-medium">{enrollment.subject.code}</p>
                                                <p className="text-muted-foreground truncate text-sm">{enrollment.subject.title}</p>
                                                <p className="text-muted-foreground text-xs">{enrollment.subject.units} units</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveSubject(enrollment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <LayoutGrid className="text-primary h-5 w-5" />
                                    Current Classes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {current_classes.length === 0 ? (
                                    <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                                        No classes scheduled for the current period.
                                    </div>
                                ) : (
                                    current_classes.map((classEnrollment) => (
                                        <div key={classEnrollment.id} className="rounded-md border p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-medium">{classEnrollment.class?.subject?.code || "N/A"}</p>
                                                    <p className="text-muted-foreground truncate text-sm">
                                                        {classEnrollment.class?.subject?.title || "No subject assigned"}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">{classEnrollment.class?.section || "N/A"}</Badge>
                                            </div>
                                            <Separator className="my-3" />
                                            <p className="text-muted-foreground text-sm">{classEnrollment.class?.faculty?.full_name || "TBA"}</p>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Button type="submit" disabled={processing} className="w-full lg:hidden">
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {processing ? "Saving..." : "Save Student"}
                        </Button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
