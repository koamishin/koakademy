<?php

declare(strict_types=1);

namespace App\Contracts\Enrollment;

use App\Data\Enrollment\EnrollmentContext;

interface EnrollmentAssignmentStrategy
{
    public function key(): string;

    /** @return array<string, mixed> */
    public function metadata(): array;

    /** @param array<string, mixed> $configuration @return array<string, mixed> */
    public function recommend(EnrollmentContext $context, array $configuration): array;
}
