<?php

declare(strict_types=1);

namespace App\Features\Toggles;

use App\Features\Concerns\ResolvesFeatureToggle;
use App\Features\Contracts\FeatureToggle;

final class StudentInformationUpdates implements FeatureToggle
{
    use ResolvesFeatureToggle;

    public function key(): string
    {
        return 'student-information-updates';
    }

    public function name(): string
    {
        return 'Student Information Updates';
    }

    public function summary(): string
    {
        return 'Let students update safe profile, contact, family, and education information from their portal.';
    }

    public function audience(): string
    {
        return 'student';
    }

    public function badge(): string
    {
        return 'Student info';
    }

    public function accent(): string
    {
        return 'text-blue-500';
    }

    public function ctaLabel(): string
    {
        return 'Complete student information';
    }

    public function ctaUrl(): string
    {
        return '/student/profile#student-information';
    }

    public function steps(): array
    {
        return [
            [
                'title' => 'Student information',
                'summary' => 'Students can keep their personal, contact, family, and education information complete.',
                'highlights' => ['Profile-only fields', 'Completion reminders', 'Student-friendly examples'],
                'stats' => [
                    ['label' => 'Route', 'value' => '/student/profile'],
                    ['label' => 'CTA', 'value' => 'Student Information'],
                ],
                'badge' => 'Student info',
                'accent' => 'text-blue-500',
                'icon' => 'graduation-cap',
                'image' => null,
            ],
        ];
    }

    public function category(): string
    {
        return 'Student';
    }
}
