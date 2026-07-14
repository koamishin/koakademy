export interface StudentScheduleConflictClass {
    id: number;
    schedule_id: number;
    subject_code: string;
    subject_title: string;
    section: string;
    room: string;
    start_time: string;
    end_time: string;
}

export interface StudentScheduleConflict {
    id: string;
    day: string;
    overlap_start: string;
    overlap_end: string;
    classes: [StudentScheduleConflictClass, StudentScheduleConflictClass];
}
