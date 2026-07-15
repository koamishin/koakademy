<?php

declare(strict_types=1);

namespace App\Contracts\Enrollment;

use App\Data\Enrollment\EnrollmentContext;
use App\Data\Enrollment\RuleResult;

interface EnrollmentRuleHandler
{
    public function key(): string;

    /** @return array<string, mixed> */
    public function metadata(): array;

    /** @return array<string, mixed> */
    public function configurationSchema(): array;

    /** @param array<string, mixed> $configuration */
    public function evaluate(EnrollmentContext $context, array $configuration): RuleResult;
}
