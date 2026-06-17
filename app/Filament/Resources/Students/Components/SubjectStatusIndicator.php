<?php

declare(strict_types=1);

namespace App\Filament\Resources\Students\Components;

use Filament\Schemas\Components\Component;
use Override;

final class SubjectStatusIndicator extends Component
{
    #[Override]
    protected string $view = 'filament.resources.students.components.subject-status-indicator';

    public static function make(string $matchType): static
    {
        $instance = app(self::class);
        $instance->state(['matchType' => $matchType]);

        return $instance;
    }
}
