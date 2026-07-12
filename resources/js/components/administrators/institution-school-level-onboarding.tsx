import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisualRadioButton } from "@/components/ui/visual-radio-button";
import { useForm } from "@inertiajs/react";
import { Building2, GraduationCap, Library, Loader2 } from "lucide-react";
import { FormEvent } from "react";
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

    const form = useForm({
        school_id: onboarding?.school?.id ?? 0,
        school_level: "",
    });

    if (!shouldOpen || !onboarding?.school || !onboarding.update_endpoint) {
        return null;
    }

    const updateEndpoint = onboarding.update_endpoint;
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.put(updateEndpoint, {
            preserveScroll: true,
            onSuccess: () => toast.success("Institution school level configured."),
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
        <Dialog open>
            <DialogContent showCloseButton={false} className="sm:max-w-2xl">
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <div className="bg-primary/10 text-primary mb-2 flex h-11 w-11 items-center justify-center rounded-lg">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <DialogTitle>Complete institution configuration</DialogTitle>
                        <DialogDescription>
                            {onboarding.school.name} needs a school level before administrators continue. This keeps enrollment, class, and reporting
                            defaults aligned with the institution type.
                        </DialogDescription>
                    </DialogHeader>

                    <fieldset className="space-y-3">
                        <legend className="text-sm leading-none font-medium mb-1">School Level</legend>
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
                            <p className="text-destructive text-sm flex items-center gap-1.5 pt-1">
                                {form.errors.school_level}
                            </p>
                        )}
                    </fieldset>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={form.processing || !form.data.school_level}
                            className="w-full sm:w-auto gap-1.5"
                        >
                            {form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {form.processing ? "Saving..." : "Save school level"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
