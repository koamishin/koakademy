<?php

declare(strict_types=1);

namespace App\Enrollment\Actions;

use App\Contracts\Enrollment\EnrollmentActionHandler;
use App\Contracts\Enrollment\EnrollmentOperatorSchemaProvider;
use App\Data\Enrollment\ActionResult;
use App\Data\Enrollment\EnrollmentContext;
use App\Jobs\GenerateAssessmentPdfJob;
use App\Jobs\SendAssessmentNotificationJob;
use App\Models\ClassEnrollment;
use App\Models\Classes;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\SubjectEnrollment;
use App\Services\ClassEnrollmentService;
use App\Services\EnrollmentService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final readonly class EnrollmentIntegrationActionHandler implements EnrollmentActionHandler, EnrollmentOperatorSchemaProvider
{
    public function __construct(
        private string $handlerKey,
        private string $label,
        private EnrollmentService $enrollmentService,
        private ClassEnrollmentService $classEnrollmentService,
    ) {}

    public function key(): string
    {
        return $this->handlerKey;
    }

    public function metadata(): array
    {
        return [
            'key' => $this->handlerKey,
            'label' => $this->label,
            'category' => 'integration',
            'requires_configuration' => false,
        ];
    }

    public function payloadSchema(): array
    {
        return match ($this->handlerKey) {
            'enrollment.verify_academic' => ['type' => 'object'],
            'enrollment.verify_payment' => [
                'type' => 'object',
                'required' => ['invoicenumber', 'settlements', 'payment_method'],
                'properties' => [
                    'invoicenumber' => ['type' => 'string'],
                    'settlements' => ['type' => 'object'],
                    'payment_method' => ['type' => 'string'],
                ],
            ],
            'enrollment.assign_subjects' => [
                'type' => 'object',
                'properties' => [
                    'subjects' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'required' => ['subject_id'],
                            'properties' => [
                                'subject_id' => ['type' => 'integer'],
                                'is_modular' => ['type' => 'boolean'],
                                'exclude_from_tuition' => ['type' => 'boolean'],
                                'lecture_fee' => ['type' => 'number', 'minimum' => 0],
                                'laboratory_fee' => ['type' => 'number', 'minimum' => 0],
                            ],
                        ],
                    ],
                ],
            ],
            'enrollment.assign_classes' => [
                'type' => 'object',
                'properties' => [
                    'assignments' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'required' => ['subject_id', 'class_id'],
                            'properties' => [
                                'subject_id' => ['type' => 'integer'],
                                'class_id' => ['type' => 'integer'],
                            ],
                        ],
                    ],
                ],
            ],
            'enrollment.calculate_tuition' => [
                'type' => 'object',
                'properties' => [
                    'discount_percentage' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                    'downpayment' => ['type' => 'number', 'minimum' => 0],
                ],
            ],
            'enrollment.generate_assessment' => [
                'type' => 'object',
                'properties' => ['create_new_file' => ['type' => 'boolean']],
            ],
            'enrollment.notify' => [
                'type' => 'object',
                'properties' => ['notification' => ['type' => 'string', 'enum' => ['assessment']]],
            ],
            default => ['type' => 'object'],
        };
    }

    public function operatorSchema(): array
    {
        return [
            'description' => match ($this->handlerKey) {
                'enrollment.verify_academic' => 'Run the existing academic verification and synchronization behavior.',
                'enrollment.verify_payment' => 'Run the existing cashier verification, billing, and account synchronization behavior.',
                'enrollment.assign_subjects' => 'Create missing subject enrollments from the curriculum or transition payload.',
                'enrollment.assign_classes' => 'Reserve explicitly selected classes or the first class with an available seat.',
                'enrollment.calculate_tuition' => 'Create tuition from the enrollment subjects using the existing course-rate calculator.',
                'enrollment.generate_assessment' => 'Queue assessment PDF generation after the workflow transaction commits.',
                'enrollment.notify' => 'Queue an assessment notification after the workflow transaction commits.',
                default => 'Run the registered enrollment integration.',
            },
            'fields' => match ($this->handlerKey) {
                'enrollment.assign_subjects' => [
                    [
                        'key' => 'source', 'label' => 'Subject source', 'control' => 'select', 'required' => true,
                        'options' => [
                            ['value' => 'curriculum', 'label' => 'Matching curriculum'],
                            ['value' => 'runtime_payload', 'label' => 'Transition payload'],
                        ],
                    ],
                    [
                        'key' => 'allow_cross_program_subjects', 'label' => 'Allow subjects from another program',
                        'control' => 'boolean',
                    ],
                ],
                'enrollment.assign_classes' => [[
                    'key' => 'mode', 'label' => 'Class selection', 'control' => 'select', 'required' => true,
                    'options' => [
                        ['value' => 'first_available', 'label' => 'First available class'],
                        ['value' => 'runtime_payload', 'label' => 'Transition payload'],
                    ],
                ]],
                'enrollment.calculate_tuition' => [[
                    'key' => 'discount_percentage', 'label' => 'Default discount', 'control' => 'percentage',
                    'minimum' => 0, 'maximum' => 100,
                ]],
                'enrollment.generate_assessment' => [[
                    'key' => 'create_new_file', 'label' => 'Always create a new assessment file', 'control' => 'boolean',
                ]],
                'enrollment.notify' => [[
                    'key' => 'notification', 'label' => 'Notification', 'control' => 'select', 'required' => true,
                    'options' => [['value' => 'assessment', 'label' => 'Assessment email']],
                ]],
                default => [],
            },
        ];
    }

    public function execute(EnrollmentContext $context, array $configuration, string $idempotencyKey): ActionResult
    {
        $enrollment = $context->enrollment;
        if (! $enrollment instanceof StudentEnrollment || ! $enrollment->exists) {
            return ActionResult::failure('This integration requires a persisted enrollment.');
        }

        return match ($this->handlerKey) {
            'enrollment.verify_academic' => $this->verifyAcademic($enrollment),
            'enrollment.verify_payment' => $this->verifyPayment($enrollment, $configuration),
            'enrollment.assign_subjects' => $this->assignSubjects($enrollment, $configuration),
            'enrollment.assign_classes' => $this->assignClasses($enrollment, $configuration),
            'enrollment.calculate_tuition' => $this->calculateTuition($enrollment, $configuration),
            'enrollment.generate_assessment' => $this->generateAssessment($enrollment, $configuration, $idempotencyKey),
            'enrollment.notify' => $this->notify($enrollment, $configuration, $idempotencyKey),
            default => ActionResult::failure("No integration executor is configured for [{$this->handlerKey}]."),
        };
    }

    private function verifyAcademic(StudentEnrollment $enrollment): ActionResult
    {
        if (! $enrollment->subjectsEnrolled()->exists()) {
            return ActionResult::success(['verified' => 'academic', 'subjects' => 0]);
        }

        return $this->enrollmentService->verifyByHeadDept($enrollment)
            ? ActionResult::success(['verified' => 'academic'])
            : ActionResult::failure('Academic verification could not be completed.');
    }

    /** @param array<string, mixed> $configuration */
    private function verifyPayment(StudentEnrollment $enrollment, array $configuration): ActionResult
    {
        $payload = $this->runtimePayload($configuration);

        return $this->enrollmentService->verifyByCashier($enrollment, $payload)
            ? ActionResult::success(['verified' => 'payment'])
            : ActionResult::failure('Payment verification could not be completed.');
    }

    /** @param array<string, mixed> $configuration */
    private function assignSubjects(StudentEnrollment $enrollment, array $configuration): ActionResult
    {
        $runtimePayload = $this->runtimePayload($configuration);
        $source = (string) ($configuration['source'] ?? (isset($runtimePayload['subjects']) ? 'runtime_payload' : 'curriculum'));
        if (! in_array($source, ['curriculum', 'runtime_payload'], true)) {
            return ActionResult::failure("Subject source [{$source}] is not supported.");
        }
        $subjects = $source === 'runtime_payload'
            ? $this->payloadSubjects($runtimePayload)
            : $this->curriculumSubjects($enrollment);

        if ($subjects->isEmpty()) {
            return ActionResult::failure($source === 'runtime_payload'
                ? 'The transition payload does not contain any subjects.'
                : 'No curriculum subjects match this enrollment.');
        }
        if ($source === 'runtime_payload' && $subjects->count() !== collect($runtimePayload['subjects'] ?? [])->count()) {
            return ActionResult::failure('One or more transition payload subjects do not exist.');
        }

        $allowCrossProgram = (bool) ($configuration['allow_cross_program_subjects'] ?? false);
        $course = $enrollment->course()->first();
        $created = [];

        foreach ($subjects as $item) {
            $subject = $item['subject'];
            if (! $allowCrossProgram && $enrollment->course_id !== null && (int) $subject->course_id !== (int) $enrollment->course_id) {
                return ActionResult::failure("Subject [{$subject->code}] does not belong to the enrollment program.");
            }

            $lectureFee = array_key_exists('lecture_fee', $item)
                ? (float) $item['lecture_fee']
                : ((int) $subject->lecture + (int) $subject->laboratory) * (float) ($course?->lec_per_unit ?? 0);
            $laboratoryFee = array_key_exists('laboratory_fee', $item)
                ? (float) $item['laboratory_fee']
                : (int) $subject->laboratory * (float) ($course?->lab_per_unit ?? 0);

            $subjectEnrollment = $enrollment->subjectsEnrolled()->firstOrCreate(
                [
                    'subject_id' => $subject->id,
                    'student_id' => $enrollment->student_id,
                    'enrollment_id' => $enrollment->id,
                ],
                [
                    'school_id' => $enrollment->school_id,
                    'academic_year' => $enrollment->academic_year,
                    'school_year' => $enrollment->school_year,
                    'semester' => $enrollment->semester,
                    'is_modular' => (bool) ($item['is_modular'] ?? false),
                    'exclude_from_tuition' => (bool) ($item['exclude_from_tuition'] ?? false),
                    'lecture_fee' => $lectureFee,
                    'laboratory_fee' => $laboratoryFee,
                    'enrolled_lecture_units' => (int) $subject->lecture,
                    'enrolled_laboratory_units' => (int) $subject->laboratory,
                ],
            );
            $created[] = $subjectEnrollment->id;
        }

        return ActionResult::success(['subject_enrollment_ids' => $created, 'source' => $source]);
    }

    /** @param array<string, mixed> $configuration */
    private function assignClasses(StudentEnrollment $enrollment, array $configuration): ActionResult
    {
        $runtimePayload = $this->runtimePayload($configuration);
        $mode = (string) ($configuration['mode'] ?? (isset($runtimePayload['assignments']) ? 'runtime_payload' : 'first_available'));
        if (! in_array($mode, ['first_available', 'runtime_payload'], true)) {
            return ActionResult::failure("Class selection mode [{$mode}] is not supported.");
        }
        $assignments = collect($runtimePayload['assignments'] ?? [])->filter(fn (mixed $item): bool => is_array($item))
            ->keyBy(fn (array $item): int => (int) ($item['subject_id'] ?? 0));
        $subjectEnrollments = $enrollment->subjectsEnrolled()->with('subject')->orderBy('id')->get();

        if ($subjectEnrollments->isEmpty()) {
            return ActionResult::failure('Subjects must be assigned before classes can be assigned.');
        }
        if ($mode === 'runtime_payload' && $assignments->isEmpty()) {
            return ActionResult::failure('The transition payload does not contain any class assignments.');
        }

        Student::query()->whereKey($enrollment->student_id)->lockForUpdate()->firstOrFail();

        $assigned = [];
        foreach ($subjectEnrollments as $subjectEnrollment) {
            $requestedClassId = data_get($assignments->get((int) $subjectEnrollment->subject_id), 'class_id');
            if ($mode === 'runtime_payload' && $requestedClassId === null) {
                continue;
            }

            $class = $requestedClassId === null
                ? $this->lockFirstAvailableClass($enrollment, $subjectEnrollment)
                : Classes::query()->lockForUpdate()->find((int) $requestedClassId);

            if (! $class instanceof Classes || ! $this->classMatchesEnrollment($class, $enrollment, $subjectEnrollment)) {
                return ActionResult::failure("No eligible class is available for subject [{$subjectEnrollment->subject?->code}].");
            }
            if ($this->classIsFull($class, (int) $enrollment->student_id)) {
                return ActionResult::failure("Class [{$class->section}] has no available seats.");
            }

            $this->classEnrollmentService->enrollOnce((int) $enrollment->student_id, (int) $class->id, [
                'school_id' => $enrollment->school_id,
                'status' => true,
            ]);
            $subjectEnrollment->update(['class_id' => $class->id]);
            $assigned[] = ['subject_enrollment_id' => $subjectEnrollment->id, 'class_id' => $class->id];
        }

        if ($assigned === []) {
            return ActionResult::failure('No classes were assigned.');
        }
        if ($mode === 'runtime_payload' && count($assigned) !== $assignments->count()) {
            return ActionResult::failure('One or more transition payload class assignments do not match enrolled subjects.');
        }

        return ActionResult::success(['assignments' => $assigned, 'mode' => $mode]);
    }

    /** @param array<string, mixed> $configuration */
    private function calculateTuition(StudentEnrollment $enrollment, array $configuration): ActionResult
    {
        $existing = $enrollment->studentTuition()->first();
        if ($existing !== null) {
            return ActionResult::success(['tuition_id' => $existing->id, 'already_exists' => true]);
        }

        $runtimePayload = $this->runtimePayload($configuration);
        $subjects = $enrollment->subjectsEnrolled()->get()->map(fn (SubjectEnrollment $subjectEnrollment): array => [
            'subject_id' => $subjectEnrollment->subject_id,
            'is_modular' => $subjectEnrollment->is_modular,
            'exclude_from_tuition' => $subjectEnrollment->exclude_from_tuition,
            'lecture' => $subjectEnrollment->lecture_fee,
            'laboratory' => $subjectEnrollment->laboratory_fee,
        ])->all();

        if ($subjects === []) {
            return ActionResult::failure('Tuition cannot be calculated before subjects are assigned.');
        }

        $discount = (int) ($runtimePayload['discount_percentage'] ?? $configuration['discount_percentage'] ?? 0);
        if ($discount < 0 || $discount > 100) {
            return ActionResult::failure('Tuition discount must be between 0 and 100 percent.');
        }

        $tuition = $this->enrollmentService->createStudentTuition($enrollment, [
            'subjectsEnrolled' => $subjects,
            'discount' => $discount,
            'downpayment' => (float) ($runtimePayload['downpayment'] ?? $enrollment->downpayment ?? 0),
            'additionalFees' => $enrollment->additionalFees()->get(['fee_name', 'amount'])->toArray(),
        ]);

        return $tuition instanceof \App\Models\StudentTuition
            ? ActionResult::success(['tuition_id' => $tuition->id, 'overall_tuition' => $tuition->overall_tuition])
            : ActionResult::failure('The existing tuition service could not calculate tuition for this enrollment.');
    }

    /** @param array<string, mixed> $configuration */
    private function generateAssessment(StudentEnrollment $enrollment, array $configuration, string $idempotencyKey): ActionResult
    {
        $runtimePayload = $this->runtimePayload($configuration);
        $createNewFile = (bool) ($runtimePayload['create_new_file'] ?? $configuration['create_new_file'] ?? false);
        $jobId = $this->jobId('policy_assessment', $idempotencyKey);

        GenerateAssessmentPdfJob::dispatch($enrollment->id, $jobId, $createNewFile)->afterCommit();

        return ActionResult::success(['job_id' => $jobId, 'queued_after_commit' => true]);
    }

    /** @param array<string, mixed> $configuration */
    private function notify(StudentEnrollment $enrollment, array $configuration, string $idempotencyKey): ActionResult
    {
        $runtimePayload = $this->runtimePayload($configuration);
        $notification = (string) ($runtimePayload['notification'] ?? $configuration['notification'] ?? 'assessment');
        if ($notification !== 'assessment') {
            return ActionResult::failure("Notification [{$notification}] is not supported by the core enrollment integration.");
        }

        $enrollment->loadMissing('student');
        if (! is_string($enrollment->student?->email) || $enrollment->student->email === '') {
            return ActionResult::failure('The student must have an email address before an assessment notification can be queued.');
        }

        $jobId = $this->jobId('policy_notification', $idempotencyKey);
        SendAssessmentNotificationJob::dispatch($enrollment->id, $jobId)->afterCommit();

        return ActionResult::success(['job_id' => $jobId, 'notification' => $notification, 'queued_after_commit' => true]);
    }

    /** @return Collection<int, array{subject: Subject, is_modular?: bool, exclude_from_tuition?: bool, lecture_fee?: float, laboratory_fee?: float}> */
    private function curriculumSubjects(StudentEnrollment $enrollment): Collection
    {
        if ($enrollment->course_id === null) {
            return collect();
        }

        return Subject::query()
            ->where('course_id', $enrollment->course_id)
            ->where('academic_year', $enrollment->academic_year)
            ->where('semester', $enrollment->semester)
            ->orderBy('code')
            ->get()
            ->map(fn (Subject $subject): array => ['subject' => $subject]);
    }

    /** @param array<string, mixed> $runtimePayload @return Collection<int, array<string, mixed>> */
    private function payloadSubjects(array $runtimePayload): Collection
    {
        $items = collect($runtimePayload['subjects'] ?? [])->filter(fn (mixed $item): bool => is_array($item));
        $subjects = Subject::query()->whereKey($items->pluck('subject_id')->map(fn (mixed $id): int => (int) $id)->filter())->get()->keyBy('id');

        return $items->map(function (array $item) use ($subjects): ?array {
            $subject = $subjects->get((int) ($item['subject_id'] ?? 0));

            return $subject instanceof Subject ? [...$item, 'subject' => $subject] : null;
        })->filter()->values();
    }

    private function lockFirstAvailableClass(StudentEnrollment $enrollment, SubjectEnrollment $subjectEnrollment): ?Classes
    {
        $candidateIds = Classes::query()
            ->forAcademicPeriod((string) $enrollment->school_year, (int) $enrollment->semester)
            ->when($enrollment->school_id !== null, fn (Builder $query): Builder => $query->where('school_id', $enrollment->school_id))
            ->where(function (Builder $query) use ($subjectEnrollment): void {
                $query->where('subject_id', $subjectEnrollment->subject_id)
                    ->orWhereJsonContains('subject_ids', (int) $subjectEnrollment->subject_id)
                    ->orWhereJsonContains('subject_ids', (string) $subjectEnrollment->subject_id);
                $subjectCode = mb_trim((string) $subjectEnrollment->subject?->code);
                if ($subjectCode !== '') {
                    $query->orWhere('subject_code', $subjectCode);
                }
            })
            ->orderBy('id')
            ->pluck('id');

        foreach ($candidateIds as $candidateId) {
            $class = Classes::query()->lockForUpdate()->find($candidateId);
            if ($class instanceof Classes && ! $this->classIsFull($class, (int) $enrollment->student_id)) {
                return $class;
            }
        }

        return null;
    }

    private function classMatchesEnrollment(Classes $class, StudentEnrollment $enrollment, SubjectEnrollment $subjectEnrollment): bool
    {
        $matchesPeriod = Classes::query()->whereKey($class->id)
            ->forAcademicPeriod((string) $enrollment->school_year, (int) $enrollment->semester)
            ->exists();
        $matchesSchool = $enrollment->school_id === null || (int) $class->school_id === (int) $enrollment->school_id;
        $classSubjectCode = mb_trim((string) $class->subject_code);
        $enrollmentSubjectCode = mb_trim((string) $subjectEnrollment->subject?->code);
        $matchesSubject = (int) $class->subject_id === (int) $subjectEnrollment->subject_id
            || ($classSubjectCode !== '' && $enrollmentSubjectCode !== '' && $classSubjectCode === $enrollmentSubjectCode)
            || in_array((int) $subjectEnrollment->subject_id, array_map(intval(...), $class->subject_ids ?? []), true);

        return $matchesPeriod && $matchesSchool && $matchesSubject;
    }

    private function classIsFull(Classes $class, int $studentId): bool
    {
        if (ClassEnrollment::query()->where('class_id', $class->id)->where('student_id', $studentId)->exists()) {
            return false;
        }

        return (int) $class->maximum_slots > 0
            && $class->class_enrollments()->where('status', true)->count() >= (int) $class->maximum_slots;
    }

    /** @param array<string, mixed> $configuration @return array<string, mixed> */
    private function runtimePayload(array $configuration): array
    {
        return is_array($configuration['runtime_payload'] ?? null) ? $configuration['runtime_payload'] : [];
    }

    private function jobId(string $prefix, string $idempotencyKey): string
    {
        return $prefix.'_'.mb_substr(hash('sha256', $idempotencyKey), 0, 32);
    }
}
