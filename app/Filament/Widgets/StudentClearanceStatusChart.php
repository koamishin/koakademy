<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Models\Student;
use Filament\Widgets\ChartWidget;
use Override;

final class StudentClearanceStatusChart extends ChartWidget
{
    #[Override]
    protected static ?int $sort = 5;

    #[Override]
    protected ?string $heading = 'Student Clearance Status';

    #[Override]
    protected ?string $description = 'Overview of student clearance completion status';

    #[Override]
    protected string $color = 'warning';

    #[Override]
    protected ?string $pollingInterval = '60s';

    #[Override]
    protected ?string $maxHeight = '400px';

    #[Override]
    protected int|string|array $columnSpan = [
        'md' => 2,
        'xl' => 1,
    ];

    protected function getData(): array
    {
        // Get clearance status data
        $clearedStudents = Student::query()->whereHas('clearances', function ($query): void {
            $query->where('is_cleared', true);
        })->count();

        $notClearedStudents = Student::query()->whereHas('clearances', function ($query): void {
            $query->where('is_cleared', false);
        })->count();

        $noClearanceStudents = Student::query()->whereDoesntHave('clearances')->count();

        return [
            'datasets' => [
                [
                    'label' => 'Students by Clearance Status',
                    'data' => [$clearedStudents, $notClearedStudents, $noClearanceStudents],
                    'backgroundColor' => [
                        'rgba(34, 197, 94, 0.8)',    // Green for cleared
                        'rgba(239, 68, 68, 0.8)',    // Red for not cleared
                        'rgba(156, 163, 175, 0.8)',  // Gray for no clearance
                    ],
                    'borderColor' => [
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(156, 163, 175, 1)',
                    ],
                    'borderWidth' => 2,
                ],
            ],
            'labels' => ['Cleared', 'Not Cleared', 'No Clearance Record'],
        ];
    }

    protected function getType(): string
    {
        return 'pie';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => true,
                    'position' => 'bottom',
                ],
                'tooltip' => [
                    'callbacks' => [
                        'label' => 'function(context) { return context.label + ": " + context.parsed + " students (" + Math.round(context.parsed / context.dataset.data.reduce((a, b) => a + b, 0) * 100) + "%)"; }',
                    ],
                ],
            ],
            'responsive' => true,
            'maintainAspectRatio' => false,
        ];
    }
}
