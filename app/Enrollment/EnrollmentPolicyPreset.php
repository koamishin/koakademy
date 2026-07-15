<?php

declare(strict_types=1);

namespace App\Enrollment;

use App\Enums\EnrollStat;

final class EnrollmentPolicyPreset
{
    /** @return array<string, array{label:string, description:string}> */
    public static function catalog(): array
    {
        return [
            'legacy' => ['label' => 'Current legacy process', 'description' => 'Department review followed by cashier verification.'],
            'registrar_cashier' => ['label' => 'Registrar and cashier', 'description' => 'Registrar approval followed by cashier verification.'],
            'manual' => ['label' => 'Manual enrollment', 'description' => 'Staff review and assign subjects manually.'],
            'automatic_curriculum' => ['label' => 'Automatic curriculum', 'description' => 'Automatically assign curriculum subjects before review.'],
            'no_payment' => ['label' => 'No-payment enrollment', 'description' => 'Complete enrollment after academic approval without a payment gate.'],
        ];
    }

    /** @return array<string, mixed> */
    public static function configuration(string $preset): array
    {
        return match ($preset) {
            'registrar_cashier' => self::registrarAndCashier(),
            'manual' => self::manual(),
            'automatic_curriculum' => self::automaticCurriculum(),
            'no_payment' => self::noPayment(),
            default => self::standard(),
        };
    }

    /** @return array<string, mixed> */
    public static function standard(): array
    {
        return [
            'schema_version' => 1,
            'rules' => [
                ['key' => 'channels', 'handler' => 'availability.channel', 'configuration' => ['allowed' => ['public', 'administrator', 'continuing']]],
                ['key' => 'duplicates', 'handler' => 'eligibility.duplicate_enrollment', 'configuration' => []],
            ],
            'requirements' => [],
            'assignment' => ['strategy' => 'assignment.manual', 'configuration' => []],
            'billing' => [
                'strategy' => 'billing.course_rate',
                'configuration' => ['minimum_payment' => ['type' => 'none']],
                'allowed_payment_methods' => [],
            ],
            'workflow' => [
                'steps' => [
                    [
                        'key' => 'submitted', 'label' => 'Submitted', 'entry' => true, 'terminal' => false,
                        'status' => EnrollStat::Pending->value, 'permission' => 'Update:StudentEnrollment', 'actions' => [],
                        'transitions' => [['key' => 'academic_review', 'label' => 'Verify academics', 'to' => 'academic_verified', 'fallback' => true, 'conditions' => []]],
                    ],
                    [
                        'key' => 'academic_verified', 'label' => 'Academic verification', 'entry' => false, 'terminal' => false,
                        'status' => EnrollStat::VerifiedByDeptHead->value, 'permission' => 'Update:StudentEnrollment',
                        'actions' => [['key' => 'academic_status', 'handler' => 'enrollment.verify_academic', 'configuration' => ['status' => EnrollStat::VerifiedByDeptHead->value]]],
                        'transitions' => [['key' => 'payment_review', 'label' => 'Verify payment', 'to' => 'completed', 'fallback' => true, 'conditions' => []]],
                    ],
                    [
                        'key' => 'completed', 'label' => 'Completed', 'entry' => false, 'terminal' => true,
                        'status' => EnrollStat::VerifiedByCashier->value, 'outcome' => 'completed', 'permission' => 'Update:StudentEnrollment',
                        'actions' => [
                            ['key' => 'payment_status', 'handler' => 'enrollment.verify_payment', 'configuration' => ['status' => EnrollStat::VerifiedByCashier->value]],
                            ['key' => 'complete_outcome', 'handler' => 'enrollment.set_outcome', 'configuration' => ['outcome' => 'completed']],
                        ],
                        'transitions' => [],
                    ],
                ],
            ],
            'notifications' => [],
        ];
    }

    /** @return array<string, mixed> */
    private static function registrarAndCashier(): array
    {
        $configuration = self::standard();
        $configuration['workflow']['steps'][1]['label'] = 'Registrar approval';

        return $configuration;
    }

    /** @return array<string, mixed> */
    private static function manual(): array
    {
        $configuration = self::standard();
        $configuration['workflow']['steps'][0]['transitions'][0]['label'] = 'Complete staff review';
        $configuration['workflow']['steps'][1]['label'] = 'Staff review';
        $configuration['assignment'] = ['strategy' => 'assignment.manual', 'configuration' => []];

        return $configuration;
    }

    /** @return array<string, mixed> */
    private static function automaticCurriculum(): array
    {
        $configuration = self::standard();
        $configuration['assignment'] = [
            'strategy' => 'assignment.curriculum_automatic',
            'configuration' => ['include_irregular_subjects' => false],
        ];
        $configuration['workflow']['steps'][0]['actions'][] = [
            'key' => 'assign_curriculum',
            'handler' => 'enrollment.assign_subjects',
            'configuration' => ['source' => 'curriculum', 'allow_cross_program_subjects' => false],
        ];

        return $configuration;
    }

    /** @return array<string, mixed> */
    private static function noPayment(): array
    {
        $configuration = self::standard();
        $configuration['billing']['configuration'] = [
            'discount_percentage' => 0,
            'minimum_payment_type' => 'none',
            'minimum_payment_value' => 0,
        ];
        $configuration['workflow']['steps'][1]['transitions'][0]['label'] = 'Complete enrollment';
        $configuration['workflow']['steps'][2]['actions'] = [[
            'key' => 'complete_outcome',
            'handler' => 'enrollment.set_outcome',
            'configuration' => ['outcome' => 'completed'],
        ]];

        return $configuration;
    }
}
