import { Combobox } from "@/components/ui/combobox";
import type { ReactNode } from "react";
import type { EntityOption } from "../../lib/class-defaults";

type FacultyRoomPickerProps = {
    faculties: EntityOption[];
    rooms: EntityOption[];
    facultyId: string | null;
    roomId: number;
    onFacultyChange: (facultyId: string | null) => void;
    onRoomChange: (roomId: number) => void;
};

function toComboboxOptions(options: EntityOption[]): { label: string; value: string }[] {
    return options.map((option) => ({ label: option.label, value: String(option.id) }));
}

export function FacultyRoomPicker({ faculties, rooms, facultyId, roomId, onFacultyChange, onRoomChange }: FacultyRoomPickerProps): ReactNode {
    return (
        <div className="grid gap-5 lg:grid-cols-2">
            <Combobox
                label="Faculty"
                options={toComboboxOptions(faculties)}
                value={facultyId ?? undefined}
                onValueChange={(value) => onFacultyChange(value || null)}
                placeholder="Assign a faculty member"
                searchPlaceholder="Search faculty"
                emptyText="No faculty member found."
            />
            <Combobox
                label="Primary room"
                required
                options={toComboboxOptions(rooms)}
                value={roomId ? String(roomId) : undefined}
                onValueChange={(value) => onRoomChange(Number(value))}
                placeholder="Choose the main room"
                searchPlaceholder="Search rooms"
                emptyText="No room found."
            />
        </div>
    );
}
