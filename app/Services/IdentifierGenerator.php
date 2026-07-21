<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StudentType;
use App\Models\Faculty;
use App\Models\IdSequence;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class IdentifierGenerator
{
    public const Student = 'student';

    public const Staff = 'staff';

    public function preview(string $key): string
    {
        $sequence = $this->sequenceFor($key);

        return $this->format((int) $sequence->next_number, $sequence->padding);
    }

    public function generate(string $key): string
    {
        return DB::transaction(function () use ($key): string {
            $sequence = $this->sequenceFor($key, lock: true);
            $identifier = $this->format((int) $sequence->next_number, $sequence->padding);

            $sequence->forceFill([
                'next_number' => (int) $sequence->next_number + (int) $sequence->increment_by,
            ])->save();

            return $identifier;
        });
    }

    public function previewStudentId(): int
    {
        return (int) $this->preview(self::Student);
    }

    public function generateStudentId(): int
    {
        return (int) $this->generate(self::Student);
    }

    public function previewStaffId(): string
    {
        return $this->preview(self::Staff);
    }

    public function generateStaffId(): string
    {
        return $this->generate(self::Staff);
    }

    /**
     * @return array<string, array{key: string, label: string, start_number: int, next_number: int, increment_by: int, padding: int|null, preview: string}>
     */
    public function configuration(): array
    {
        return collect([self::Student, self::Staff])
            ->mapWithKeys(function (string $key): array {
                $sequence = $this->sequenceFor($key);

                return [
                    $key => [
                        'key' => $sequence->key,
                        'label' => $sequence->label,
                        'start_number' => (int) $sequence->start_number,
                        'next_number' => (int) $sequence->next_number,
                        'increment_by' => (int) $sequence->increment_by,
                        'padding' => $sequence->padding === null ? null : (int) $sequence->padding,
                        'preview' => $this->format((int) $sequence->next_number, $sequence->padding),
                    ],
                ];
            })
            ->all();
    }

    /**
     * @param  array<string, array{start_number: int, next_number: int, increment_by: int, padding: int|null}>  $sequences
     */
    public function updateConfiguration(array $sequences): void
    {
        DB::transaction(function () use ($sequences): void {
            foreach ([self::Student, self::Staff] as $key) {
                if (! isset($sequences[$key])) {
                    continue;
                }

                $sequence = $this->sequenceFor($key, lock: true);
                $sequence->forceFill([
                    'start_number' => $sequences[$key]['start_number'],
                    'next_number' => $sequences[$key]['next_number'],
                    'increment_by' => $sequences[$key]['increment_by'],
                    'padding' => $sequences[$key]['padding'],
                ])->save();
            }
        });
    }

    private function sequenceFor(string $key, bool $lock = false): IdSequence
    {
        $query = IdSequence::query()->where('key', $key);

        if ($lock) {
            $query->lockForUpdate();
        }

        $sequence = $query->first();

        if ($sequence instanceof IdSequence) {
            return $this->adaptToExistingRecords($sequence);
        }

        return IdSequence::query()->create($this->defaultsFor($key));
    }

    /**
     * @return array{key: string, label: string, start_number: int, next_number: int, increment_by: int, padding: int}
     */
    private function defaultsFor(string $key): array
    {
        return match ($key) {
            self::Student => $this->studentDefaults(),
            self::Staff => $this->staffDefaults(),
            default => throw new InvalidArgumentException("Unknown ID sequence [{$key}]."),
        };
    }

    /**
     * @return array{key: string, label: string, start_number: int, next_number: int, increment_by: int, padding: int}
     */
    private function studentDefaults(): array
    {
        $startNumber = 200000;
        $nextNumber = max((int) $this->latestCreatedGeneratedStudentId() + 1, $startNumber);

        return [
            'key' => self::Student,
            'label' => 'Student IDs',
            'start_number' => $startNumber,
            'next_number' => $nextNumber,
            'increment_by' => 1,
            'padding' => 6,
        ];
    }

    /**
     * @return array{key: string, label: string, start_number: int, next_number: int, increment_by: int, padding: int}
     */
    private function staffDefaults(): array
    {
        $startNumber = 800000;
        $latestNumericFacultyId = $this->latestNumericFacultyId();

        $nextNumber = max((int) $latestNumericFacultyId + 1, $startNumber);

        return [
            'key' => self::Staff,
            'label' => 'Staff IDs',
            'start_number' => $startNumber,
            'next_number' => $nextNumber,
            'increment_by' => 1,
            'padding' => 6,
        ];
    }

    private function adaptToExistingRecords(IdSequence $sequence): IdSequence
    {
        $latestStudentId = $sequence->key === self::Student
            ? $this->latestCreatedGeneratedStudentId()
            : null;

        $minimumNextNumber = match ($sequence->key) {
            self::Student => $latestStudentId === null
                ? (int) $sequence->start_number
                : $latestStudentId + 1,
            self::Staff => (int) $this->latestNumericFacultyId() + 1,
            default => (int) $sequence->next_number,
        };

        if ($sequence->key === self::Student && $this->shouldRepairStudentSequence((int) $sequence->next_number, $minimumNextNumber, $sequence->padding)) {
            $sequence->forceFill([
                'next_number' => max($minimumNextNumber, (int) $sequence->start_number),
            ])->save();

            return $sequence->refresh();
        }

        if ($minimumNextNumber <= (int) $sequence->next_number) {
            return $sequence;
        }

        $sequence->forceFill([
            'next_number' => $minimumNextNumber,
        ])->save();

        return $sequence->refresh();
    }

    private function latestNumericFacultyId(): ?int
    {
        return Faculty::query()
            ->whereNotNull('faculty_id_number')
            ->pluck('faculty_id_number')
            ->filter(fn (string $facultyIdNumber): bool => ctype_digit($facultyIdNumber))
            ->map(fn (string $facultyIdNumber): int => (int) $facultyIdNumber)
            ->max();
    }

    private function latestCreatedGeneratedStudentId(): ?int
    {
        return Student::query()
            ->withTrashed()
            ->where('student_type', '!=', StudentType::SeniorHighSchool->value)
            ->whereNotNull('student_id')
            ->latest('created_at')
            ->latest('id')
            ->value('student_id');
    }

    private function shouldRepairStudentSequence(int $nextNumber, int $expectedNextNumber, ?int $padding): bool
    {
        if ($padding !== null && mb_strlen((string) $nextNumber) > $padding) {
            return true;
        }

        $distanceFromLatestPattern = abs($nextNumber - $expectedNextNumber);

        return $distanceFromLatestPattern > 100000;
    }

    private function format(int $number, ?int $padding): string
    {
        if ($padding === null || $padding < 1) {
            return (string) $number;
        }

        return mb_str_pad((string) $number, $padding, '0', STR_PAD_LEFT);
    }
}
