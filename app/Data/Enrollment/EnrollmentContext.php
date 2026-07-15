<?php

declare(strict_types=1);

namespace App\Data\Enrollment;

use App\Models\StudentEnrollment;

final readonly class EnrollmentContext
{
    /** @param array<string, mixed> $facts */
    public function __construct(
        public ?int $schoolId,
        public ?string $studentType,
        public ?int $courseId,
        public ?string $schoolYear,
        public ?int $semester,
        public ?int $yearLevel = null,
        public string $channel = 'administrator',
        public ?StudentEnrollment $enrollment = null,
        public array $facts = [],
    ) {}

    public static function fromEnrollment(StudentEnrollment $enrollment, string $channel = 'administrator'): self
    {
        $enrollment->loadMissing('student');

        return new self(
            schoolId: $enrollment->school_id === null ? null : (int) $enrollment->school_id,
            studentType: $enrollment->student?->student_type?->value ?? $enrollment->student?->student_type,
            courseId: $enrollment->course_id === null ? null : (int) $enrollment->course_id,
            schoolYear: $enrollment->school_year,
            semester: $enrollment->semester,
            yearLevel: $enrollment->academic_year,
            channel: $channel,
            enrollment: $enrollment,
        );
    }
}
