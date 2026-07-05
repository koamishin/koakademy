<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\OnboardingProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class OnboardingProgressController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $progress = OnboardingProgress::query()
            ->where('user_id', $user->id)
            ->where('variant', $request->string('variant', 'faculty')->toString())
            ->first();

        return response()->json([
            'progress' => $progress ? $this->formatProgress($progress) : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $variant = $request->string('variant', 'faculty')->toString();

        $validated = $request->validate([
            'completed_steps' => ['nullable', 'array'],
            'checklist_state' => ['nullable', 'array'],
            'current_step_index' => ['nullable', 'integer', 'min:0'],
            'is_dismissed' => ['nullable', 'boolean'],
        ]);

        $progress = OnboardingProgress::query()->firstOrNew([
            'user_id' => $user->id,
            'variant' => $variant,
        ]);

        $checklistState = $validated['checklist_state'] ?? $progress->checklist_state ?? [];
        $isDismissed = ($progress->exists && $progress->is_dismissed) || ($validated['is_dismissed'] ?? false);
        $isCompleted = $this->isCompleted($checklistState);

        $progress->forceFill([
            'completed_steps' => $validated['completed_steps'] ?? $progress->completed_steps ?? [],
            'checklist_state' => $checklistState,
            'current_step_index' => $validated['current_step_index'] ?? $progress->current_step_index ?? 0,
            'is_dismissed' => $isDismissed,
            'started_at' => $progress->started_at ?? now(),
            'last_seen_at' => now(),
            'completed_at' => $progress->completed_at ?? ($isDismissed || $isCompleted ? now() : null),
        ])->save();

        return response()->json([
            'progress' => $this->formatProgress($progress),
        ]);
    }

    private function isCompleted(?array $checklistState): bool
    {
        if (! is_array($checklistState) || $checklistState === []) {
            return false;
        }

        return collect($checklistState)->every(fn (bool $completed): bool => $completed);
    }

    /**
     * @return array{
     *     completedSteps: array<int, string>,
     *     checklistState: array<string, bool>,
     *     startedAt: string|null,
     *     completedAt: string|null,
     *     lastSeenAt: string|null,
     *     currentStepIndex: int,
     *     isDismissed: bool
     * }
     */
    private function formatProgress(OnboardingProgress $progress): array
    {
        return [
            'completedSteps' => $progress->completed_steps ?? [],
            'checklistState' => $progress->checklist_state ?? [],
            'startedAt' => $progress->started_at?->toISOString(),
            'completedAt' => $progress->completed_at?->toISOString(),
            'lastSeenAt' => $progress->last_seen_at?->toISOString(),
            'currentStepIndex' => $progress->current_step_index,
            'isDismissed' => $progress->is_dismissed,
        ];
    }
}
