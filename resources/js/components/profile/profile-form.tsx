import { formatPersonName } from "@/components/profile/profile-form-utils";
import { AutocompleteFieldInput } from "@/components/ui/autocomplete-field-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PHILIPPINE_CITIES_MUNICIPALITIES, PHILIPPINE_PROVINCES, PHILIPPINE_REGIONS } from "@/data/philippine-geography";
import { Building2, Edit3, Link2, Mail, MapPin, Save, UserRound } from "lucide-react";

type UserProfileData = {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    website: string;
    bio: string;
    department: string;
    position: string;
};

type FacultyProfileData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    department: string;
    office_hours: string;
    birth_date: string;
    address_line1: string;
    biography: string;
    education: string;
    courses_taught: string;
    gender: string;
    age?: number;
};

const cityOptions = PHILIPPINE_CITIES_MUNICIPALITIES.map((city) => city.name);
const stateOptions = [...PHILIPPINE_PROVINCES.map((province) => province.name), ...PHILIPPINE_REGIONS.map((region) => region.label)];
const countryOptions = [
    "Philippines",
    "Australia",
    "Canada",
    "China",
    "India",
    "Indonesia",
    "Japan",
    "Malaysia",
    "Singapore",
    "South Korea",
    "Thailand",
    "United Kingdom",
    "United States",
    "Vietnam",
];

interface ProfileFormProps {
    userForm: {
        data: UserProfileData;
        setData: <Key extends keyof UserProfileData>(key: Key, value: UserProfileData[Key]) => void;
        errors: Record<string, string>;
        processing: boolean;
    };
    facultyForm?: {
        data: FacultyProfileData;
        setData: <Key extends keyof FacultyProfileData>(key: Key, value: FacultyProfileData[Key]) => void;
        errors: Record<string, string>;
        processing: boolean;
    };
    onSubmit: (event: React.FormEvent) => void;
    onFacultySubmit?: (event: React.FormEvent) => void;
    developerModeEnabled?: boolean;
    defaultCountryCode?: string;
}

function FieldError({ message }: { message?: string }) {
    return message ? <p className="text-destructive text-sm">{message}</p> : null;
}

