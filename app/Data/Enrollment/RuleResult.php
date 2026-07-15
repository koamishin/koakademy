<?php

declare(strict_types=1);

namespace App\Data\Enrollment;

final readonly class RuleResult
{
    /** @param array<string, mixed> $metadata */
    public function __construct(public bool $passed, public string $message = '', public array $metadata = []) {}

    /** @param array<string, mixed> $metadata */
    public static function pass(array $metadata = []): self
    {
        return new self(true, metadata: $metadata);
    }

    /** @param array<string, mixed> $metadata */
    public static function fail(string $message, array $metadata = []): self
    {
        return new self(false, $message, $metadata);
    }
}
