import { VisualRadioButton } from "@/Components/ui/visual-radio-button";
import type { Classification } from "../../lib/class-defaults";
import type { ReactNode } from "react";

type ClassificationPickerProps = {
    value: Classification;
    onChange: (value: Classification) => void;
    collegeIcon: ReactNode;
    shsIcon: ReactNode;
};

export function ClassificationPicker({ value, onChange, collegeIcon, shsIcon }: ClassificationPickerProps): ReactNode {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            <VisualRadioButton
                title="College"
                description="Undergraduate degree programs"
                icon={collegeIcon}
                checked={value === "college"}
                onSelect={() => onChange("college")}
                className="min-h-28 bg-card/80"
            />
            <VisualRadioButton
                title="Senior High School"
                description="Grades 11 & 12, with strands"
                icon={shsIcon}
                checked={value === "shs"}
                onSelect={() => onChange("shs")}
                className="min-h-28 bg-card/80"
            />
        </div>
    );
}
