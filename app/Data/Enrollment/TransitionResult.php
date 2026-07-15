<?php

declare(strict_types=1);

namespace App\Data\Enrollment;

final readonly class TransitionResult
{
    /** @param array<int, array<string, mixed>> $actions */
    public function __construct(
        public bool $successful,
        public ?string $fromStepKey,
        public ?string $toStepKey,
        public ?string $terminalOutcome,
        public array $actions = [],
        public ?string $message = null,
    ) {}
}
