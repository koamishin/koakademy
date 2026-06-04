<?php

declare(strict_types=1);

namespace Modules\Cashier\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

final class RouteServiceProvider extends ServiceProvider
{
    protected string $name = 'Cashier';

    /**
     * Called before routes are registered.
     *
     * Register any model bindings or pattern based filters.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Define the routes for the application.
     */
    public function map(): void
    {
        $this->mapApiRoutes();
        $this->mapWebRoutes();
    }

    /**
     * Define the "web" routes for the application.
     *
     * These routes all receive session state, CSRF protection, etc.
     */
    protected function mapWebRoutes(): void
    {
        $routes = $this->routePath('web.php');

        if (! is_file($routes)) {
            return;
        }

        Route::middleware('web')->group($routes);
    }

    /**
     * Define the "api" routes for the application.
     *
     * These routes are typically stateless.
     */
    protected function mapApiRoutes(): void
    {
        $routes = $this->routePath('api.php');

        if (! is_file($routes)) {
            return;
        }

        Route::middleware('api')->prefix('api')->name('api.')->group($routes);
    }

    private function routePath(string $file): string
    {
        return dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'routes'.DIRECTORY_SEPARATOR.$file;
    }
}
