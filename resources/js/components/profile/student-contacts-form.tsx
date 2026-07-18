import { formatPersonName } from "@/components/profile/profile-form-utils";
import { AutocompleteFieldInput } from "@/components/ui/autocomplete-field-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";
import { Link2, Save, User } from "lucide-react";

type ParentData = {
    father_name: string;
    mother_name: string;
};

type ContactData = {
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
    facebook: string;
    personal_contact: string;
};

interface StudentContactsFormProps {
    studentForm: {
        data: StudentContactFormData;
        setData: <Key extends keyof StudentContactFormData>(key: Key, value: StudentContactFormData[Key]) => void;
        errors: Record<string, string>;
        processing: boolean;
    };
    onSubmit: (event: React.FormEvent) => void;
    defaultCountryCode?: string;
}

type StudentContactFormData = {
    parents: ParentData;
    contacts: ContactData;
};

const relationships = ["Mother", "Father", "Parent", "Spouse", "Sibling", "Guardian", "Relative", "Friend"];

function FieldError({ message }: { message?: string }) {
    return message ? <p className="text-destructive text-sm">{message}</p> : null;
}

export function StudentContactsForm({ studentForm, onSubmit, defaultCountryCode }: StudentContactsFormProps) {
    const errorFor = (key: string) => studentForm.errors[key];

    const updateParents = (key: keyof ParentData, value: string) => {
        studentForm.setData("parents", {
            ...studentForm.data.parents,
            [key]: value,
        });
    };

    const updateContacts = (key: keyof ContactData, value: string) => {
        studentForm.setData("contacts", {
            ...studentForm.data.contacts,
            [key]: value,
        });
    };

    return (
        <Card id="student-contacts" className="border-border/60 bg-card/75 scroll-mt-24 rounded-lg shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Parent & Contact Information
                </CardTitle>
                <CardDescription>Family and emergency contact details used by the school.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="father_name">Father&apos;s name</Label>
                            <Input
                                id="father_name"
                                autoComplete="off"
                                value={studentForm.data.parents.father_name}
                                onChange={(event) => updateParents("father_name", event.target.value)}
                                onBlur={(event) => updateParents("father_name", formatPersonName(event.target.value))}
                                aria-invalid={Boolean(errorFor("parents.father_name"))}
                            />
                            <FieldError message={errorFor("parents.father_name")} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mother_name">Mother&apos;s name</Label>
                            <Input
                                id="mother_name"
                                autoComplete="off"
                                value={studentForm.data.parents.mother_name}
                                onChange={(event) => updateParents("mother_name", event.target.value)}
                                onBlur={(event) => updateParents("mother_name", formatPersonName(event.target.value))}
                                aria-invalid={Boolean(errorFor("parents.mother_name"))}
                            />
                            <FieldError message={errorFor("parents.mother_name")} />
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_name">Emergency contact name</Label>
                            <Input
                                id="emergency_contact_name"
                                value={studentForm.data.contacts.emergency_contact_name}
                                onChange={(event) => updateContacts("emergency_contact_name", event.target.value)}
                                onBlur={(event) => updateContacts("emergency_contact_name", formatPersonName(event.target.value))}
                                aria-invalid={Boolean(errorFor("contacts.emergency_contact_name"))}
                            />
                            <FieldError message={errorFor("contacts.emergency_contact_name")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_phone">Emergency contact phone</Label>
                            <PhoneInput
                                id="emergency_contact_phone"
                                value={studentForm.data.contacts.emergency_contact_phone}
                                onChange={(value) => updateContacts("emergency_contact_phone", value)}
                                defaultCountryCode={defaultCountryCode}
                            />
                            <FieldError message={errorFor("contacts.emergency_contact_phone")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                            <AutocompleteFieldInput
                                id="emergency_contact_relationship"
                                value={studentForm.data.contacts.emergency_contact_relationship}
                                onChange={(value) => updateContacts("emergency_contact_relationship", value)}
                                fieldName="emergency_contact_relationship"
                                options={relationships}
                                placeholder="Search or enter relationship"
                                aria-invalid={Boolean(errorFor("contacts.emergency_contact_relationship"))}
                            />
                            <FieldError message={errorFor("contacts.emergency_contact_relationship")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="personal_contact">Personal phone</Label>
                            <PhoneInput
                                id="personal_contact"
                                value={studentForm.data.contacts.personal_contact}
                                onChange={(value) => updateContacts("personal_contact", value)}
                                defaultCountryCode={defaultCountryCode}
                            />
                            <FieldError message={errorFor("contacts.personal_contact")} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="facebook">Facebook profile</Label>
                            <InputGroup className="h-9">
                                <InputGroupAddon>
                                    <Link2 />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="facebook"
                                    type="url"
                                    inputMode="url"
                                    autoComplete="url"
                                    value={studentForm.data.contacts.facebook}
                                    onChange={(event) => updateContacts("facebook", event.target.value)}
                                    aria-invalid={Boolean(errorFor("contacts.facebook"))}
                                    placeholder="https://facebook.com/..."
                                />
                            </InputGroup>
                            <FieldError message={errorFor("contacts.facebook")} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={studentForm.processing} className="rounded-lg">
                            <Save className="mr-2 h-4 w-4" />
                            {studentForm.processing ? "Saving..." : "Save contact information"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
