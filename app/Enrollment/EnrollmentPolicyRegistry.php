<?php

declare(strict_types=1);

namespace App\Enrollment;

use App\Contracts\Enrollment\EnrollmentActionHandler;
use App\Contracts\Enrollment\EnrollmentAssignmentStrategy;
use App\Contracts\Enrollment\EnrollmentBillingStrategy;
use App\Contracts\Enrollment\EnrollmentOperatorSchemaProvider;
use App\Contracts\Enrollment\EnrollmentRuleHandler;
use InvalidArgumentException;

final class EnrollmentPolicyRegistry
{
    /** @var array<string, EnrollmentRuleHandler> */
    private array $rules = [];

    /** @var array<string, EnrollmentActionHandler> */
    private array $actions = [];

    /** @var array<string, EnrollmentBillingStrategy> */
    private array $billingStrategies = [];

    /** @var array<string, EnrollmentAssignmentStrategy> */
    private array $assignmentStrategies = [];

    public function registerRule(EnrollmentRuleHandler $handler): void
    {
        $this->rules[$handler->key()] = $handler;
    }

    public function registerAction(EnrollmentActionHandler $handler): void
    {
        $this->actions[$handler->key()] = $handler;
    }

    public function registerBillingStrategy(EnrollmentBillingStrategy $strategy): void
    {
        $this->billingStrategies[$strategy->key()] = $strategy;
    }

    public function registerAssignmentStrategy(EnrollmentAssignmentStrategy $strategy): void
    {
        $this->assignmentStrategies[$strategy->key()] = $strategy;
    }

    public function rule(string $key): EnrollmentRuleHandler
    {
        return $this->rules[$key] ?? throw new InvalidArgumentException("Unknown enrollment rule handler [{$key}].");
    }

    public function action(string $key): EnrollmentActionHandler
    {
        return $this->actions[$key] ?? throw new InvalidArgumentException("Unknown enrollment action handler [{$key}].");
    }

    public function hasRule(string $key): bool
    {
        return isset($this->rules[$key]);
    }

    public function hasAction(string $key): bool
    {
        return isset($this->actions[$key]);
    }

    public function hasBillingStrategy(string $key): bool
    {
        return isset($this->billingStrategies[$key]);
    }

    public function hasAssignmentStrategy(string $key): bool
    {
        return isset($this->assignmentStrategies[$key]);
    }

    public function billingStrategy(string $key): EnrollmentBillingStrategy
    {
        return $this->billingStrategies[$key] ?? throw new InvalidArgumentException("Unknown enrollment billing strategy [{$key}].");
    }

    public function assignmentStrategy(string $key): EnrollmentAssignmentStrategy
    {
        return $this->assignmentStrategies[$key] ?? throw new InvalidArgumentException("Unknown enrollment assignment strategy [{$key}].");
    }

    /** @return array<string, array<string, mixed>> */
    public function manifest(): array
    {
        return [
            'rules' => collect($this->rules)->map(fn (EnrollmentRuleHandler $handler): array => $this->manifestItem($handler, $handler->configurationSchema()))->all(),
            'actions' => collect($this->actions)->map(fn (EnrollmentActionHandler $handler): array => $this->manifestItem($handler, payloadSchema: $handler->payloadSchema()))->all(),
            'billing_strategies' => collect($this->billingStrategies)->map(fn (EnrollmentBillingStrategy $strategy): array => $this->manifestItem($strategy))->all(),
            'assignment_strategies' => collect($this->assignmentStrategies)->map(fn (EnrollmentAssignmentStrategy $strategy): array => $this->manifestItem($strategy))->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function manifestItem(object $handler, ?array $configurationSchema = null, ?array $payloadSchema = null): array
    {
        $operatorSchema = $handler instanceof EnrollmentOperatorSchemaProvider
            ? $handler->operatorSchema()
            : $configurationSchema;
        if (is_array($operatorSchema)) {
            $description = (string) ($operatorSchema['description'] ?? 'Configure this enrollment behavior.');
            $operatorSchema = [
                'description' => $description,
                'what_it_does' => $description,
                'impact' => 'This setting is evaluated whenever the matching enrollment policy applies.',
                'example' => 'Use the recommended default first, then test it with a representative student.',
                'docs_anchor' => 'enrollment-policies/overview',
                ...$operatorSchema,
            ];
            $operatorSchema['fields'] = collect($operatorSchema['fields'] ?? [])->map(function (array $field): array {
                $label = (string) ($field['label'] ?? 'Setting');

                return [
                    'description' => "Choose the {$label} used when this policy applies.",
                    'placeholder' => "Enter {$label}",
                    'example' => null,
                    'recommended' => $field['default'] ?? null,
                    'min' => $field['minimum'] ?? null,
                    'max' => $field['maximum'] ?? null,
                    'step' => $field['step'] ?? null,
                    ...$field,
                ];
            })->all();
        }

        return [
            ...$handler->metadata(),
            'operator_configurable' => $operatorSchema !== null,
            'operator_schema' => $operatorSchema,
            'payload_schema' => $payloadSchema,
        ];
    }
}
