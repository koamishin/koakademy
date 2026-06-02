import AdminLayout from "@/components/administrators/admin-layout";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    ArrowLeft,
    Banknote,
    BookOpen,
    Briefcase,
    Calendar,
    ChevronDown,
    Copy,
    Eye,
    FilePlus2,
    GraduationCap,
    Hash,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    School,
    User as UserIcon,
    UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

declare const route: (name: string, params?: Record<string, unknown>) => string;

interface Option {
    value: string | number;
    label: string;
    is_active?: boolean;
}

interface IncomeBracketOption {
    value: string;
    label: string;
}

interface IncomeModeOption {
    value: string;
    label: string;
    brackets: IncomeBracketOption[];
}

interface CreateStudentProps {
    user: User;
    options: {
        types: Option[];
        statuses: Option[];
        scholarship_types: Option[];
        employment_statuses: Option[];
        attrition_categories: Option[];
        courses: Option[];
        shs_strands: Option[];
        religions: Option[];
        regions: Option[];
        income_modes: IncomeModeOption[];
        default_income_mode: string;
    };
}

interface StudentCreateForm {
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
    religion: string;
    course_id: string;
    shs_strand_id: string;
    academic_year: string;
    remarks: string;
    personal_contact: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_address: string;
    emergency_contact_relationship: string;
    facebook_contact: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    fathers_name: string;
    father_occupation: string;
    father_contact: string;
    father_email: string;
    mothers_name: string;
    mother_occupation: string;
    mother_contact: string;
    mother_email: string;
    guardian_name: string;
    guardian_relationship: string;
    guardian_contact: string;
    guardian_email: string;
    family_address: string;
    current_address: string;
    permanent_address: string;
    birthplace: string;
    citizenship: string;
    weight: string;
    height: string;
    elementary_school: string;
    elementary_graduate_year: string;
    elementary_school_address: string;
    junior_high_school_name: string;
    junior_high_graduation_year: string;
    junior_high_school_address: string;
    senior_high_name: string;
    senior_high_graduate_year: string;
    senior_high_address: string;
    college_school: string;
    college_course: string;
    college_year_graduated: string;
    vocational_school: string;
    vocational_course: string;
    vocational_year_graduated: string;
    ethnicity: string;
    region_of_origin: string;
    province_of_origin: string;
    city_of_origin: string;
    is_indigenous_person: boolean;
    indigenous_group: string;
    is_pwd: boolean;
    pwd_type: string;
    is_solo_parent: boolean;
    is_senior_citizen: boolean;
    is_magna_carta: boolean;
    is_underprivileged: boolean;
    is_first_generation: boolean;
    income_bracket_mode: string;
    use_same_parent_income: boolean;
    family_income_bracket: string;
    father_income_bracket: string;
    mother_income_bracket: string;
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
    submit_action: string;
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

const RELATIONSHIP_OPTIONS = [
    { value: "mother", label: "Mother" },
    { value: "father", label: "Father" },
    { value: "sibling", label: "Sibling" },
    { value: "spouse", label: "Spouse" },
    { value: "grandparent", label: "Grandparent" },
    { value: "aunt", label: "Aunt" },
    { value: "uncle", label: "Uncle" },
    { value: "cousin", label: "Cousin" },
    { value: "legal_guardian", label: "Legal Guardian" },
    { value: "other", label: "Other" },
];

const ETHNICITY_OPTIONS = [
    { value: "tagalog", label: "Tagalog" },
    { value: "cebuano", label: "Cebuano" },
    { value: "ilocano", label: "Ilocano" },
    { value: "hiligaynon", label: "Hiligaynon (Ilonggo)" },
    { value: "bicolano", label: "Bicolano" },
    { value: "waray", label: "Waray" },
    { value: "kapampangan", label: "Kapampangan" },
    { value: "pangasinense", label: "Pangasinense" },
    { value: "bisaya", label: "Bisaya" },
    { value: "maranao", label: "Maranao" },
    { value: "tausug", label: "Tausug" },
    { value: "maguindanao", label: "Maguindanao" },
    { value: "other", label: "Other" },
];

const BLANK_FORM: StudentCreateForm = {
    student_type: "college",
    student_id: "",
    lrn: "",
    status: "enrolled",
    first_name: "",
    last_name: "",
    middle_name: "",
    suffix: "",
    gender: "male",
    birth_date: "",
    age: "",
    email: "",
    phone: "",
    civil_status: "single",
    nationality: "filipino",
    religion: "",
    course_id: "",
    shs_strand_id: "",
    academic_year: "1",
    remarks: "",
    personal_contact: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_address: "",
    emergency_contact_relationship: "",
    facebook_contact: "",
    twitter: "",
    instagram: "",
    linkedin: "",
    fathers_name: "",
    father_occupation: "",
    father_contact: "",
    father_email: "",
    mothers_name: "",
    mother_occupation: "",
    mother_contact: "",
    mother_email: "",
    guardian_name: "",
    guardian_relationship: "",
    guardian_contact: "",
    guardian_email: "",
    family_address: "",
    current_address: "",
    permanent_address: "",
    birthplace: "",
    citizenship: "filipino",
    weight: "",
    height: "",
    elementary_school: "",
    elementary_graduate_year: "",
    elementary_school_address: "",
    junior_high_school_name: "",
    junior_high_graduation_year: "",
    junior_high_school_address: "",
    senior_high_name: "",
    senior_high_graduate_year: "",
    senior_high_address: "",
    college_school: "",
    college_course: "",
    college_year_graduated: "",
    vocational_school: "",
    vocational_course: "",
    vocational_year_graduated: "",
    ethnicity: "",
    region_of_origin: "",
    province_of_origin: "",
    city_of_origin: "",
    is_indigenous_person: false,
    indigenous_group: "",
    is_pwd: false,
    pwd_type: "",
    is_solo_parent: false,
    is_senior_citizen: false,
    is_magna_carta: false,
    is_underprivileged: false,
    is_first_generation: false,
    income_bracket_mode: "annual",
    use_same_parent_income: true,
    family_income_bracket: "",
    father_income_bracket: "",
    mother_income_bracket: "",
    scholarship_type: "none",
    scholarship_details: "",
    employment_status: "not_applicable",
    employer_name: "",
    job_position: "",
    employment_date: "",
    employed_by_institution: false,
    withdrawal_date: "",
    withdrawal_reason: "",
    attrition_category: "",
    dropout_date: "",
    submit_action: "view",
};

function requiredLabel(label: string) {
    return (
        <>
            {label} <span className="text-destructive">*</span>
        </>
    );
}

function capitalizeWords(value: string): string {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10, 14)}`;
}

export default function AdministratorStudentCreate({ user, options }: CreateStudentProps) {
    const [previewId, setPreviewId] = useState<number | null>(null);
    const [isGeneratingId, setIsGeneratingId] = useState(false);
    const [idGenerationError, setIdGenerationError] = useState<string | null>(null);

    const { data, setData, post, processing, errors, transform } = useForm<StudentCreateForm>({
        ...BLANK_FORM,
        income_bracket_mode: options.default_income_mode || BLANK_FORM.income_bracket_mode,
    });

    const formRef = useRef<HTMLFormElement>(null);
    const submitActionRef = useRef("view");

    useEffect(() => {
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
            const firstKey = errorKeys[0];
            const element = document.getElementById(firstKey);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus();
            }
        }
    }, [errors]);

    const isSHS = data.student_type === "shs";
    const isGraduated = data.status === "graduated";
    const isWithdrawn = data.status === "withdrawn" || data.status === "dropped";
    const showEmployment =
        isGraduated &&
        data.employment_status !== "not_applicable" &&
        data.employment_status !== "unemployed" &&
        data.employment_status !== "further_study";

    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        family: false,
        reporting: false,
        contact: false,
    });

    const toggleSection = (key: string) => {
        setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Keyboard shortcut: Ctrl+Enter to submit
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                formRef.current?.requestSubmit();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Count filled required fields for progress
    const requiredFields: (keyof StudentCreateForm)[] = [
        "student_type",
        "status",
        "first_name",
        "last_name",
        "gender",
        "birth_date",
        "academic_year",
        ...(isSHS ? (["lrn", "shs_strand_id"] as const) : (["student_id", "course_id"] as const)),
    ];
    const filledRequired = requiredFields.filter((f) => {
        const val = data[f];
        return val !== "" && val !== false;
    }).length;
    const progressPercent = Math.round((filledRequired / requiredFields.length) * 100);

    const fieldError = (field: keyof StudentCreateForm) => (errors[field] ? <p className="text-destructive text-sm">{errors[field]}</p> : null);

    const selectedIncomeMode = useMemo(() => {
        return options.income_modes.find((mode) => mode.value === data.income_bracket_mode) ?? options.income_modes[0] ?? null;
    }, [options.income_modes, data.income_bracket_mode]);

    const activeIncomeBrackets = selectedIncomeMode?.brackets ?? [];

    useEffect(() => {
        setData("family_income_bracket", "");
        setData("father_income_bracket", "");
        setData("mother_income_bracket", "");
    }, [data.income_bracket_mode]);

    useEffect(() => {
        if (data.use_same_parent_income) {
            setData("father_income_bracket", "");
            setData("mother_income_bracket", "");
            return;
        }

        setData("family_income_bracket", "");
    }, [data.use_same_parent_income]);

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

    const fetchGeneratedId = useCallback(async () => {
        if (isSHS) {
            setPreviewId(null);
            setIdGenerationError(null);
            return;
        }

        setIsGeneratingId(true);
        setIdGenerationError(null);

        try {
            const response = await fetch(route("administrators.students.generate-id", { type: data.student_type }));

            if (!response.ok) {
                setIdGenerationError("Unable to generate an ID");
                return;
            }

            const result = (await response.json()) as { id?: number };

            if (result.id) {
                setPreviewId(result.id);
                setData("student_id", result.id.toString());
                return;
            }

            setIdGenerationError("No ID available");
        } catch {
            setIdGenerationError("Unable to generate an ID");
        } finally {
            setIsGeneratingId(false);
        }
    }, [data.student_type, isSHS, setData]);

    useEffect(() => {
        if (!isSHS) {
            void fetchGeneratedId();
        }
    }, [fetchGeneratedId, isSHS]);

    useEffect(() => {
        if (isSHS) {
            setData("course_id", "");
            setData("student_id", "");

            if (data.academic_year !== "11" && data.academic_year !== "12") {
                setData("academic_year", "11");
            }

            return;
        }

        setData("lrn", "");
        setData("shs_strand_id", "");

        if (data.academic_year === "11" || data.academic_year === "12") {
            setData("academic_year", "1");
        }
    }, [data.student_type]);

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

    // Sync personal_contact with phone
    useEffect(() => {
        setData("personal_contact", data.phone);
    }, [data.phone]);

    // Keep applicant guardian details aligned with the visible guardian contact fields.
    useEffect(() => {
        setData("guardian_name", data.emergency_contact_name);
    }, [data.emergency_contact_name]);

    useEffect(() => {
        setData("guardian_contact", data.emergency_contact_phone);
    }, [data.emergency_contact_phone]);

    useEffect(() => {
        setData("guardian_relationship", data.emergency_contact_relationship);
    }, [data.emergency_contact_relationship]);

    const submitWithAction = (action: string) => {
        submitActionRef.current = action;
        formRef.current?.requestSubmit();
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        transform((formData) => ({
            ...formData,
            student_id: !isSHS && !formData.student_id && previewId ? previewId.toString() : formData.student_id,
            academic_year: parseInt(formData.academic_year, 10),
            course_id: formData.course_id ? parseInt(formData.course_id, 10) : "",
            shs_strand_id: formData.shs_strand_id ? parseInt(formData.shs_strand_id, 10) : "",
            weight: formData.weight ? parseFloat(formData.weight) : "",
            height: formData.height ? parseFloat(formData.height) : "",
            age: formData.age ? parseInt(formData.age, 10) : "",
            submit_action: submitActionRef.current,
        }));

        post(route("administrators.students.store"), {
            onSuccess: () => {
                toast.success("Student created successfully");
            },
            onError: (formErrors) => {
                toast.error("Failed to create student", {
                    description: Object.values(formErrors)[0] || "Please check the form for errors.",
                });
            },
        });
    };

    return (
        <AdminLayout user={user} title="Create Student">
            <Head title="Administrators - Create Student" />

            <form ref={formRef} onSubmit={submit} className="mx-auto max-w-6xl space-y-6 pb-10">
                <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Create Student</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <Badge variant="secondary">{isSHS ? "Senior High" : "College / Program"}</Badge>
                            {!isSHS && data.student_id && <Badge variant="outline">ID {data.student_id}</Badge>}
                            <span className="text-muted-foreground text-xs">
                                {filledRequired}/{requiredFields.length} req. fields
                            </span>
                        </div>
                        <div className="bg-secondary mt-2 h-1.5 w-full max-w-xs rounded-full">
                            <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route("administrators.students.index")}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div className="flex gap-1">
                            <Button type="button" disabled={processing} onClick={() => submitWithAction("view")}>
                                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                                {processing ? "Creating..." : "Submit & View"}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" disabled={processing} aria-label="More create actions">
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuItem onClick={() => submitWithAction("view")} className="cursor-pointer">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Submit and View the record
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => submitWithAction("create_another")} className="cursor-pointer">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Submit and create another one
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => submitWithAction("create_enrollment")} className="cursor-pointer">
                                        <FilePlus2 className="mr-2 h-4 w-4" />
                                        Submit and create an enrollment
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserIcon className="text-primary h-5 w-5" />
                            Student Record
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(180px,0.7fr)_minmax(220px,0.9fr)]">
                        <div className="space-y-2 md:col-span-2 xl:col-span-1">
                            <Label>{requiredLabel("Student Type")}</Label>
                            <div className="flex flex-wrap gap-2">
                                {options.types.map((type) => (
                                    <Button
                                        key={type.value}
                                        type="button"
                                        variant={data.student_type === type.value ? "default" : "outline"}
                                        onClick={() => setData("student_type", type.value.toString())}
                                        className="h-auto min-h-9 flex-1 basis-[9.5rem] px-3 py-2 text-center leading-snug whitespace-normal"
                                    >
                                        {type.label}
                                    </Button>
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
                                    <Button type="button" variant="outline" size="icon" onClick={fetchGeneratedId} disabled={isGeneratingId}>
                                        <RefreshCw className={cn("h-4 w-4", isGeneratingId && "animate-spin")} />
                                    </Button>
                                </div>
                                {idGenerationError && <p className="text-destructive text-sm">{idGenerationError}</p>}
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
                                            onBlur={(event) => setData("first_name", capitalizeWords(event.target.value))}
                                        />
                                        {fieldError("first_name")}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="middle_name">Middle Name</Label>
                                        <Input
                                            id="middle_name"
                                            value={data.middle_name}
                                            onChange={(event) => setData("middle_name", event.target.value)}
                                            onBlur={(event) => setData("middle_name", capitalizeWords(event.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">{requiredLabel("Last Name")}</Label>
                                        <Input
                                            id="last_name"
                                            value={data.last_name}
                                            onChange={(event) => setData("last_name", event.target.value)}
                                            onBlur={(event) => setData("last_name", capitalizeWords(event.target.value))}
                                        />
                                        {fieldError("last_name")}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="suffix">Suffix</Label>
                                        <Input
                                            id="suffix"
                                            value={data.suffix}
                                            onChange={(event) => setData("suffix", event.target.value.toUpperCase())}
                                        />
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
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(event) => setData("phone", formatPhoneNumber(event.target.value))}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="current_address" className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                            Current Address
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setData("current_address", data.permanent_address)}
                                            disabled={!data.permanent_address}
                                            className="h-auto px-2 py-1 text-xs"
                                        >
                                            <Copy className="mr-1 h-3 w-3" />
                                            Same as Permanent
                                        </Button>
                                    </div>
                                    <Textarea
                                        id="current_address"
                                        value={data.current_address}
                                        onChange={(event) => setData("current_address", event.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="permanent_address">Permanent Address</Label>
                                    <Textarea
                                        id="permanent_address"
                                        value={data.permanent_address}
                                        onChange={(event) => setData("permanent_address", event.target.value)}
                                        rows={3}
                                    />
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
                                                        disabled={course.is_active === false}
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
                            <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection("family")}>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <School className="text-primary h-5 w-5" />
                                        Family, Personal, and Education
                                    </CardTitle>
                                    <ChevronDown
                                        className={cn(
                                            "text-muted-foreground h-5 w-5 transition-transform duration-200",
                                            collapsedSections.family && "-rotate-90",
                                        )}
                                    />
                                </div>
                            </CardHeader>
                            {!collapsedSections.family && (
                                <CardContent className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="fathers_name">Father's Name</Label>
                                        <AutocompleteInput
                                            id="fathers_name"
                                            value={data.fathers_name}
                                            onChange={(value: string) => setData("fathers_name", value)}
                                            fieldName="fathers_name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mothers_name">Mother's Name</Label>
                                        <AutocompleteInput
                                            id="mothers_name"
                                            value={data.mothers_name}
                                            onChange={(value: string) => setData("mothers_name", value)}
                                            fieldName="mothers_name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="birthplace">Birthplace</Label>
                                        <AutocompleteInput
                                            id="birthplace"
                                            value={data.birthplace}
                                            onChange={(value: string) => setData("birthplace", value)}
                                            fieldName="birthplace"
                                        />
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
                                        <Label htmlFor="citizenship">Citizenship</Label>
                                        <Input
                                            id="citizenship"
                                            value={data.citizenship}
                                            onChange={(event) => setData("citizenship", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="religion">Religion</Label>
                                        <AutocompleteInput
                                            id="religion"
                                            value={data.religion}
                                            onChange={(value: string) => setData("religion", value)}
                                            fieldName="religion"
                                            placeholder="Type or choose a religion"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="height">Height</Label>
                                        <Input
                                            id="height"
                                            value={data.height}
                                            onChange={(event) => setData("height", event.target.value)}
                                            placeholder="e.g. 170"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="weight">Weight</Label>
                                        <Input
                                            id="weight"
                                            value={data.weight}
                                            onChange={(event) => setData("weight", event.target.value)}
                                            placeholder="e.g. 60"
                                        />
                                    </div>

                                    <div className="grid gap-4 border-t pt-5 md:col-span-2 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="elementary_school">Elementary School</Label>
                                            <AutocompleteInput
                                                id="elementary_school"
                                                value={data.elementary_school}
                                                onChange={(value: string) => setData("elementary_school", value)}
                                                fieldName="elementary_school"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="elementary_graduate_year">Elementary Year</Label>
                                            <Input
                                                id="elementary_graduate_year"
                                                type="number"
                                                min={1900}
                                                max={new Date().getFullYear()}
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
                                            <AutocompleteInput
                                                id="junior_high_school_name"
                                                value={data.junior_high_school_name}
                                                onChange={(value: string) => setData("junior_high_school_name", value)}
                                                fieldName="junior_high_school_name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="junior_high_graduation_year">Junior High Year</Label>
                                            <Input
                                                id="junior_high_graduation_year"
                                                type="number"
                                                min={1900}
                                                max={new Date().getFullYear()}
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
                                            <AutocompleteInput
                                                id="senior_high_name"
                                                value={data.senior_high_name}
                                                onChange={(value: string) => setData("senior_high_name", value)}
                                                fieldName="senior_high_name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="senior_high_graduate_year">Senior High Year</Label>
                                            <Input
                                                id="senior_high_graduate_year"
                                                type="number"
                                                min={1900}
                                                max={new Date().getFullYear()}
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
                                        <div className="space-y-2">
                                            <Label htmlFor="college_school">College School (if transferee)</Label>
                                            <AutocompleteInput
                                                id="college_school"
                                                value={data.college_school}
                                                onChange={(value: string) => setData("college_school", value)}
                                                fieldName="college_school"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="college_course">College Course</Label>
                                            <AutocompleteInput
                                                id="college_course"
                                                value={data.college_course}
                                                onChange={(value: string) => setData("college_course", value)}
                                                fieldName="college_course"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="college_year_graduated">College Year Graduated</Label>
                                            <Input
                                                id="college_year_graduated"
                                                type="number"
                                                min={1900}
                                                max={new Date().getFullYear()}
                                                value={data.college_year_graduated}
                                                onChange={(event) => setData("college_year_graduated", event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vocational_school">Vocational School</Label>
                                            <AutocompleteInput
                                                id="vocational_school"
                                                value={data.vocational_school}
                                                onChange={(value: string) => setData("vocational_school", value)}
                                                fieldName="vocational_school"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vocational_course">Vocational Course</Label>
                                            <AutocompleteInput
                                                id="vocational_course"
                                                value={data.vocational_course}
                                                onChange={(value: string) => setData("vocational_course", value)}
                                                fieldName="vocational_course"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vocational_year_graduated">Vocational Year Graduated</Label>
                                            <Input
                                                id="vocational_year_graduated"
                                                type="number"
                                                min={1900}
                                                max={new Date().getFullYear()}
                                                value={data.vocational_year_graduated}
                                                onChange={(event) => setData("vocational_year_graduated", event.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        <Card>
                            <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection("reporting")}>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Banknote className="text-primary h-5 w-5" />
                                        Reporting Details
                                    </CardTitle>
                                    <ChevronDown
                                        className={cn(
                                            "text-muted-foreground h-5 w-5 transition-transform duration-200",
                                            collapsedSections.reporting && "-rotate-90",
                                        )}
                                    />
                                </div>
                            </CardHeader>
                            {!collapsedSections.reporting && (
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
                                        <Select value={data.ethnicity} onValueChange={(value) => setData("ethnicity", value)}>
                                            <SelectTrigger id="ethnicity">
                                                <SelectValue placeholder="Select ethnicity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ETHNICITY_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="province_of_origin">Province of Origin</Label>
                                        <AutocompleteInput
                                            id="province_of_origin"
                                            value={data.province_of_origin}
                                            onChange={(value: string) => setData("province_of_origin", value)}
                                            fieldName="province_of_origin"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city_of_origin">City of Origin</Label>
                                        <AutocompleteInput
                                            id="city_of_origin"
                                            value={data.city_of_origin}
                                            onChange={(value: string) => setData("city_of_origin", value)}
                                            fieldName="city_of_origin"
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
                                    <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
                                        <div className="flex items-center gap-2 rounded-md border p-3">
                                            <Checkbox
                                                id="is_pwd"
                                                checked={data.is_pwd}
                                                onCheckedChange={(checked) => setData("is_pwd", checked === true)}
                                            />
                                            <Label htmlFor="is_pwd" className="cursor-pointer">
                                                PWD
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md border p-3">
                                            <Checkbox
                                                id="is_solo_parent"
                                                checked={data.is_solo_parent}
                                                onCheckedChange={(checked) => setData("is_solo_parent", checked === true)}
                                            />
                                            <Label htmlFor="is_solo_parent" className="cursor-pointer">
                                                Solo Parent
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md border p-3">
                                            <Checkbox
                                                id="is_senior_citizen"
                                                checked={data.is_senior_citizen}
                                                onCheckedChange={(checked) => setData("is_senior_citizen", checked === true)}
                                            />
                                            <Label htmlFor="is_senior_citizen" className="cursor-pointer">
                                                Senior Citizen
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md border p-3">
                                            <Checkbox
                                                id="is_magna_carta"
                                                checked={data.is_magna_carta}
                                                onCheckedChange={(checked) => setData("is_magna_carta", checked === true)}
                                            />
                                            <Label htmlFor="is_magna_carta" className="cursor-pointer">
                                                Magna Carta
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md border p-3">
                                            <Checkbox
                                                id="is_underprivileged"
                                                checked={data.is_underprivileged}
                                                onCheckedChange={(checked) => setData("is_underprivileged", checked === true)}
                                            />
                                            <Label htmlFor="is_underprivileged" className="cursor-pointer">
                                                Underprivileged
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md border p-3">
                                            <Checkbox
                                                id="is_first_generation"
                                                checked={data.is_first_generation}
                                                onCheckedChange={(checked) => setData("is_first_generation", checked === true)}
                                            />
                                            <Label htmlFor="is_first_generation" className="cursor-pointer">
                                                First Generation
                                            </Label>
                                        </div>
                                    </div>
                                    {data.is_pwd && (
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="pwd_type">PWD Type</Label>
                                            <Input
                                                id="pwd_type"
                                                value={data.pwd_type}
                                                onChange={(event) => setData("pwd_type", event.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="grid gap-4 border-t pt-5 md:col-span-2 md:grid-cols-2">
                                        <div className="space-y-1 md:col-span-2">
                                            <h3 className="font-medium">Family Income</h3>
                                            <p className="text-muted-foreground text-sm">
                                                Set income basis first, then choose one shared family range or separate father and mother ranges.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="income_bracket_mode">Income Basis</Label>
                                            <Select value={data.income_bracket_mode} onValueChange={(value) => setData("income_bracket_mode", value)}>
                                                <SelectTrigger id="income_bracket_mode">
                                                    <SelectValue placeholder="Select income basis" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.income_modes.map((mode) => (
                                                        <SelectItem key={mode.value} value={mode.value}>
                                                            {mode.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-md border p-3">
                                            <Checkbox
                                                id="use_same_parent_income"
                                                checked={data.use_same_parent_income}
                                                onCheckedChange={(checked) => setData("use_same_parent_income", checked === true)}
                                            />
                                            <Label htmlFor="use_same_parent_income" className="cursor-pointer">
                                                Father and mother have the same income bracket
                                            </Label>
                                        </div>
                                        {data.use_same_parent_income ? (
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="family_income_bracket">Family Income Bracket</Label>
                                                <Select
                                                    value={data.family_income_bracket}
                                                    onValueChange={(value) => setData("family_income_bracket", value)}
                                                >
                                                    <SelectTrigger id="family_income_bracket">
                                                        <SelectValue placeholder="Select income range..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {activeIncomeBrackets.map((bracket) => (
                                                            <SelectItem key={bracket.value} value={bracket.value}>
                                                                {bracket.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="father_income_bracket">Father Income Bracket</Label>
                                                    <Select
                                                        value={data.father_income_bracket}
                                                        onValueChange={(value) => setData("father_income_bracket", value)}
                                                    >
                                                        <SelectTrigger id="father_income_bracket">
                                                            <SelectValue placeholder="Select income range..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {activeIncomeBrackets.map((bracket) => (
                                                                <SelectItem key={bracket.value} value={bracket.value}>
                                                                    {bracket.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="mother_income_bracket">Mother Income Bracket</Label>
                                                    <Select
                                                        value={data.mother_income_bracket}
                                                        onValueChange={(value) => setData("mother_income_bracket", value)}
                                                    >
                                                        <SelectTrigger id="mother_income_bracket">
                                                            <SelectValue placeholder="Select income range..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {activeIncomeBrackets.map((bracket) => (
                                                                <SelectItem key={bracket.value} value={bracket.value}>
                                                                    {bracket.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </>
                                        )}
                                    </div>
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
                                                        <AutocompleteInput
                                                            id="employer_name"
                                                            value={data.employer_name}
                                                            onChange={(value: string) => setData("employer_name", value)}
                                                            fieldName="employer_name"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="job_position">Position</Label>
                                                        <AutocompleteInput
                                                            id="job_position"
                                                            value={data.job_position}
                                                            onChange={(value: string) => setData("job_position", value)}
                                                            fieldName="job_position"
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
                                                <Select
                                                    value={data.attrition_category}
                                                    onValueChange={(value) => setData("attrition_category", value)}
                                                >
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
                            )}
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection("contact")}>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Phone className="text-primary h-5 w-5" />
                                        Contact and Address
                                    </CardTitle>
                                    <ChevronDown
                                        className={cn(
                                            "text-muted-foreground h-5 w-5 transition-transform duration-200",
                                            collapsedSections.contact && "-rotate-90",
                                        )}
                                    />
                                </div>
                            </CardHeader>
                            {!collapsedSections.contact && (
                                <CardContent className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="personal_contact">Student Contact</Label>
                                        <Input
                                            id="personal_contact"
                                            value={data.personal_contact}
                                            readOnly
                                            className="bg-muted text-muted-foreground"
                                        />
                                        <p className="text-muted-foreground text-xs">Auto-filled from Phone above</p>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="facebook_contact">Facebook</Label>
                                            <Input
                                                id="facebook_contact"
                                                value={data.facebook_contact}
                                                onChange={(event) => setData("facebook_contact", event.target.value)}
                                                placeholder="facebook.com/username"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="instagram">Instagram</Label>
                                            <Input
                                                id="instagram"
                                                value={data.instagram}
                                                onChange={(event) => setData("instagram", event.target.value)}
                                                placeholder="@username"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="twitter">Twitter/X</Label>
                                            <Input
                                                id="twitter"
                                                value={data.twitter}
                                                onChange={(event) => setData("twitter", event.target.value)}
                                                placeholder="@username"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="linkedin">LinkedIn</Label>
                                            <Input
                                                id="linkedin"
                                                value={data.linkedin}
                                                onChange={(event) => setData("linkedin", event.target.value)}
                                                placeholder="linkedin.com/in/username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_name">Guardian Name</Label>
                                        <AutocompleteInput
                                            id="emergency_contact_name"
                                            value={data.emergency_contact_name}
                                            onChange={(value: string) => setData("emergency_contact_name", value)}
                                            fieldName="emergency_contact_name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_phone">Guardian Phone</Label>
                                        <Input
                                            id="emergency_contact_phone"
                                            value={data.emergency_contact_phone}
                                            onChange={(event) => setData("emergency_contact_phone", formatPhoneNumber(event.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergency_contact_relationship">Guardian Relationship</Label>
                                        <Select
                                            value={data.emergency_contact_relationship}
                                            onValueChange={(value) => setData("emergency_contact_relationship", value)}
                                        >
                                            <SelectTrigger id="emergency_contact_relationship">
                                                <SelectValue placeholder="Select relationship" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RELATIONSHIP_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-muted-foreground text-xs">Also used as the applicant guardian relationship.</p>
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
                                    <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="father_occupation">Father Occupation</Label>
                                            <AutocompleteInput
                                                id="father_occupation"
                                                value={data.father_occupation}
                                                onChange={(value: string) => setData("father_occupation", value)}
                                                fieldName="father_occupation"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="father_contact">Father Contact</Label>
                                            <Input
                                                id="father_contact"
                                                value={data.father_contact}
                                                onChange={(event) => setData("father_contact", formatPhoneNumber(event.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="father_email">Father Email</Label>
                                            <Input
                                                id="father_email"
                                                type="email"
                                                value={data.father_email}
                                                onChange={(event) => setData("father_email", event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mother_occupation">Mother Occupation</Label>
                                            <AutocompleteInput
                                                id="mother_occupation"
                                                value={data.mother_occupation}
                                                onChange={(value: string) => setData("mother_occupation", value)}
                                                fieldName="mother_occupation"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mother_contact">Mother Contact</Label>
                                            <Input
                                                id="mother_contact"
                                                value={data.mother_contact}
                                                onChange={(event) => setData("mother_contact", formatPhoneNumber(event.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mother_email">Mother Email</Label>
                                            <Input
                                                id="mother_email"
                                                type="email"
                                                value={data.mother_email}
                                                onChange={(event) => setData("mother_email", event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="guardian_email">Guardian Email</Label>
                                            <Input
                                                id="guardian_email"
                                                type="email"
                                                value={data.guardian_email}
                                                onChange={(event) => setData("guardian_email", event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="family_address">Family Address</Label>
                                            <Textarea
                                                id="family_address"
                                                value={data.family_address}
                                                onChange={(event) => setData("family_address", event.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Sticky bottom bar */}
                <div className="bg-background/95 sticky bottom-0 z-10 -mx-4 -mb-6 border-t px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground hidden sm:inline">
                                {filledRequired}/{requiredFields.length} required fields complete
                            </span>
                            <div className="bg-secondary h-1.5 w-24 rounded-full sm:w-32">
                                <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="text-xs font-medium tabular-nums">{progressPercent}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground hidden text-xs lg:inline">Ctrl+Enter to submit</span>
                            <div className="flex gap-1">
                                <Button type="button" disabled={processing} onClick={() => submitWithAction("view")}>
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                                    {processing ? "Creating..." : "Submit & View"}
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="outline" size="icon" disabled={processing} aria-label="More create actions">
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuItem onClick={() => submitWithAction("view")} className="cursor-pointer">
                                            <Eye className="mr-2 h-4 w-4" />
                                            Submit and View the record
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => submitWithAction("create_another")} className="cursor-pointer">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Submit and create another one
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => submitWithAction("create_enrollment")} className="cursor-pointer">
                                            <FilePlus2 className="mr-2 h-4 w-4" />
                                            Submit and create an enrollment
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
