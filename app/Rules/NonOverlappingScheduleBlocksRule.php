<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

final class NonOverlappingScheduleBlocksRule implements ValidationRule
{
    /**
     * @param  Closure(string): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_array($value)) {
            return;
        }

        $blocks = array_values($value);

        foreach ($blocks as $leftIndex => $left) {
            if (! is_array($left)) {
                continue;
            }

            $leftStart = $this->timeToMinutes($left['start_time'] ?? null);
            $leftEnd = $this->timeToMinutes($left['end_time'] ?? null);
            $leftDay = $this->normalizeDay($left['day_of_week'] ?? null);

            if ($leftDay === null || $leftStart === null || $leftEnd === null || $leftEnd <= $leftStart) {
                continue;
            }

            for ($rightIndex = $leftIndex + 1; $rightIndex < count($blocks); $rightIndex++) {
                $right = $blocks[$rightIndex];

                if (! is_array($right) || $this->normalizeDay($right['day_of_week'] ?? null) !== $leftDay) {
                    continue;
                }

                $rightStart = $this->timeToMinutes($right['start_time'] ?? null);
                $rightEnd = $this->timeToMinutes($right['end_time'] ?? null);

                if ($rightStart === null || $rightEnd === null || $rightEnd <= $rightStart) {
                    continue;
                }

                if ($leftStart === $rightStart && $leftEnd === $rightEnd && (string) ($left['room_id'] ?? '') === (string) ($right['room_id'] ?? '')) {
                    $fail(sprintf('Schedule blocks %d and %d are duplicates.', $leftIndex + 1, $rightIndex + 1));

                    return;
                }

                if ($rightStart < $leftEnd && $rightEnd > $leftStart) {
                    $fail(sprintf('Schedule blocks %d and %d overlap on %s.', $leftIndex + 1, $rightIndex + 1, $leftDay));

                    return;
                }
            }
        }
    }

    private function normalizeDay(mixed $day): ?string
    {
        if (! is_string($day) || mb_trim($day) === '') {
            return null;
        }

        return mb_ucfirst(mb_strtolower(mb_trim($day)));
    }

    private function timeToMinutes(mixed $time): ?int
    {
        if (! is_string($time) || ! preg_match('/^(\d{1,2}):(\d{2})/', $time, $matches)) {
            return null;
        }

        $hours = (int) $matches[1];
        $minutes = (int) $matches[2];

        if ($hours > 23 || $minutes > 59) {
            return null;
        }

        return ($hours * 60) + $minutes;
    }
}
