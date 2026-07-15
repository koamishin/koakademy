<?php

declare(strict_types=1);

namespace App\Contracts\Enrollment;

use App\Data\Enrollment\ActionResult;
use App\Data\Enrollment\EnrollmentContext;

interface EnrollmentActionHandler
{
    public function key(): string;

    /** @return array<string, mixed> */
    public function metadata(): array;

    /** @return array<string, mixed> */
    public function payloadSchema(): array;

    /** @param array<string, mixed> $configuration */
    public function execute(EnrollmentContext $context, array $configuration, string $idempotencyKey): ActionResult;
}
