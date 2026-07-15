<?php

declare(strict_types=1);

namespace App\Enrollment;

use App\Data\Enrollment\TransitionResult;
use App\Enrollment\Exceptions\EnrollmentTransitionException;
use App\Models\StudentEnrollment;
use App\Models\User;
use App\Services\EnrollmentPipelineService;
use App\Services\EnrollmentService;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class EnrollmentWorkflowCoordinator
{
    public function __construct(
        private EnrollmentTransitionEngine $engine,
        private EnrollmentService $legacyEnrollmentService,
        private EnrollmentPipelineService $legacyPipeline,
    ) {}

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes, ?Closure $afterCreate = null): StudentEnrollment
    {
        return DB::transaction(function () use ($attributes, $afterCreate): StudentEnrollment {
            $enrollment = StudentEnrollment::query()->create($attributes);
            $afterCreate?->__invoke($enrollment);

            return $enrollment->refresh();
        }, 3);
    }

    public function updateLegacyReportingStatus(StudentEnrollment $enrollment, string $status): void
    {
        if ($enrollment->workflow_runtime !== StudentEnrollment::WorkflowRuntimeLegacy) {
            throw new EnrollmentTransitionException('Policy enrollment statuses can only change through a workflow transition.');
        }

        $enrollment->forceFill(['status' => $status])->save();
    }

    /** @param array<string, mixed> $payload */
    public function transition(StudentEnrollment $enrollment, User $actor, ?string $transitionKey, array $payload = [], ?string $idempotencyKey = null): TransitionResult
    {
        if ($enrollment->workflow_runtime === StudentEnrollment::WorkflowRuntimePolicyV1) {
            return $this->engine->transition($enrollment, $actor, $transitionKey, $payload, $idempotencyKey ?? (string) Str::uuid());
        }

        $nextStep = $this->legacyPipeline->getNextStep($enrollment->status);
        if ($nextStep === null) {
            throw new EnrollmentTransitionException('No next legacy enrollment step is available.');
        }
        if (! $this->legacyPipeline->canUserPerformStep($actor, $nextStep)) {
            throw new EnrollmentTransitionException('You are not allowed to complete this enrollment step.');
        }

        $from = $enrollment->status;
        $successful = match ($nextStep['action_type'] ?? 'standard') {
            'department_verification' => $this->legacyEnrollmentService->verifyByHeadDept($enrollment),
            'cashier_verification' => $this->legacyEnrollmentService->verifyByCashier($enrollment, $payload),
            default => $enrollment->forceFill(['status' => $nextStep['status']])->save(),
        };

        if (! $successful) {
            throw new EnrollmentTransitionException('The legacy enrollment step could not be completed.');
        }

        return new TransitionResult(true, $from, (string) $nextStep['key'], null, message: 'Enrollment advanced.');
    }

    public function verifyAcademic(StudentEnrollment $enrollment, User $actor, ?string $idempotencyKey = null): TransitionResult
    {
        return $this->transitionByAction($enrollment, $actor, 'enrollment.verify_academic', [], $idempotencyKey);
    }

    /** @param array<string, mixed> $payload */
    public function verifyPayment(StudentEnrollment $enrollment, User $actor, array $payload, ?string $idempotencyKey = null): TransitionResult
    {
        return $this->transitionByAction($enrollment, $actor, 'enrollment.verify_payment', $payload, $idempotencyKey);
    }

    public function reopen(StudentEnrollment $enrollment, User $actor, ?string $targetStepKey, string $reason, ?string $idempotencyKey = null): TransitionResult
    {
        if ($enrollment->workflow_runtime === StudentEnrollment::WorkflowRuntimePolicyV1) {
            return $this->engine->reopen($enrollment, $actor, $targetStepKey, $reason, $idempotencyKey ?? (string) Str::uuid());
        }

        $successful = $this->legacyPipeline->isCashierVerified($enrollment->status)
            ? $this->legacyEnrollmentService->undoCashierVerification((int) $enrollment->id)
            : $this->legacyEnrollmentService->undoHeadDeptVerification($enrollment);
        if (! $successful) {
            throw new EnrollmentTransitionException('The legacy enrollment could not be reopened.');
        }

        return new TransitionResult(true, null, null, null, message: 'Enrollment reopened.');
    }

    /** @param array<string, mixed> $payload */
    private function transitionByAction(StudentEnrollment $enrollment, User $actor, string $handler, array $payload, ?string $idempotencyKey): TransitionResult
    {
        if ($enrollment->workflow_runtime !== StudentEnrollment::WorkflowRuntimePolicyV1) {
            return $this->transition($enrollment, $actor, null, $payload, $idempotencyKey);
        }

        $enrollment->loadMissing('policySnapshot');
        $steps = collect(data_get($enrollment->policySnapshot?->configuration, 'workflow.steps', []))->keyBy('key');
        $current = $steps->get($enrollment->current_step_key);
        if (! is_array($current)) {
            throw new EnrollmentTransitionException('The pinned workflow step is unavailable.');
        }

        $transition = collect($current['transitions'] ?? [])->first(function (array $transition) use ($steps, $handler): bool {
            $target = $steps->get($transition['to'] ?? '');

            return is_array($target) && collect($target['actions'] ?? [])->contains(fn (array $action): bool => ($action['handler'] ?? null) === $handler);
        });
        if (! is_array($transition)) {
            throw new EnrollmentTransitionException('The configured workflow has no matching verification transition.');
        }

        $target = $steps->get($transition['to']);
        $actionPayloads = collect($target['actions'] ?? [])
            ->filter(fn (array $action): bool => ($action['handler'] ?? null) === $handler)
            ->mapWithKeys(fn (array $action, int $index): array => [(string) ($action['key'] ?? $index) => $payload])
            ->all();

        return $this->engine->transition($enrollment, $actor, $transition['key'] ?? null, $actionPayloads, $idempotencyKey ?? (string) Str::uuid());
    }
}
