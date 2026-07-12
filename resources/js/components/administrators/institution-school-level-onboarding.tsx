import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisualRadioButton } from "@/components/ui/visual-radio-button";
import { useForm } from "@inertiajs/react";
import { Building2, GraduationCap, Library, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type SchoolLevelOption = {
    value: string;
    label: string;
    description: string;
};

export type InstitutionOnboarding = {
    needs_school_level: boolean;
    school: {
        id: number;
        name: string;
        code: string | null;
    } | null;
    school_level_options: SchoolLevelOption[];
    update_endpoint: string | null;
} | null;

interface InstitutionSchoolLevelOnboardingProps {
    onboarding: InstitutionOnboarding;
}

export function InstitutionSchoolLevelOnboarding({ onboarding }: InstitutionSchoolLevelOnboardingProps) {
    const shouldOpen = Boolean(onboarding?.needs_school_level && onboarding.school && onboarding.update_endpoint);
    const [isOpen, setIsOpen] = useState(shouldOpen);
    const form = useForm({ school_level: "" });
    const school = onboarding?.school;
    const updateEndpoint = onboarding?.update_endpoint;

    useEffect(() => {
        setIsOpen(shouldOpen);
    }, [shouldOpen]);

    if (!shouldOpen || !isOpen || !school || !updateEndpoint) {
        return null;
    }
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            school_id: school.id,
        }));

        form.put(updateEndpoint, {
            preserveScroll: true,
            onSuccess: () => {
                setIsOpen(false);
                toast.success("Institution school level configured.");
            },
            onError: () => toast.error("Please choose a valid school level."),
        });
    };

    const getOptionIcon = (value: string) => {
        switch (value) {
            case "elementary":
            case "primary":
                return <Library className="h-5 w-5" />;
            case "secondary":
            case "junior_high":
            case "senior_high":
            case "high_school":
                return <GraduationCap className="h-5 w-5" />;
            case "tertiary":
            case "college":
            case "university":
                return <Library className="h-5 w-5" />;
            default:
                return <Building2 className="h-5 w-5" />;
        }
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent showCloseButton={false} className="sm:max-w-2xl">
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <div className="bg-primary/10 text-primary mb-2 flex h-11 w-11 items-center justify-center rounded-lg">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <DialogTitle>Complete institution configuration</DialogTitle>
                        <DialogDescription>
                            {school.name} needs a school level before administrators continue. This keeps enrollment, class, and reporting defaults
                            aligned with the institution type.
                        </DialogDescription>
                    </DialogHeader>

                    <fieldset className="space-y-3">
                        <legend className="mb-1 text-sm leading-none font-medium">School Level</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {onboarding.school_level_options.map((option) => (
                                <VisualRadioButton
                                    key={option.value}
                                    title={option.label}
                                    description={option.description}
                                    icon={getOptionIcon(option.value)}
                                    checked={form.data.school_level === option.value}
                                    onSelect={() => form.setData("school_level", option.value)}
                                    className="bg-card/80"
                                />
                            ))}
                        </div>
                        {form.errors.school_level && (
                            <p className="text-destructive flex items-center gap-1.5 pt-1 text-sm">{form.errors.school_level}</p>
                        )}
                    </fieldset>

                    <DialogFooter>
                        <Button type="submit" disabled={form.processing || !form.data.school_level} className="w-full gap-1.5 sm:w-auto">
                            {form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {form.processing ? "Saving..." : "Save school level"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