export function ProfileForm({
    userForm,
    facultyForm,
    onSubmit,
    onFacultySubmit,
    developerModeEnabled = false,
    defaultCountryCode,
}: ProfileFormProps) {
    const user = userForm.data;
    const faculty = facultyForm?.data;

    return (
        <Card id="profile-information" className="border-border/60 bg-card/75 scroll-mt-24 rounded-lg shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Profile Information
                </CardTitle>
                <CardDescription>Keep your account and institutional details current.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <form id="profile-form" onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <h3 className="font-semibold">Account details</h3>
                        <p className="text-muted-foreground text-sm">Used for sign-in, communication, and your public profile.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name">Full name *</Label>
                            <InputGroup className="h-9">
                                <InputGroupAddon>
                                    <UserRound />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="name"
                                    name="name"
                                    autoComplete="name"
                                    value={user.name}
                                    onChange={(event) => userForm.setData("name", event.target.value)}
                                    onBlur={(event) => userForm.setData("name", formatPersonName(event.target.value))}
                                    aria-invalid={Boolean(userForm.errors.name)}
                                    required
                                />
                            </InputGroup>
                            <FieldError message={userForm.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email address *</Label>
                            <InputGroup className="h-9">
                                <InputGroupAddon>
                                    <Mail />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    value={user.email}
                                    onChange={(event) => userForm.setData("email", event.target.value)}
                                    aria-invalid={Boolean(userForm.errors.email)}
                                    required
                                />
                            </InputGroup>
                            <FieldError message={userForm.errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone number</Label>
                            <PhoneInput
                                id="phone"
                                value={user.phone}
                                onChange={(value) => userForm.setData("phone", value)}
                                defaultCountryCode={defaultCountryCode}
                            />
                            <FieldError message={userForm.errors.phone} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Street address</Label>
                            <InputGroup className="h-9">
                                <InputGroupAddon>
                                    <MapPin />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="address"
                                    name="street-address"
                                    autoComplete="street-address"
                                    value={user.address}
                                    onChange={(event) => userForm.setData("address", event.target.value)}
                                    aria-invalid={Boolean(userForm.errors.address)}
                                    placeholder="House number, street, and barangay"
                                />
                            </InputGroup>
                            <FieldError message={userForm.errors.address} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">City or municipality</Label>
                            <AutocompleteFieldInput
                                id="city"
                                value={user.city}
                                onChange={(value) => userForm.setData("city", value)}
                                fieldName="city"
                                options={cityOptions}
                                placeholder="Search or enter city"
                                aria-invalid={Boolean(userForm.errors.city)}
                            />
                            <FieldError message={userForm.errors.city} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">Province or region</Label>
                            <AutocompleteFieldInput
                                id="state"
                                value={user.state}
                                onChange={(value) => userForm.setData("state", value)}
                                fieldName="state"
                                options={stateOptions}
                                placeholder="Search or enter province or region"
                                aria-invalid={Boolean(userForm.errors.state)}
                            />
                            <FieldError message={userForm.errors.state} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <AutocompleteFieldInput
                                id="country"
                                value={user.country}
                                onChange={(value) => userForm.setData("country", value)}
                                fieldName="country"
                                options={countryOptions}
                                placeholder="Search or enter country"
                                aria-invalid={Boolean(userForm.errors.country)}
                            />
                            <FieldError message={userForm.errors.country} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="postal_code">Postal code</Label>
                            <Input
                                id="postal_code"
                                name="postal-code"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                value={user.postal_code}
                                onChange={(event) => userForm.setData("postal_code", event.target.value)}
                                aria-invalid={Boolean(userForm.errors.postal_code)}
                            />
                            <FieldError message={userForm.errors.postal_code} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <InputGroup className="h-9">
                                <InputGroupAddon>
                                    <Building2 />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="department"
                                    value={user.department}
                                    onChange={(event) => userForm.setData("department", event.target.value)}
                                    aria-invalid={Boolean(userForm.errors.department)}
                                    placeholder="Computer Science"
                                />
                            </InputGroup>
                            <FieldError message={userForm.errors.department} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Position</Label>
                            <Input
                                id="position"
                                autoComplete="organization-title"
                                value={user.position}
                                onChange={(event) => userForm.setData("position", event.target.value)}
                                aria-invalid={Boolean(userForm.errors.position)}
                            />
                            <FieldError message={userForm.errors.position} />
                        </div>

                        {developerModeEnabled && (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="website">Portfolio link</Label>
                                <InputGroup className="h-9">
                                    <InputGroupAddon>
                                        <Link2 />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="website"
                                        name="url"
                                        type="url"
                                        inputMode="url"
                                        autoComplete="url"
                                        value={user.website}
                                        onChange={(event) => userForm.setData("website", event.target.value)}
                                        aria-invalid={Boolean(userForm.errors.website)}
                                        placeholder="https://example.com"
                                    />
                                </InputGroup>
                                <FieldError message={userForm.errors.website} />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={user.bio}
                            onChange={(event) => userForm.setData("bio", event.target.value)}
                            aria-invalid={Boolean(userForm.errors.bio)}
                            placeholder="Share a short professional overview"
                            rows={4}
                        />
                        <FieldError message={userForm.errors.bio} />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={userForm.processing} className="rounded-lg">
                            <Save className="mr-2 h-4 w-4" />
                            {userForm.processing ? "Saving..." : "Save account details"}
                        </Button>
                    </div>
                </form>

                {facultyForm && faculty && onFacultySubmit && (
                    <>
                        <Separator />
                        <form id="faculty-form" onSubmit={onFacultySubmit} className="space-y-5">
                            <div>
                                <h3 className="font-semibold">Faculty record</h3>
                                <p className="text-muted-foreground text-sm">Academic and office information used across faculty services.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(
                                    [
                                        ["first_name", "First name *", "given-name"],
                                        ["middle_name", "Middle name", "additional-name"],
                                        ["last_name", "Last name *", "family-name"],
                                    ] as const
                                ).map(([key, label, autoComplete]) => (
                                    <div key={key} className="space-y-2">
                                        <Label htmlFor={`faculty_${key}`}>{label}</Label>
                                        <Input
                                            id={`faculty_${key}`}
                                            autoComplete={autoComplete}
                                            value={faculty[key]}
                                            onChange={(event) => facultyForm.setData(key, event.target.value)}
                                            onBlur={(event) => facultyForm.setData(key, formatPersonName(event.target.value))}
                                            aria-invalid={Boolean(facultyForm.errors[key])}
                                            required={key !== "middle_name"}
                                        />
                                        <FieldError message={facultyForm.errors[key]} />
                                    </div>
                                ))}

                                <div className="space-y-2">
                                    <Label htmlFor="faculty_email">Faculty email *</Label>
                                    <InputGroup className="h-9">
                                        <InputGroupAddon>
                                            <Mail />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="faculty_email"
                                            type="email"
                                            autoComplete="email"
                                            value={faculty.email}
                                            onChange={(event) => facultyForm.setData("email", event.target.value)}
                                            aria-invalid={Boolean(facultyForm.errors.email)}
                                            required
                                        />
                                    </InputGroup>
                                    <FieldError message={facultyForm.errors.email} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="faculty_phone">Phone number</Label>
                                    <PhoneInput
                                        id="faculty_phone"
                                        value={faculty.phone_number}
                                        onChange={(value) => facultyForm.setData("phone_number", value)}
                                        defaultCountryCode={defaultCountryCode}
                                    />
                                    <FieldError message={facultyForm.errors.phone_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="faculty_department">Department</Label>
                                    <Input
                                        id="faculty_department"
                                        value={faculty.department}
                                        onChange={(event) => facultyForm.setData("department", event.target.value)}
                                        aria-invalid={Boolean(facultyForm.errors.department)}
                                    />
                                    <FieldError message={facultyForm.errors.department} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="faculty_office_hours">Office hours</Label>
                                    <Input
                                        id="faculty_office_hours"
                                        value={faculty.office_hours}
                                        onChange={(event) => facultyForm.setData("office_hours", event.target.value)}
                                        aria-invalid={Boolean(facultyForm.errors.office_hours)}
                                        placeholder="Mon-Fri, 9:00 AM-5:00 PM"
                                    />
                                    <FieldError message={facultyForm.errors.office_hours} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="faculty_birth_date">Birth date</Label>
                                    <Input
                                        id="faculty_birth_date"
                                        type="date"
                                        autoComplete="bday"
                                        value={faculty.birth_date}
                                        onChange={(event) => facultyForm.setData("birth_date", event.target.value)}
                                        aria-invalid={Boolean(facultyForm.errors.birth_date)}
                                    />
                                    <FieldError message={facultyForm.errors.birth_date} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="faculty_age">Age</Label>
                                    <Input
                                        id="faculty_age"
                                        type="number"
                                        min={18}
                                        max={100}
                                        value={faculty.age ?? ""}
                                        onChange={(event) =>
                                            facultyForm.setData("age", event.target.value === "" ? undefined : Number(event.target.value))
                                        }
                                        aria-invalid={Boolean(facultyForm.errors.age)}
                                    />
                                    <FieldError message={facultyForm.errors.age} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="faculty_gender">Gender</Label>
                                    <Select value={faculty.gender} onValueChange={(value) => facultyForm.setData("gender", value)}>
                                        <SelectTrigger id="faculty_gender" aria-invalid={Boolean(facultyForm.errors.gender)}>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError message={facultyForm.errors.gender} />
                                </div>

                                <div className="space-y-2 lg:col-span-3">
                                    <Label htmlFor="faculty_address">Address</Label>
                                    <InputGroup className="h-9">
                                        <InputGroupAddon>
                                            <MapPin />
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="faculty_address"
                                            autoComplete="street-address"
                                            value={faculty.address_line1}
                                            onChange={(event) => facultyForm.setData("address_line1", event.target.value)}
                                            aria-invalid={Boolean(facultyForm.errors.address_line1)}
                                        />
                                    </InputGroup>
                                    <FieldError message={facultyForm.errors.address_line1} />
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="faculty_education">Education</Label>
                                    <Textarea
                                        id="faculty_education"
                                        value={faculty.education}
                                        onChange={(event) => facultyForm.setData("education", event.target.value)}
                                        aria-invalid={Boolean(facultyForm.errors.education)}
                                        rows={4}
                                        placeholder="One qualification per line"
                                    />
                                    <FieldError message={facultyForm.errors.education} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="faculty_courses">Courses taught</Label>
                                    <Textarea
                                        id="faculty_courses"
                                        value={faculty.courses_taught}
                                        onChange={(event) => facultyForm.setData("courses_taught", event.target.value)}
                                        aria-invalid={Boolean(facultyForm.errors.courses_taught)}
                                        rows={4}
                                        placeholder="Separate courses with commas"
                                    />
                                    <FieldError message={facultyForm.errors.courses_taught} />
                                </div>
                                <div className="space-y-2 lg:col-span-2">
                                    <Label htmlFor="faculty_biography">Faculty biography</Label>
                                    <Textarea
                                        id="faculty_biography"
                                        value={faculty.biography}
                                        onChange={(event) => facultyForm.setData("biography", event.target.value)}
                                        aria-invalid={Boolean(facultyForm.errors.biography)}
                                        rows={5}
                                    />
                                    <FieldError message={facultyForm.errors.biography} />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={facultyForm.processing} className="rounded-lg">
                                    <Save className="mr-2 h-4 w-4" />
                                    {facultyForm.processing ? "Saving..." : "Save faculty record"}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
