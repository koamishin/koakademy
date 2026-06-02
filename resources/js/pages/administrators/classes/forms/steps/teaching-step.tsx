import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { FacultyRoomPicker } from "../fields/faculty-room-picker";
import { ScheduleGrid } from "../fields/schedule-grid";
import type { ClassFormData, ClassFormOptions, ClassSchedule } from "../../lib/class-defaults";

type TeachingStepProps = {
    data: ClassFormData;
    options: ClassFormOptions;
    onDataChange: (data: Partial<ClassFormData>) => void;
};

export function TeachingStep({ data, options, onDataChange }: TeachingStepProps): ReactNode {
    const updateRoom = (room_id: number): void => {
        onDataChange({
            room_id,
            schedules: data.schedules.map((schedule, index) => (index === 0 ? { ...schedule, room_id } : schedule)),
        });
    };

    const updateSchedules = (schedules: ClassSchedule[]): void => {
        onDataChange({ schedules });
    };

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>Teaching assignment</CardTitle>
                    <CardDescription>Choose who teaches the class and the main room students should expect.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FacultyRoomPicker
                        faculties={options.faculties}
                        rooms={options.rooms}
                        facultyId={data.faculty_id}
                        roomId={data.room_id}
                        onFacultyChange={(faculty_id) => onDataChange({ faculty_id })}
                        onRoomChange={updateRoom}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Weekly schedule</CardTitle>
                    <CardDescription>Build the class schedule on the visual weekly grid.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="size-4" />
                        <AlertDescription>Drag blocks on the week grid, or use Add block. Conflicts are highlighted in red.</AlertDescription>
                    </Alert>
                    <ScheduleGrid
                        schedules={data.schedules}
                        rooms={options.rooms}
                        dayOptions={options.day_of_week}
                        primaryRoomId={data.room_id}
                        onSchedulesChange={updateSchedules}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
