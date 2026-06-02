import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ImageUp, Palette } from "lucide-react";
import type { ReactNode } from "react";
import type { ClassFormData, ClassFormOptions, ClassSettings, SubjectOption } from "../../lib/class-defaults";

type ReviewStepProps = {
    data: ClassFormData;
    options: ClassFormOptions;
    collegeSubjects: SubjectOption[];
    onDataChange: (data: Partial<ClassFormData>) => void;
    onJumpToStep: (stepIndex: number) => void;
};

type SummaryRowProps = {
    label: string;
    value: ReactNode;
    stepIndex: number;
    onJumpToStep: (stepIndex: number) => void;
};

const themes: Array<{ value: ClassSettings["theme"]; label: string; description: string }> = [
    { value: "default", label: "Default", description: "Clean school standard" },
    { value: "modern", label: "Modern", description: "Sharp and bright" },
    { value: "classic", label: "Classic", description: "Formal and timeless" },
    { value: "minimal", label: "Minimal", description: "Quiet and focused" },
    { value: "vibrant", label: "Vibrant", description: "High-energy accents" },
];

const featureToggles: Array<{ key: keyof Pick<ClassSettings, "enable_announcements" | "enable_grade_visibility" | "enable_attendance_tracking" | "allow_late_submissions" | "enable_discussion_board">; label: string }> = [
    { key: "enable_announcements", label: "Announcements" },
    { key: "enable_grade_visibility", label: "Grade visibility" },
    { key: "enable_attendance_tracking", label: "Attendance tracking" },
    { key: "allow_late_submissions", label: "Late submissions" },
    { key: "enable_discussion_board", label: "Discussion board" },
];

function optionLabel(options: Array<{ id?: number | string; value?: string; label: string }>, value: number | string | null): string {
    if (value === null || value === "") {
        return "Not set";
    }

    return options.find((option) => String(option.id ?? option.value) === String(value))?.label ?? String(value);
}

function lookupLabels(ids: number[], pool: Array<{ id: number | string; label: string }>): string[] {
    return ids.map((id) => {
        const match = pool.find((entry) => String(entry.id) === String(id));
        return match?.label ?? `#${id}`;
    });
}

function SummaryRow({ label, value, stepIndex, onJumpToStep }: SummaryRowProps): ReactNode {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border bg-background/60 px-3 py-2">
            <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(stepIndex)} className="text-primary hover:text-primary">
                Edit
            </Button>
        </div>
    );
}

export function ReviewStep({ data, options, collegeSubjects, onDataChange, onJumpToStep }: ReviewStepProps): ReactNode {
    const basicsSubject = data.classification === "college" ? data.subject_code : data.subject_code_shs;
    const scheduleSummary = data.schedules.map((schedule) => `${schedule.day_of_week} ${schedule.start_time}-${schedule.end_time}`).join(", ");

    const updateSettings = (settings: Partial<ClassSettings>): void => {
        onDataChange({ settings: { ...data.settings, ...settings } });
    };

    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Class basics</CardTitle>
                        <CardDescription>Program, subject, and section details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <SummaryRow label="Type" value={optionLabel(options.classifications, data.classification)} stepIndex={0} onJumpToStep={onJumpToStep} />
                        {data.classification === "college" ? (
                            <SummaryRow
                                label={data.course_codes.length > 1 ? `Courses (${data.course_codes.length})` : "Courses"}
                                value={
                                    data.course_codes.length === 0 ? (
                                        "Not set"
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {lookupLabels(data.course_codes, options.courses).map((label, index) => (
                                                <Badge key={`course-${index}`} variant="secondary">{label}</Badge>
                                            ))}
                                        </div>
                                    )
                                }
                                stepIndex={0}
                                onJumpToStep={onJumpToStep}
                            />
                        ) : null}
                        {data.classification === "college" ? (
                            <SummaryRow
                                label={data.subject_ids.length > 1 ? `Subjects (${data.subject_ids.length})` : "Subjects"}
                                value={
                                    data.subject_ids.length === 0 ? (
                                        "Not set"
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {lookupLabels(data.subject_ids, collegeSubjects).map((label, index) => (
                                                <Badge key={`subject-${index}`} variant="secondary">{label}</Badge>
                                            ))}
                                        </div>
                                    )
                                }
                                stepIndex={0}
                                onJumpToStep={onJumpToStep}
                            />
                        ) : null}
                        <SummaryRow label="Subject code" value={basicsSubject || "Not set"} stepIndex={0} onJumpToStep={onJumpToStep} />
                        <SummaryRow label="Section" value={data.section} stepIndex={0} onJumpToStep={onJumpToStep} />
                        <SummaryRow label="Capacity" value={`${data.maximum_slots} slots`} stepIndex={0} onJumpToStep={onJumpToStep} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Teaching & schedule</CardTitle>
                        <CardDescription>Faculty, room, and weekly blocks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <SummaryRow label="Faculty" value={optionLabel(options.faculties, data.faculty_id)} stepIndex={1} onJumpToStep={onJumpToStep} />
                        <SummaryRow label="Primary room" value={optionLabel(options.rooms, data.room_id)} stepIndex={1} onJumpToStep={onJumpToStep} />
                        <SummaryRow label="Schedules" value={scheduleSummary || "Not set"} stepIndex={1} onJumpToStep={onJumpToStep} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Settings (optional)</CardTitle>
                        <CardDescription>Appearance and classroom features.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{data.settings.theme}</Badge>
                            {featureToggles.filter((toggle) => Boolean(data.settings[toggle.key])).map((toggle) => (
                                <Badge key={toggle.key} variant="outline">{toggle.label}</Badge>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => onJumpToStep(2)}>
                            Edit settings
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <details className="rounded-2xl border bg-card shadow-2xl">
                <summary className="flex cursor-pointer items-center gap-2 px-6 py-4 font-semibold">
                    <Palette className="size-4" />
                    Customize appearance (optional)
                </summary>
                <Separator />
                <div className="space-y-6 p-6">
                    <div className="grid gap-3 md:grid-cols-5">
                        {themes.map((theme) => (
                            <button
                                key={theme.value}
                                type="button"
                                onClick={() => updateSettings({ theme: theme.value })}
                                className={cn(
                                    "rounded-xl border bg-background/70 p-3 text-left transition-all hover:border-primary/50 hover:bg-accent/50",
                                    data.settings.theme === theme.value && "border-primary bg-primary/8 ring-1 ring-primary/20",
                                )}
                            >
                                <span className="block text-sm font-semibold">{theme.label}</span>
                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{theme.description}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                        {featureToggles.map((toggle) => (
                            <Label key={toggle.key} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3">
                                <Checkbox checked={Boolean(data.settings[toggle.key])} onCheckedChange={(checked) => updateSettings({ [toggle.key]: checked === true })} />
                                {toggle.label}
                            </Label>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="banner_image" className="gap-2">
                            <ImageUp className="size-4" />
                            Banner image
                        </Label>
                        <Input
                            id="banner_image"
                            type="file"
                            accept="image/*"
                            onChange={(event) => updateSettings({ banner_image: event.target.files?.[0] ?? null })}
                        />
                    </div>
                </div>
            </details>
        </div>
    );
}
