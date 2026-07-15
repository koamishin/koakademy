<?php

declare(strict_types=1);

namespace App\Data\Enrollment;

final readonly class ActionResult
{
    /** @param array<string, mixed> $metadata */
    public function __construct(public bool $successful, public string $message = '', public array $metadata = []) {}

    /** @param array<string, mixed> $metadata */
    public static function success(array $metadata = []): self
    {
        return new self(true, metadata: $metadata);
    }

    public static function failure(string $message): self
    {
        return new self(false, $message);
    }
}
