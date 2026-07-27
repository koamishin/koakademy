<?php

declare(strict_types=1);

namespace App\Enrollment\Strategies;

use App\Contracts\Enrollment\EnrollmentAssignmentStrategy;
use App\Contracts\Enrollment\EnrollmentOperatorSchemaProvider;
use App\Data\Enrollment\EnrollmentContext;

final readonly class ConfiguredAssignmentStrategy implements EnrollmentAssignmentStrategy, EnrollmentOperatorSchemaProvider
{
    public function __construct(private string $strategyKey, private string $label) {}

    public function key(): string
    {
        return $this->strategyKey;
    }

    public function metadata(): array
    {
        return ['key' => $this->strategyKey, 'label' => $this->label];
    }

    public function operatorSchema(): array
    {
        return [
            'description' => match ($this->strategyKey) {
                'assignment.manual' => 'Staff select subjects and classes during enrollment.',
                'assignment.recommendation' => 'Recommend curriculum subjects without saving them automatically.',
                'assignment.curriculum_automatic' => 'Add the matching curriculum subjects automatically.',
                'assignment.class_first_available' => 'Reserve the first class section with an available seat.',
                default => 'Assignment is managed by the registered extension.',
            },
            'fields' => match ($this->strategyKey) {
                'assignment.curriculum_automatic' => [[
                    'key' => 'include_irregular_subjects', 'label' => 'Include eligible irregular subjects', 'control' => 'boolean',
                ]],
                'assignment.class_first_available' => [[
                    'key' => 'prefer_least_filled', 'label' => 'Prefer the class with the most available seats', 'control' => 'boolean',
                ]],
                default => [],
            },
        ];
    }

    public function recommend(EnrollmentContext $context, array $configuration): array
    {
        return ['strategy' => $this->strategyKey, 'configuration' => $configuration, 'enrollment_id' => $context->enrollment?->id];
    }
}
