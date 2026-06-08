<?php

declare(strict_types=1);

use Illuminate\Support\ServiceProvider;
use Modules\Announcement\Providers\RouteServiceProvider as AnnouncementRouteServiceProvider;
use Modules\Cashier\Providers\RouteServiceProvider as CashierRouteServiceProvider;
use Modules\Inventory\Providers\RouteServiceProvider as InventoryRouteServiceProvider;
use Modules\LibrarySystem\Providers\RouteServiceProvider as LibrarySystemRouteServiceProvider;
use Modules\NotificationCenter\Providers\RouteServiceProvider as NotificationCenterRouteServiceProvider;
use Modules\StudentMedicalRecords\Providers\RouteServiceProvider as StudentMedicalRecordsRouteServiceProvider;

function invokeModuleRoutePath(ServiceProvider $provider, string $file): string
{
    $method = new ReflectionMethod($provider, 'routePath');

    return $method->invoke($provider, $file);
}

test('module route providers resolve route files from their module directories', function (string $provider, string $module): void {
    $providerInstance = new $provider(app());

    foreach (['api.php', 'web.php'] as $file) {
        $routePath = invokeModuleRoutePath($providerInstance, $file);

        expect(is_file($routePath))
            ->toBeTrue()
            ->and(realpath($routePath))
            ->toBe(realpath(base_path("Modules/{$module}/routes/{$file}")));
    }
})->with([
    'announcement' => [AnnouncementRouteServiceProvider::class, 'Announcement'],
    'cashier' => [CashierRouteServiceProvider::class, 'Cashier'],
    'inventory' => [InventoryRouteServiceProvider::class, 'Inventory'],
    'library system' => [LibrarySystemRouteServiceProvider::class, 'LibrarySystem'],
    'notification center' => [NotificationCenterRouteServiceProvider::class, 'NotificationCenter'],
    'student medical records' => [StudentMedicalRecordsRouteServiceProvider::class, 'StudentMedicalRecords'],
]);
