<?php

declare(strict_types=1);

namespace App\Contracts\Enrollment;

/**
 * Optional UI metadata for enrollment policy extensions.
 *
 * Handlers that do not implement this contract remain executable, but their
 * configuration is exposed as read-only in the operator editor.
 */
interface EnrollmentOperatorSchemaProvider
{
    /**
     * @return array{
     *     description?: string,
     *     what_it_does?: string,
     *     impact?: string,
     *     example?: string,
     *     docs_anchor?: string,
     *     fields: array<int, array<string, mixed>>
     * }
     */
    public function operatorSchema(): array;
}
