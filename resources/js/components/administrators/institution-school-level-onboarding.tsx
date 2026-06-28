import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "@inertiajs/react";
import { Building2, Loader2 } from "lucide-react";
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
    const selectedLevel = onboarding.school_level_options.find((option) => option.value === form.data.school_level);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.put(updateEndpoint, {
            preserveScroll: true,
            onSuccess: () => toast.success("Institution school level configured."),
            onError: () => toast.error("Please choose a valid school level."),
        });
    };

    return (
        <Dialog open>
            <DialogContent showCloseButton={false} className="sm:max-w-xl">
                <form onSubmit={submit} className="space-y-5">
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

                    <div className="space-y-2">
                        <Label htmlFor="institution-school-level">School Level</Label>
                        <Select value={form.data.school_level} onValueChange={(value) => form.setData("school_level", value ?? "")}>
                            <SelectTrigger id="institution-school-level" className={form.errors.school_level ? "border-destructive" : ""}>
                                <SelectValue placeholder="Choose the institution's school level" />
                            </SelectTrigger>
                            <SelectContent>
                                {onboarding.school_level_options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedLevel && <p className="text-muted-foreground text-sm leading-relaxed">{selectedLevel.description}</p>}
                        {form.errors.school_level && <p className="text-destructive text-sm">{form.errors.school_level}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={form.processing || !form.data.school_level} className="w-full sm:w-auto">
                            {form.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save school level
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
