<?php

declare(strict_types=1);

namespace App\Filament\Plugins\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use stdClass;

final class PennantFeatureAdoptionWidget extends BaseWidget
{
    protected ?string $heading = 'Feature Adoption';

    protected function getStats(): array
    {
        $modelCounts = $this->getConfiguredScopeModelCounts();

        if ($modelCounts === []) {
            return $this->getEmptyStateStats();
        }

        $groupedFeatures = [];

        foreach ($this->getActiveScopedFeatures() as $feature) {
            $parts = explode('|', (string) $feature->scope, 2);

            if (count($parts) !== 2) {
                continue;
            }

            [$modelClass] = $parts;

            if (! array_key_exists($modelClass, $modelCounts)) {
                continue;
            }

            $featureName = (string) $feature->name;
            $groupedFeatures[$featureName][$modelClass] ??= 0;
            $groupedFeatures[$featureName][$modelClass]++;
        }

        $stats = [];

        foreach ($groupedFeatures as $featureName => $models) {
            foreach ($models as $modelClass => $activeCount) {
                $total = $modelCounts[$modelClass];
                $percentage = round(($activeCount / $total) * 100, 1);
                $modelName = class_basename($modelClass);

                $stats[] = Stat::make("{$featureName} ({$modelName}s)", "{$percentage}%")
                    ->description("Active for {$activeCount} {$modelName}")
                    ->descriptionIcon('heroicon-m-chart-pie')
                    ->color('info');
            }
        }

        return $stats === [] ? $this->getEmptyStateStats() : $stats;
    }

    private function getActiveScopedFeatures(): array
    {
        return DB::table($this->getFeaturesTable())
            ->where('scope', '!=', '__laravel_null')
            ->get()
            ->filter(fn (stdClass $feature): bool => $this->isActiveValue((string) $feature->value))
            ->values()
            ->all();
    }

    private function getConfiguredScopeModelCounts(): array
    {
        $modelCounts = [];

        foreach (config('pennant-manager.scope_models', []) as $modelConfig) {
            $modelClass = is_array($modelConfig) ? ($modelConfig['model'] ?? null) : $modelConfig;

            if (! is_string($modelClass) || ! is_subclass_of($modelClass, Model::class)) {
                continue;
            }

            $modelCounts[$modelClass] = max(1, (int) $modelClass::query()->count());
        }

        return $modelCounts;
    }

    private function isActiveValue(string $value): bool
    {
        $value = mb_trim($value);

        if ($value === 'true' || $value === '1') {
            return true;
        }

        if (! str_starts_with($value, '{')) {
            return false;
        }

        $decodedValue = json_decode($value, true);

        if (! is_array($decodedValue)) {
            return false;
        }

        return in_array($decodedValue['enabled'] ?? false, [true, 'true', 1, '1'], true);
    }

    private function getFeaturesTable(): string
    {
        return (string) config('pennant.stores.database.table', 'features');
    }

    private function getEmptyStateStats(): array
    {
        return [
            Stat::make('Adoption Stats', 'No data')
                ->description('Assign features to scopes to see metrics')
                ->descriptionIcon('heroicon-m-chart-bar')
                ->color('gray'),
        ];
    }
}
