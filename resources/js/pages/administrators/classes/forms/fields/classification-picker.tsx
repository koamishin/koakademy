import { VisualRadioButton } from "@/components/ui/visual-radio-button";
import type { ReactNode } from "react";
import type { Classification } from "../../lib/class-defaults";

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
                className="bg-card/80 min-h-28"
            />
            <VisualRadioButton
                title="Senior High School"
                description="Grades 11 & 12, with strands"
                icon={shsIcon}
                checked={value === "shs"}
                onSelect={() => onChange("shs")}
                className="bg-card/80 min-h-28"
            />
        </div>
    );
}
