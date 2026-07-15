<?php

declare(strict_types=1);

namespace App\Data\Enrollment;

final readonly class CompiledEnrollmentPolicy
{
    /**
     * @param  array<string, mixed>  $configuration
     * @param  array<int, int>  $sourceVersionIds
     * @param  array<int, array<string, mixed>>  $sourceLayers
     * @param  array<string, array<string, mixed>>  $sourceMap
     */
    public function __construct(
        public int $schemaVersion,
        public string $checksum,
        public array $configuration,
        public array $sourceVersionIds,
        public array $sourceLayers = [],
        public array $sourceMap = [],
    ) {}
}
