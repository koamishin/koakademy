import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap } from "lucide-react";
import type { ReactNode } from "react";
import type { ClassFormData, ClassFormOptions, Classification, SubjectOption } from "../../lib/class-defaults";
import { ClassificationPicker } from "../fields/classification-picker";
import { CollegeCourseSubject } from "../fields/college-course-subject";
import { SectionSlotInput } from "../fields/section-slot-input";
import { ShsTrackStrandSubject } from "../fields/shs-track-strand-subject";

type BasicsStepProps = {
    data: ClassFormData;
    options: ClassFormOptions;
    collegeSubjects: SubjectOption[];
    subjectCodeTouched: boolean;
    subjectsLoading: boolean;
    onClassificationChange: (classification: Classification) => void;
    onDataChange: (data: Partial<ClassFormData>) => void;
    onSubjectCodeTouched: () => void;
};

export function BasicsStep({
    data,
    options,
    collegeSubjects,
    subjectCodeTouched,
    subjectsLoading,
    onClassificationChange,
    onDataChange,
    onSubjectCodeTouched,
}: BasicsStepProps): ReactNode {
    return (
        <div className="space-y-5">
            <Card className="border-primary/20 from-card via-card to-primary/5 bg-gradient-to-br">
                <CardHeader>
                    <CardTitle>Class type</CardTitle>
                    <CardDescription>Pick the type of class first. The form will adapt.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ClassificationPicker
                        value={data.classification}
                        onChange={onClassificationChange}
                        collegeIcon={<BookOpen className="size-5" />}
                        shsIcon={<GraduationCap className="size-5" />}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{data.classification === "college" ? "Courses and subjects" : "Track, strand, and subject"}</CardTitle>
                    <CardDescription>
                        {data.classification === "college"
                            ? "Choose the college programs and subjects attached to this class."
                            : "Choose the SHS path and the subject this class will teach."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.classification === "college" ? (
                        <CollegeCourseSubject
                            courses={options.courses}
                            subjects={collegeSubjects}
                            academicYears={options.academic_years}
                            selectedCourseIds={data.course_codes}
                            selectedSubjectIds={data.subject_ids}
                            subjectCode={data.subject_code}
                            academicYear={data.academic_year}
                            subjectCodeTouched={subjectCodeTouched}
                            subjectsLoading={subjectsLoading}
                            onCoursesChange={(course_codes) => onDataChange({ course_codes })}
                            onSubjectsChange={(subject_ids, subject_code) =>
                                onDataChange({
                                    subject_ids,
                                    ...(subject_code === undefined ? {} : { subject_code }),
                                })
                            }
                            onSubjectCodeChange={(subject_code) => onDataChange({ subject_code })}
                            onAcademicYearChange={(academic_year) => onDataChange({ academic_year })}
                            onSubjectCodeTouched={onSubjectCodeTouched}
                        />
                    ) : (
                        <ShsTrackStrandSubject
                            tracks={options.shs_tracks}
                            gradeLevels={options.grade_levels}
                            trackId={data.shs_track_id}
                            strandId={data.shs_strand_id}
                            subjectCode={data.subject_code_shs}
                            gradeLevel={data.grade_level}
                            onTrackChange={(shs_track_id) => onDataChange({ shs_track_id })}
                            onStrandChange={(shs_strand_id) => onDataChange({ shs_strand_id })}
                            onSubjectCodeChange={(subject_code_shs) => onDataChange({ subject_code_shs })}
                            onGradeLevelChange={(grade_level) => onDataChange({ grade_level })}
                        />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Section and capacity</CardTitle>
                    <CardDescription>Set the section label, slot limit, and term for this class.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SectionSlotInput
                        sections={options.sections}
                        semesters={options.semesters}
                        section={data.section}
                        semester={data.semester}
                        schoolYear={data.school_year}
                        maximumSlots={data.maximum_slots}
                        onSectionChange={(section) => onDataChange({ section })}
                        onMaximumSlotsChange={(maximum_slots) => onDataChange({ maximum_slots })}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
