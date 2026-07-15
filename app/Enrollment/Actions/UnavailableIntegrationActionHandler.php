<?php

declare(strict_types=1);

namespace App\Enrollment\Actions;

use App\Contracts\Enrollment\EnrollmentActionHandler;
use App\Data\Enrollment\ActionResult;
use App\Data\Enrollment\EnrollmentContext;

final readonly class UnavailableIntegrationActionHandler implements EnrollmentActionHandler
{
    public function __construct(private string $handlerKey, private string $label) {}

    public function key(): string
    {
        return $this->handlerKey;
    }

    public function metadata(): array
    {
        return ['key' => $this->key(), 'label' => $this->label, 'category' => 'integration', 'requires_configuration' => true];
    }

    public function payloadSchema(): array
    {
        return ['type' => 'object'];
    }

    public function execute(EnrollmentContext $context, array $configuration, string $idempotencyKey): ActionResult
    {
        return ActionResult::failure("The [{$this->handlerKey}] integration has not been configured for this installation.");
    }
}
