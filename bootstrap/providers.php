<?php

declare(strict_types=1);

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    App\Providers\Filament\AdminPanelProvider::class,
    App\Providers\Filament\PortalPanelProvider::class,
    ...(filter_var(env('HORIZON_ENABLED', PHP_OS_FAMILY !== 'Windows'), FILTER_VALIDATE_BOOLEAN) ? [
        App\Providers\HorizonServiceProvider::class,
    ] : []),
    App\Providers\NotificationChannelServiceProvider::class,
    App\Providers\PulseServiceProvider::class,
    App\Providers\TelescopeServiceProvider::class,
    EragLaravelPwa\EragLaravelPwaServiceProvider::class,
    SaaSykit\OpenGraphy\OpenGraphyServiceProvider::class,
];
