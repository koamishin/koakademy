<?php

declare(strict_types=1);

use App\Filament\Plugins\Widgets\PennantFeatureAdoptionWidget;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Livewire\Livewire;

it('registers the legacy vendor widget alias for existing livewire payloads', function (): void {
    expect(Livewire::exists('daacreators.pennant-manager.widgets.feature-adoption-widget'))->toBeTrue();
});

it('renders active feature adoption stats without database specific json functions', function (): void {
    config()->set('pennant-manager.scope_models', [
        'User' => [
            'model' => User::class,
            'search_column' => 'email',
            'label_column' => 'name',
        ],
    ]);

    $activeUser = User::factory()->create();
    $inactiveUser = User::factory()->create();

    DB::table('features')->insert([
        [
            'name' => 'App\\Features\\Toggles\\FacultyDashboard',
            'scope' => User::class.'|'.$activeUser->id,
            'value' => json_encode(['enabled' => true], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'name' => 'App\\Features\\Toggles\\FacultyDashboard',
            'scope' => User::class.'|'.$inactiveUser->id,
            'value' => json_encode(['enabled' => false], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ]);

    DB::enableQueryLog();

    $stats = invokePennantFeatureAdoptionStats();

    $queries = collect(DB::getQueryLog())->pluck('query')->implode(' ');

    expect($queries)->not->toContain('JSON_EXTRACT')
        ->and($stats)->toHaveCount(1)
        ->and($stats[0]->getValue())->toBe('50%')
        ->and($stats[0]->getDescription())->toBe('Active for 1 User');
});

/**
 * @return array<int, Filament\Widgets\StatsOverviewWidget\Stat>
 */
function invokePennantFeatureAdoptionStats(): array
{
    $widget = app(PennantFeatureAdoptionWidget::class);
    $method = new ReflectionMethod($widget, 'getStats');

    return $method->invoke($widget);
}
