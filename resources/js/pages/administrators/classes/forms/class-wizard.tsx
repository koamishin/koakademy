import { Wizard, type WizardValidationResult } from "@/components/ui/wizard";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";
import {
    buildClassDefaults,
    buildClassStorePayload,
    buildSubjectCodeFromSubjectOptions,
    type ClassDefaultsInput,
    type ClassFormData,
    type Classification,
    type ValidationResult,
} from "../lib/class-defaults";
import { BasicsStep } from "./steps/basics-step";
import { ReviewStep } from "./steps/review-step";
import { TeachingStep } from "./steps/teaching-step";
import { useClassForm } from "./use-class-form";

type ClassWizardProps = ClassDefaultsInput & {
    mode?: "create" | "edit";
    classId?: number;
    initialData?: ClassFormData;
    onCreated?: () => void;
};

const draftKey = "koakademy:class-draft";

function toWizardResult(result: ValidationResult): WizardValidationResult {
    return result === true ? true : result.message;
}

function isDraftData(value: unknown): value is ClassFormData {
    return typeof value === "object" && value !== null && "classification" in value && "schedules" in value && "settings" in value;
}

export function ClassWizard({ semester, school_year, options, mode = "create", classId, initialData, onCreated }: ClassWizardProps): ReactNode {
    const defaults = useMemo(() => ({ semester, school_year, options }), [semester, school_year, options]);
    const { form, subjectCodeTouched, setSubjectCodeTouched, collegeSubjects, collegeSubjectsLoading, loadCollegeSubjects, step1Valid, step2Valid } =
        useClassForm(defaults, initialData);
    const [currentStep, setCurrentStep] = useState(0);
    const isEditing = mode === "edit";

    const saveDraft = (): void => {
        if (isEditing) {
            return;
        }

        localStorage.setItem(draftKey, JSON.stringify({ ...form.data, settings: { ...form.data.settings, banner_image: null } }));
        toast.success("Draft saved.");
    };

    const applyDataChange = (changes: Partial<ClassFormData>): void => {
        form.setData({ ...form.data, ...changes });
    };

    const handleClassificationChange = (classification: Classification): void => {
        if (classification === "college") {
            applyDataChange({ classification, shs_track_id: null, shs_strand_id: null, subject_code_shs: "", grade_level: "Grade 11" });
            return;
        }

        applyDataChange({ classification, course_codes: [], subject_ids: [], subject_code: "", academic_year: 1 });
    };

    useEffect(() => {
        if (isEditing) {
            return;
        }

        const storedDraft = localStorage.getItem(draftKey);

        if (!storedDraft) {
            return;
        }

        toast("Restore draft?", {
            description: "A saved class draft is available on this device.",
            action: {
                label: "Restore",
                onClick: () => {
                    const parsed = JSON.parse(storedDraft) as unknown;
                    if (isDraftData(parsed)) {
                        form.setData({
                            ...buildClassDefaults(defaults),
                            ...parsed,
                            settings: { ...buildClassDefaults(defaults).settings, ...parsed.settings, banner_image: null },
                        });
                    }
                },
            },
        });
    }, []);

    useEffect(() => {
        if (form.data.classification !== "college") {
            return;
        }

        if (form.data.course_codes.length === 0) {
            if (form.data.subject_ids.length > 0) {
                applyDataChange({ subject_ids: [] });
            }
            if (!subjectCodeTouched && form.data.subject_code !== "") {
                applyDataChange({ subject_code: "" });
            }
            return;
        }

        void loadCollegeSubjects(form.data.course_codes);
    }, [form.data.classification, form.data.course_codes.join(",")]);

    useEffect(() => {
        if (form.data.classification !== "college" || form.data.course_codes.length === 0) {
            return;
        }

        const validIds = new Set(collegeSubjects.map((subject) => subject.id));
        const kept = form.data.subject_ids.filter((id) => validIds.has(id));

        if (kept.length !== form.data.subject_ids.length) {
            applyDataChange({ subject_ids: kept });
            if (!subjectCodeTouched) {
                applyDataChange({ subject_code: buildSubjectCodeFromSubjectOptions(kept, collegeSubjects) });
            }
        }
    }, [collegeSubjects, form.data.classification, form.data.course_codes.length, form.data.subject_ids.length]);

    useEffect(() => {
        if (isEditing) {
            return;
        }

        const timeout = window.setTimeout(() => {
            localStorage.setItem(draftKey, JSON.stringify({ ...form.data, settings: { ...form.data.settings, banner_image: null } }));
        }, 1000);

        return () => window.clearTimeout(timeout);
    }, [form.data, isEditing]);

    const submit = (): void => {
        const options = {
            forceFormData: form.data.settings.banner_image !== null,
            onSuccess: () => {
                localStorage.removeItem(draftKey);
                onCreated?.();
            },
        };

        form.transform(() => buildClassStorePayload(form.data));

        if (isEditing && classId) {
            form.patch(route("administrators.classes.update", { class: classId }), options);
            return;
        }

        form.post(route("administrators.classes.store"), options);
    };

    return (
        <Wizard
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onComplete={submit}
            onSaveDraft={saveDraft}
            isProcessing={form.processing}
            labels={{
                back: "Back",
                next: "Next",
                complete: isEditing ? "Update class" : "Create class",
                saveDraft: isEditing ? "" : "Save as draft",
                stepLabel: (stepNumber) => `Step ${stepNumber}`,
            }}
            steps={[
                {
                    id: "basics",
                    title: "Basics",
                    description: "Type, subject, section",
                    isComplete: () => step1Valid === true,
                    isValid: () => toWizardResult(step1Valid),
                },
                {
                    id: "teaching",
                    title: "Teaching",
                    description: "Faculty, room, schedule",
                    isComplete: () => step2Valid === true,
                    isValid: () => toWizardResult(step2Valid),
                },
                {
                    id: "review",
                    title: "Review",
                    description: isEditing ? "Confirm and update" : "Confirm and create",
                    isComplete: () => true,
                    isValid: () => true,
                },
            ]}
        >
            {currentStep === 0 ? (
                <BasicsStep
                    data={form.data}
                    options={options}
                    collegeSubjects={collegeSubjects}
                    subjectCodeTouched={subjectCodeTouched}
                    subjectsLoading={collegeSubjectsLoading}
                    onClassificationChange={handleClassificationChange}
                    onDataChange={applyDataChange}
                    onSubjectCodeTouched={() => setSubjectCodeTouched(true)}
                />
            ) : null}

            {currentStep === 1 ? <TeachingStep data={form.data} options={options} onDataChange={applyDataChange} /> : null}

            {currentStep === 2 ? (
                <ReviewStep
                    data={form.data}
                    options={options}
                    collegeSubjects={collegeSubjects}
                    onDataChange={applyDataChange}
                    onJumpToStep={setCurrentStep}
                />
            ) : null}
        </Wizard>
    );
}
