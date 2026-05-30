<?php

declare(strict_types=1);

namespace App\Features\Toggles;

use App\Features\Concerns\ResolvesFeatureToggle;
use App\Features\Contracts\FeatureToggle;
use App\Models\User;

final class AdminDeveloperMode implements FeatureToggle
{
    use ResolvesFeatureToggle;

    public function key(): string
    {
        return 'admin-developer-mode';
    }

    public function name(): string
    {
        return 'Developer Mode';
    }

    public function summary(): string
    {
        return 'Enable API key creation for programmatic portal access and development tools.';
    }

    public function audience(): string
    {
        return 'admin';
    }

    public function badge(): string
    {
        return 'Developer';
    }

    public function accent(): string
    {
        return 'text-violet-500';
    }

    public function ctaLabel(): ?string
    {
        return null;
    }

    public function ctaUrl(): ?string
    {
        return null;
    }

    public function steps(): array
    {
        return [
            [
                'title' => 'Developer Mode',
                'summary' => 'Access developer tools, API key management, and debugging features.',
                'highlights' => ['API key management', 'Developer tools', 'Debugging features'],
                'stats' => [
                    ['label' => 'Status', 'value' => 'Opt-in'],
                    ['label' => 'Menu', 'value' => 'Developer Mode'],
                ],
                'badge' => 'Developer',
                'accent' => 'text-violet-500',
                'icon' => 'code',
                'image' => null,
            ],
        ];
    }

    public function category(): string
    {
        return 'Administrator';
    }

    public function resolve(User $scope): bool
    {
        return false;
    }
}
