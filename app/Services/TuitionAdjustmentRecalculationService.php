<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\StudentTuition;

/**
 * Keeps a Finance-approved assessment adjustment separate from enrollment
 * recalculations. The adjustment is a reconciliation delta, not a course fee.
 */
final readonly class TuitionAdjustmentRecalculationService
{
    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function preserveFinanceAdjustment(?StudentTuition $existingTuition, array $attributes): array
    {
        if (! $existingTuition instanceof StudentTuition) {
            return $attributes;
        }

        $assessmentAdjustment = round((float) ($existingTuition->assessment_adjustment ?? 0), 2);

        if (abs($assessmentAdjustment) < 0.005) {
            return $attributes;
        }

        $recalculatedBase = round((float) ($attributes['overall_tuition'] ?? 0), 2);
        $assessedTotal = round($recalculatedBase + $assessmentAdjustment, 2);

        return [
            ...$attributes,
            'overall_tuition' => $assessedTotal,
            'total_balance' => $assessedTotal,
            'assessment_adjustment' => $assessmentAdjustment,
        ];
    }
}
