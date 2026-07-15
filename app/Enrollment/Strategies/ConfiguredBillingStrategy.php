<?php

declare(strict_types=1);

namespace App\Enrollment\Strategies;

use App\Contracts\Enrollment\EnrollmentBillingStrategy;
use App\Contracts\Enrollment\EnrollmentOperatorSchemaProvider;
use App\Data\Enrollment\EnrollmentContext;

final readonly class ConfiguredBillingStrategy implements EnrollmentBillingStrategy, EnrollmentOperatorSchemaProvider
{
    public function __construct(private string $strategyKey, private string $label) {}

    public function key(): string
    {
        return $this->strategyKey;
    }

    public function metadata(): array
    {
        return ['key' => $this->key(), 'label' => $this->label];
    }

    public function operatorSchema(): array
    {
        return [
            'description' => 'Use the program lecture, laboratory, miscellaneous fee, and existing discount rules.',
            'fields' => [
                [
                    'key' => 'discount_percentage', 'label' => 'Default discount', 'control' => 'percentage',
                    'minimum' => 0, 'maximum' => 100,
                ],
                [
                    'key' => 'minimum_payment_type', 'label' => 'Minimum payment', 'control' => 'select',
                    'options' => [
                        ['value' => 'none', 'label' => 'No minimum'],
                        ['value' => 'fixed', 'label' => 'Fixed amount'],
                        ['value' => 'percentage', 'label' => 'Percentage of tuition'],
                    ],
                ],
                [
                    'key' => 'minimum_payment_value',
                    'label' => 'Minimum amount or percentage',
                    'control' => 'number',
                    'required' => true,
                    'min' => 0,
                    'visible_when' => ['field' => 'minimum_payment_type', 'in' => ['fixed', 'percentage']],
                ],
            ],
        ];
    }

    public function calculate(EnrollmentContext $context, array $configuration): array
    {
        return ['strategy' => $this->key(), 'configuration' => $configuration, 'enrollment_id' => $context->enrollment?->id];
    }
}
